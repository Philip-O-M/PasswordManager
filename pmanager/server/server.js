const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { Keychain } = require('./password-manager');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();

app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

app.use(bodyParser.json());

const usersDir = path.join(__dirname, 'users');

if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir);
}

let isAuthenticated = false;
let currentUser = null;

function hashUsername(username) {
    return crypto.createHash('sha256').update(username.toLowerCase()).digest('hex');
}

function getUserFilePath(hashedUsername) {
    return path.join(usersDir, `${hashedUsername}.json`);
}

const usernameMappings = new Map();

function isAuthenticatedMiddleware(req, res, next) {
    if (!isAuthenticated || !currentUser) {
        return res.status(401).send({ error: 'Unauthorized: Please login first' });
    }
    next();
}

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedUsername = hashUsername(username);
    const userFilePath = getUserFilePath(hashedUsername);

    if (fs.existsSync(userFilePath)) {
        return res.status(400).send({ error: 'Username already exists' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const keychainInstance = await Keychain.init(password);
        
        const { serializedData, checksum } = await keychainInstance.dump();

        const encryptedUsername = await bcrypt.hash(username, 10);

        const userData = {
            encryptedUsername, 
            passwordHash,
            serializedData,
            trustedChecksum: checksum
        };

        fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
        usernameMappings.set(username.toLowerCase(), hashedUsername);
        
        res.status(201).send({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const hashedUsername = hashUsername(username);
    const userFilePath = getUserFilePath(hashedUsername);

    if (!fs.existsSync(userFilePath)) {
        return res.status(404).send({ error: 'Username not found' });
    }

    try {
        const userData = JSON.parse(fs.readFileSync(userFilePath));
        const { passwordHash, serializedData, trustedChecksum } = userData;

        const passwordMatch = await bcrypt.compare(password, passwordHash);
        if (!passwordMatch) {
            return res.status(401).send({ error: 'Invalid credentials' });
        }

        const keychainInstance = await Keychain.load(password, serializedData, trustedChecksum);

        currentUser = {
            username: hashedUsername, 
            password,
            originalUsername: username 
        };
        isAuthenticated = true;

        res.status(200).send({ message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send({ error: error.message });
    }
});


app.post('/set', isAuthenticatedMiddleware, async (req, res) => {
    const { domain, password } = req.body;

    try {
        const userFilePath = getUserFilePath(currentUser.username);
        const userData = JSON.parse(fs.readFileSync(userFilePath));
        
        const keychainInstance = await Keychain.load(
            currentUser.password,
            userData.serializedData,
            userData.trustedChecksum
        );

        await keychainInstance.set(domain, password);
        
        const { serializedData, checksum } = await keychainInstance.dump();

        const updatedUserData = {
            ...userData,
            serializedData,
            trustedChecksum: checksum
        };

        fs.writeFileSync(userFilePath, JSON.stringify(updatedUserData, null, 2));

        res.status(200).send({ message: 'Password set successfully' });
    } catch (error) {
        console.error('Error setting password:', error);
        res.status(500).send({ error: error.message });
    }
});

app.post('/get', isAuthenticatedMiddleware, async (req, res) => {
    const { domain } = req.body;

    try {
        const userFilePath = getUserFilePath(currentUser.username);
        
        if (!fs.existsSync(userFilePath)) {
            return res.status(404).send({ error: 'User data not found' });
        }

        const userData = JSON.parse(fs.readFileSync(userFilePath));
        const { serializedData, trustedChecksum } = userData;

        const keychainInstance = await Keychain.load(
            currentUser.password,
            serializedData,
            trustedChecksum
        );

        const password = await keychainInstance.get(domain);

        if (password) {
            res.status(200).send({ password });
        } else {
            res.status(404).send({ error: 'Password not found for the given domain' });
        }
    } catch (error) {
        console.error('Error retrieving password:', error);
        res.status(500).send({ error: error.message });
    }
});

app.post('/remove', isAuthenticatedMiddleware, async (req, res) => {
    const { domain } = req.body;

    try {
        const userFilePath = getUserFilePath(currentUser.username);
        
        if (!fs.existsSync(userFilePath)) {
            return res.status(404).send({ error: 'User data not found' });
        }

        const userData = JSON.parse(fs.readFileSync(userFilePath));
        
        const keychainInstance = await Keychain.load(
            currentUser.password,
            userData.serializedData,
            userData.trustedChecksum
        );

        const result = await keychainInstance.remove(domain);

        if (result) {
            const { serializedData, checksum } = await keychainInstance.dump();
            
            const updatedUserData = {
                ...userData,
                serializedData,
                trustedChecksum: checksum
            };
            
            fs.writeFileSync(userFilePath, JSON.stringify(updatedUserData, null, 2));
            
            res.status(200).send({ message: 'Password removed successfully' });
        } else {
            res.status(404).send({ error: 'No password found for this domain' });
        }
    } catch (error) {
        console.error('Error removing password:', error);
        res.status(500).send({ error: error.message });
    }
});

app.post('/logout', async (req, res) => {
    try {
        isAuthenticated = false;
        currentUser = null;
        res.clearCookie('auth_token');
        res.status(200).send({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).send({ error: 'Error during logout' });
    }
});

app.options('*', cors());

app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).send({ error: 'Internal server error' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});