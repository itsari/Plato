const express = require('express');
const { db } = require('./db');
const multer = require('multer');
const fs = require('fs');
const { ensureAuthenticated, ensureAdmin } = require('./middlewares');

const { fetchCarDetails } = require('./helper');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Login routes
router.get('/login', (req, res) => res.render('login', { error: null }));
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (user) {
            req.session.user = user;
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Invalid credentials' });
        }
    });
});

// Signup routes
router.get('/signup', (req, res) => res.render('signup', { error: null }));
router.post('/signup', (req, res) => {
    const { username, password, email, phone } = req.body;
    db.run('INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)', [username, password, email, phone], function (err) {
        if (err) {
            res.render('signup', { error: 'User already exists' });
        } else {
            res.redirect('/login');
        }
    });
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// Dashboard route
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    const userId = req.session.user.role === 'admin' ? null : req.session.user.id;
    const sql = userId ? 'SELECT * FROM vehicles WHERE userId = ?' : 'SELECT * FROM vehicles';
    const params = userId ? [userId] : [];

    db.all(sql, params, (err, vehicles) => {
        res.render('dashboard', { vehicles, user: req.session.user });
    });
});

// Add vehicle routes
router.get('/add', ensureAuthenticated, (req, res) => res.render('add', { error: null }));


router.post('/add', ensureAuthenticated, upload.array('photos', 3), async (req, res) => {
    const { plate, owner, phone, vehicleType, color } = req.body;
    const userId = req.session.user.id;

    try {
        // Fetch missing details for the car
        const carDetails = await fetchCarDetails(plate);

        // Use fetched details or fallback to user input
        const finalVehicleType = vehicleType || carDetails.vehicleType || 'Unknown';
        const finalColor = color || carDetails.color || 'Unknown';
        const carMaker = carDetails.car_maker || 'Unknown';
        const model = carDetails.model || 'Unknown';
        const buildYear = carDetails.build_year || null;

        // Insert the car into the database
        db.run(
            `INSERT INTO vehicles (plate, owner, phone, vehicleType, color, car_maker, model, build_year, userId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [plate, owner, phone, finalVehicleType, finalColor, carMaker, model, buildYear, userId],
            function (err) {
                if (err) {
                    console.error('Database error:', err.message);
                    res.render('add', { error: 'Failed to add vehicle' });
                } else {
                    const vehicleId = this.lastID;

                    // Save uploaded photos
                    req.files.forEach(file => {
                        const photo = fs.readFileSync(file.path);
                        db.run('INSERT INTO photos (vehicleId, photo) VALUES (?, ?)', [vehicleId, photo]);
                    });

                    res.redirect('/dashboard');
                }
            }
        );
    } catch (error) {
        console.error('Error fetching car details:', error.message);
        res.render('add', { error: 'Failed to fetch additional car details. Please try again.' });
    }
});

// router.post('/add', ensureAuthenticated, upload.array('photos', 3), (req, res) => {
//     const { plate, owner, phone, vehicleType, color } = req.body;
//     const userId = req.session.user.id;

//     db.run('INSERT INTO vehicles (plate, owner, phone, vehicleType, color, userId) VALUES (?, ?, ?, ?, ?, ?)',
//         [plate, owner, phone, vehicleType, color, userId], function (err) {
//             if (err) {
//                 res.render('add', { error: 'Failed to add vehicle' });
//             } else {
//                 const vehicleId = this.lastID;
//                 req.files.forEach(file => {
//                     const photo = fs.readFileSync(file.path);
//                     db.run('INSERT INTO photos (vehicleId, photo) VALUES (?, ?)', [vehicleId, photo]);
//                 });
//                 res.redirect('/dashboard');
//             }
//         });
// });

// View single vehicle route
router.get('/vehicle/:id', ensureAuthenticated, (req, res) => {
    const vehicleId = req.params.id;
    db.get('SELECT * FROM vehicles WHERE id = ?', [vehicleId], (err, vehicle) => {
        if (vehicle) {
            db.all('SELECT * FROM photos WHERE vehicleId = ?', [vehicleId], (err, photos) => {
                res.render('vehicle', { vehicle, photos });
            });
        } else {
            res.redirect('/dashboard');
        }
    });
});

// Edit vehicle routes
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    const vehicleId = req.params.id;
    db.get('SELECT * FROM vehicles WHERE id = ?', [vehicleId], (err, vehicle) => {
        res.render('edit', { vehicle, error: null });
    });
});
router.post('/edit/:id', ensureAuthenticated, upload.array('photos', 3), (req, res) => {
    const { plate, owner, phone, vehicleType, color } = req.body;
    const vehicleId = req.params.id;

    db.run('UPDATE vehicles SET plate = ?, owner = ?, phone = ?, vehicleType = ?, color = ? WHERE id = ?',
        [plate, owner, phone, vehicleType, color, vehicleId], function (err) {
            if (err) {
                res.render('edit', { vehicle: req.body, error: 'Failed to update vehicle' });
            } else {
                req.files.forEach(file => {
                    const photo = fs.readFileSync(file.path);
                    db.run('INSERT INTO photos (vehicleId, photo) VALUES (?, ?)', [vehicleId, photo]);
                });
                res.redirect('/dashboard');
            }
        });
});

// Delete vehicle route
router.post('/delete/:id', ensureAuthenticated, (req, res) => {
    const vehicleId = req.params.id;
    db.run('DELETE FROM vehicles WHERE id = ?', [vehicleId], function (err) {
        if (!err) {
            db.run('DELETE FROM photos WHERE vehicleId = ?', [vehicleId]);
        }
        res.redirect('/dashboard');
    });
});

module.exports = router;
