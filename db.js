const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data.sqlite'), (err) => {
    if (err) console.error(err.message);
    console.log('Connected to SQLite database.');
});

// Create tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            phone TEXT,
            password TEXT,
            isAdmin INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS plates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plate TEXT,
            owner TEXT,
            phone TEXT,
            vehicle_type TEXT,
            color TEXT,
            photos TEXT,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
});

// Function to get plates for a specific user
const getPlatesByUser = (userId, callback) => {
    db.all('SELECT * FROM plates WHERE user_id = ?', [userId], callback);
};

// Function to get all plates (for admin)
const getAllPlates = (callback) => {
    db.all('SELECT * FROM plates', [], callback);
};

// Other exports
module.exports = {
    db,
    getUserByEmail(email, callback) {
        db.get('SELECT * FROM users WHERE email = ?', [email], callback);
    },
    createUser(name, email, phone, password, isAdmin = 0, callback) {
        db.run(
            'INSERT INTO users (name, email, phone, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, password, isAdmin],
            callback
        );
    },
    addPlate(plate, owner, phone, vehicle_type, color, photos, userId, callback) {
        db.run(
            'INSERT INTO plates (plate, owner, phone, vehicle_type, color, photos, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [plate, owner, phone, vehicle_type, color, JSON.stringify(photos), userId],
            callback
        );
    },
    getPlatesByUser,
    getAllPlates
};
