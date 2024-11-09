"use strict";

const crypto = require('crypto').webcrypto;

// Constants for encryption, HMAC, and key derivation
const PBKDF2_ITERATIONS = 100000;
const AES_KEY_SIZE = 256; // AES-GCM key size in bits
const HMAC_KEY_SIZE = 256; // HMAC key size in bits
const SALT_SIZE = 16; // Salt size in bytes
const IV_SIZE = 12; // AES-GCM IV size in bytes

class Keychain {

    constructor() {
        this.data = {}; // Store non-sensitive information, like metadata.
        this.secrets = {}; // Store sensitive information, like keys.
        this.kvs = {}; // Stores encrypted key-value pairs.
    }

    // Derive master key using PBKDF2 and a salt, and create subkeys for HMAC and AES
    static async deriveMasterKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey(
            "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
        );
        const derivedBits = await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt: salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
            passwordKey,
            AES_KEY_SIZE + HMAC_KEY_SIZE
        );
        return derivedBits;
    }

    // Generate HMAC and AES keys from derived bits
    static async generateSubkeys(derivedBits) {
        const hmacKeyBits = derivedBits.slice(0, HMAC_KEY_SIZE / 8);
        const aesKeyBits = derivedBits.slice(HMAC_KEY_SIZE / 8);
        const hmacKey = await crypto.subtle.importKey("raw", hmacKeyBits, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
        const aesKey = await crypto.subtle.importKey("raw", aesKeyBits, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
        return { hmacKey, aesKey };
    }

    // Initialize Keychain by deriving keys from the master password
    static async init(password) {
        const instance = new Keychain();
        instance.data.salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE)); // Non-sensitive metadata.
        const derivedBits = await Keychain.deriveMasterKey(password, instance.data.salt);
        const subkeys = await Keychain.generateSubkeys(derivedBits);
        instance.secrets.hmacKey = subkeys.hmacKey; // Sensitive key stored in this.secrets.
        instance.secrets.aesKey = subkeys.aesKey;   // Sensitive key stored in this.secrets.
        return instance;
    }

    // Generate HMAC of domain
    async hmacDomain(domain) {
        const encoder = new TextEncoder();
        return crypto.subtle.sign("HMAC", this.secrets.hmacKey, encoder.encode(domain));
    }

    // Encrypt password with AES-GCM
    async encrypt(password) {
        const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
        const encodedPassword = new TextEncoder().encode(password);
        const encryptedPassword = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            this.secrets.aesKey,
            encodedPassword
        );
        return { iv: Array.from(iv), data: Array.from(new Uint8Array(encryptedPassword)) };
    }

    // Decrypt AES-GCM encrypted password
    async decrypt(encrypted) {
        const iv = new Uint8Array(encrypted.iv);
        const encryptedData = new Uint8Array(encrypted.data);
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            this.secrets.aesKey,
            encryptedData
        );
        return new TextDecoder().decode(decrypted);
    }

    // Set password securely
    async set(domain, password) {
        const domainHash = await this.hmacDomain(domain);
        const encryptedPassword = await this.encrypt(password);
        this.kvs[Buffer.from(domainHash).toString('hex')] = encryptedPassword;
    }

    // Retrieve password for a given domain
    async get(domain) {
        const domainHash = await this.hmacDomain(domain);
        const encryptedPassword = this.kvs[Buffer.from(domainHash).toString('hex')];
        return encryptedPassword ? await this.decrypt(encryptedPassword) : null;
    }

    // Remove password for a domain
    async remove(domain) {
        const domainHash = await this.hmacDomain(domain);
        const hashedDomain = Buffer.from(domainHash).toString('hex');
        if (hashedDomain in this.kvs) {
            delete this.kvs[hashedDomain];
            return true;
        }
        return false;
    }

    // Generate SHA-256 checksum for integrity
    async sha256Hash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
        return Buffer.from(hashBuffer).toString("base64");
    }

    // Serialize the key-value store with checksum
    async dump() {
        const kvsString = JSON.stringify({ kvs: this.kvs, salt: Array.from(this.data.salt) }); // Convert salt to an array for JSON
        const checksum = await this.sha256Hash(kvsString);
        return [kvsString, checksum];
    }

     /**
    * Loads the keychain state from the provided representation (repr). The
    * repr variable will contain a JSON encoded serialization of the contents
    * of the KVS (as returned by the dump function). The trustedDataCheck
    * is an *optional* SHA-256 checksum that can be used to validate the 
    * integrity of the contents of the KVS. If the checksum is provided and the
    * integrity check fails, an exception should be thrown. You can assume that
    * the representation passed to load is well-formed (i.e., it will be
    * a valid JSON object).Returns a Keychain object that contains the data
    * from repr. 
    *
    * Arguments:
    *   password:           string
    *   repr:               string
    *   trustedDataCheck: string
    * Return Type: Keychain
    */
    // Load key-value store and verify integrity
    static async load(password, serializedData, trustedChecksum) {
        // Verify checksum
        const actualChecksum = await Keychain.prototype.sha256Hash(serializedData);
        if (actualChecksum !== trustedChecksum) throw new Error("Checksum mismatch");

        // Parse data to retrieve kvs and salt
        const parsedData = JSON.parse(serializedData);
        const instance = new Keychain();

        // Retrieve salt from parsed data and convert to Uint8Array
        if (!parsedData.salt) throw new Error("Missing salt in serialized data");
        instance.data.salt = new Uint8Array(parsedData.salt); // Ensure salt is in correct format

        // Derive keys from password using the salt from parsed data
        const derivedBits = await Keychain.deriveMasterKey(password, instance.data.salt);
        const subkeys = await Keychain.generateSubkeys(derivedBits);
        instance.secrets.hmacKey = subkeys.hmacKey;
        instance.secrets.aesKey = subkeys.aesKey;

        // Attempt to decrypt data to validate password
        try {
            instance.kvs = parsedData.kvs; // Restore kvs only if keys are valid
            // Optionally check if the data can be decrypted
            for (const domain in instance.kvs) {
                await instance.decrypt(instance.kvs[domain]); // Check decryption
            }
        } catch (error) {
            throw new Error("Invalid password or corrupted data"); // Properly throw if it fails
        }

        return instance;
    }
}

module.exports = { Keychain };