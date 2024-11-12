"use strict";

const crypto = require('crypto').webcrypto;
const stringify = require('json-stable-stringify'); 

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_SIZE = 256; 
const HMAC_KEY_SIZE = 256;
const SALT_SIZE = 16; 
const IV_SIZE = 12; 

class Keychain {
    constructor() {
        this.data = {};
        this.secrets = {}
        this.kvs = {}
    }

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

    static async generateSubkeys(derivedBits) {
        const hmacKeyBits = derivedBits.slice(0, HMAC_KEY_SIZE / 8);
        const aesKeyBits = derivedBits.slice(HMAC_KEY_SIZE / 8);
        const hmacKey = await crypto.subtle.importKey("raw", hmacKeyBits, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
        const aesKey = await crypto.subtle.importKey("raw", aesKeyBits, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
        return { hmacKey, aesKey };
    }

    static async init(password) {
        const instance = new Keychain();
        instance.data.salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
    
        if (!instance.data.salt || instance.data.salt.length === 0) {
            console.error('Salt generation failed in init');
            throw new Error("Failed to generate salt during initialization");
        }
    
        console.log('Generated salt during init:', instance.data.salt);
    
        const derivedBits = await Keychain.deriveMasterKey(password, instance.data.salt);
        const subkeys = await Keychain.generateSubkeys(derivedBits);
        instance.secrets.hmacKey = subkeys.hmacKey;
        instance.secrets.aesKey = subkeys.aesKey;
    
        return instance;
    } 
    

    async hmacDomain(domain) {
        const encoder = new TextEncoder();
        return crypto.subtle.sign("HMAC", this.secrets.hmacKey, encoder.encode(domain));
    }

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

    async set(domain, password) {
        const domainHash = await this.hmacDomain(domain);
        const encryptedPassword = await this.encrypt(password);
        this.kvs[Buffer.from(domainHash).toString('hex')] = encryptedPassword;
    }

    async get(domain) {
        const domainHash = await this.hmacDomain(domain);
        const encryptedPassword = this.kvs[Buffer.from(domainHash).toString('hex')];
        return encryptedPassword ? await this.decrypt(encryptedPassword) : null;
    }

    async remove(domain) {
        const domainHash = await this.hmacDomain(domain);
        const hashedDomain = Buffer.from(domainHash).toString('hex');
        if (hashedDomain in this.kvs) {
            delete this.kvs[hashedDomain];
            return true;
        }
        return false;
    }

    async sha256Hash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
        return Buffer.from(hashBuffer).toString("base64");
    }

    async dump() {
        if (!this.data.salt || this.data.salt.length === 0) {
            throw new Error("Salt is not defined or invalid before dumping data");
        }
        
        if (typeof this.kvs !== 'object' || this.kvs === null) {
            throw new Error('KVS must be an object');
        }
    

        const dataToSerialize = {
            kvs: this.kvs,
            salt: Array.from(this.data.salt)
        };
        

        const serializedData = stringify(dataToSerialize);
        

        const checksum = await this.sha256Hash(serializedData);
        
        return {
            serializedData: serializedData,
            checksum: checksum
        };
    }

    static async load(password, serializedData, trustedChecksum) {

        if (!serializedData || !trustedChecksum) {
            throw new Error('Missing serialized data or checksum');
        }


        const calculatedChecksum = await Keychain.prototype.sha256Hash(serializedData);
        
        if (calculatedChecksum !== trustedChecksum) {
            throw new Error("Checksum mismatch");
        }


        const parsedData = JSON.parse(serializedData);
        

        const instance = new Keychain();
        

        if (!parsedData.salt || !Array.isArray(parsedData.salt)) {
            throw new Error("Missing or invalid salt in serialized data");
        }

        instance.data.salt = new Uint8Array(parsedData.salt);
        

        const derivedBits = await Keychain.deriveMasterKey(password, instance.data.salt);
        const subkeys = await Keychain.generateSubkeys(derivedBits);
        instance.secrets.hmacKey = subkeys.hmacKey;
        instance.secrets.aesKey = subkeys.aesKey;
        

        instance.kvs = parsedData.kvs;
        
        return instance;
    }



}

module.exports = { Keychain };
