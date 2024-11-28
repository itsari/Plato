const express = require('express');
const bcrypt = require('bcrypt');
const { db, getUserByEmail, createUser, addPlate, getPlatesByUser, getAllPlates } = require('./db');


const router = express.Router();

// Middleware for authentication
function authMiddleware(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
}

// Home route
router.get('/', (req, res) => res.redirect('/login'));

// Login routes
router.get('/login', (req, res) => {
    res.render('layout', {
        title: 'Login',
        user: null, // No user for login page
        content: 'login', // Pass the view name directly
        error: null
    });
});


router.post('/login', (req, res) => {
    const { email, password } = req.body;
    getUserByEmail(email, (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password)) {
            return res.render('layout', {
                title: 'Login',
                user: null,
                content: `<%- include('login') %>`,
                error: 'Invalid credentials'
            });
        }
        req.session.userId = user.id;
        req.session.isAdmin = user.isAdmin;
        res.redirect('/dashboard');
    });
});
// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Failed to logout. Please try again.');
        }
        res.redirect('/login'); // Redirect to login page after logout
    });
});

// Signup routes

router.get('/signup', (req, res) => {
    res.render('layout', {
        title: 'Signup',
        user: null, // No user for signup page
        content: 'signup', // Specify the content view
        error: null
    });
});

router.post('/signup', (req, res) => {
    const { name, email, phone, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    createUser(name, email, phone, hashedPassword, 0, (err) => {
        if (err) {
            return res.render('layout', {
                title: 'Signup',
                user: null,
                content: 'signup',
                error: 'Error creating user'
            });
        }
        res.redirect('/login');
    });
});


// Dashboard route
router.get('/dashboard', authMiddleware, (req, res) => {
    if (req.session.isAdmin) {
        getAllPlates((err, plates) => {
            if (err) {
                return res.status(500).send('Database error');
            }
            res.render('layout', {
                title: 'Admin Dashboard',
                user: req.session,
                content: 'admin-plates',
                plates
            });
        });
    } else {
        getPlatesByUser(req.session.userId, (err, plates) => {
            if (err) {
                return res.status(500).send('Database error');
            }
            res.render('layout', {
                title: 'My Dashboard',
                user: req.session,
                content: 'my-plates',
                plates
            });
        });
    }
});


// Route to display the add plate form
router.get('/add-plate', authMiddleware, (req, res) => {
    res.render('layout', {
        title: 'Add Plate',
        user: req.session, // Pass user session info
        content: 'add-plate', // View for the add plate form
        error: null
    });
});

// Route to handle adding a new plate
router.post('/add-plate', authMiddleware, (req, res) => {
    const { plate, owner, phone, vehicle_type, color } = req.body;
    const photos = req.files ? req.files.map(file => file.filename) : [];

    addPlate(plate, owner, phone, vehicle_type, color, photos, req.session.userId, (err) => {
        if (err) {
            return res.render('layout', {
                title: 'Add Plate',
                user: req.session,
                content: 'add-plate',
                error: 'Error adding plate. Please try again.'
            });
        }
        res.redirect('/dashboard');
    });
});
// Route to display the edit plate form
router.get('/edit-plate/:id', authMiddleware, (req, res) => {
    const plateId = req.params.id;

    db.get('SELECT * FROM plates WHERE id = ?', [plateId], (err, plate) => {
        if (err || !plate) {
            return res.status(404).send('Plate not found');
        }

        res.render('layout', {
            title: 'Edit Plate',
            user: req.session, // Pass user session info
            content: 'edit-plate', // View for the edit plate form
            plate // Pass the plate details to the view
        });
    });
});

// Route to handle updating a plate
router.post('/edit-plate/:id', authMiddleware, (req, res) => {
    const plateId = req.params.id;
    const { plate, owner, phone, vehicle_type, color } = req.body;
    const photos = req.files ? req.files.map(file => file.filename) : [];

    db.run(
        `UPDATE plates SET plate = ?, owner = ?, phone = ?, vehicle_type = ?, color = ?, photos = ? WHERE id = ?`,
        [plate, owner, phone, vehicle_type, color, JSON.stringify(photos), plateId],
        (err) => {
            if (err) {
                return res.status(500).send('Error updating plate');
            }
            res.redirect('/dashboard'); // Redirect back to the dashboard
        }
    );
});
// Route to handle deleting a plate
router.get('/delete-plate/:id', authMiddleware, (req, res) => {
    const plateId = req.params.id;

    db.run('DELETE FROM plates WHERE id = ?', [plateId], (err) => {
        if (err) {
            console.error('Error deleting plate:', err);
            return res.status(500).send('Failed to delete plate. Please try again.');
        }
        res.redirect('/dashboard'); // Redirect back to dashboard after deletion
    });
});


module.exports = router;
