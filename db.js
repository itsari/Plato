const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

// Create tables
const initializeDatabase = () => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT,
        phone TEXT,
        role TEXT DEFAULT 'user'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate TEXT UNIQUE,
        owner TEXT,
        phone TEXT,
        vehicleType TEXT,
        color TEXT,
        car_maker TEXT,
        model TEXT,
        build_year INTEGER,
        userId INTEGER,
        FOREIGN KEY(userId) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicleId INTEGER,
        photo BLOB,
        FOREIGN KEY(vehicleId) REFERENCES vehicles(id)
    )`);
};

initializeDatabase();

module.exports = {
    db,
    initializeDatabase
};
