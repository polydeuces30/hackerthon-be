const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Initialize app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', //  no pass
    database: 'user_data',
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return;
    }
    console.log('Connected to the database as id ' + db.threadId);
});

// Verify JWT & extract user info
const authenticateToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.redirect('/login');

    jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    });
};

// Landing Page
app.get('/', authenticateToken, (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Welcome</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .profile-box { position: absolute; top: 10px; left: 10px; border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9; cursor: pointer; }
                    .profile-box:hover { background-color: #f1f1f1; }
                    .logout-button { position: absolute; top: 70px; left: 10px; padding: 10px; background-color: #ff4d4d; color: white; border: none; cursor: pointer; }
                    .logout-button:hover { background-color: #ff1a1a; }
                    .nav-buttons { position: absolute; top: 150px; left: 10px; display: flex; flex-direction: column; }
                    .nav-buttons button { margin: 5px; padding: 10px; background-color: #007bff; color: white; border: none; cursor: pointer; }
                    .nav-buttons button:hover { background-color: #0056b3; }
                    h1 { color: #333; text-align: center; }
                    p { color: #555; text-align: center; }
                </style>
            </head>
            <body>
                <div class="profile-box" onclick="window.location.href='/useredit'">
                    <strong>Username:</strong> ${req.user.username}<br>
                    <strong>Email:</strong> ${req.user.email}
                </div>
                <button class="logout-button" onclick="window.location.href='/logout'">Logout</button>
                <div class="nav-buttons">
                    <button onclick="window.location.href='/login'">Go to Login</button>
                    <button onclick="window.location.href='/register'">Go to Register</button>
                </div>
                <h1>Welcome to the Login and Registration System</h1>
                <p>Your one-stop solution for user management.</p>
            </body>
        </html>
    `);
});

// Logout endpoint
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Login Page
app.get('/login', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Login</title>
                <style>
                    body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; }
                    form { display: flex; flex-direction: column; align-items: center; width: 300px; }
                    input { margin: 5px; padding: 10px; width: 100%; }
                    button { margin: 10px; padding: 10px; width: 100%; }
                    a { margin-top: 10px; color: #007BFF; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <form method="POST" action="/login">
                    <h2>Login</h2>
                    <input type="email" name="email" placeholder="Email" required />
                    <input type="password" name="password" placeholder="Password" required />
                    <button type="submit">Login</button>
                    <a href="/register">Don't have an account? Register here</a>
                </form>
            </body>
        </html>
    `);
});

// Register Page
app.get('/register', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Register</title>
                <style>
                    body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; }
                    form { display: flex; flex-direction: column; align-items: center; width: 300px; }
                    input { margin: 5px; padding: 10px; width: 100%; }
                    button { margin: 10px; padding: 10px; width: 100%; }
                    a { margin-top: 10px; color: #007BFF; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <form method="POST" action="/register">
                    <h2>Register</h2>
                    <input type="text" name="username" placeholder="Username" required />
                    <input type="email" name="email" placeholder="Email" required />
                    <input type="password" name="password" placeholder="Password" required />
                    <button type="submit">Register</button>
                    <a href="/login">Already have an account? Login here</a>
                </form>
            </body>
        </html>
    `);
});

// Handle register
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(query, [username, email, hashedPassword], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.redirect('/login');
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error during registration' });
    }
});

// Handle login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, 'your_secret_key', { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true }).redirect('/');
    });
});

// User edit page
app.get('/useredit', authenticateToken, (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Edit Profile</title>
                <style>
                    body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; }
                    form { display: flex; flex-direction: column; align-items: center; width: 300px; }
                    input { margin: 5px; padding: 10px; width: 100%; }
                    button { margin: 10px; padding: 10px; width: 100%; }
                </style>
            </head>
            <body>
                <form method="POST" action="/useredit">
                    <h2>Edit Profile</h2>
                    <input type="text" name="username" value="${req.user.username}" placeholder="New Username" required />
                    <input type="email" name="email" value="${req.user.email}" placeholder="New Email" required />
                    <input type="password" name="password" placeholder="New Password" />
                    <input type="password" name="confirmPassword" placeholder="Confirm New Password" />
                    <button type="submit">Save Changes</button>
                </form>
            </body>
        </html>
    `);
});

// Handle user profile update
app.post('/useredit', authenticateToken, async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
    }

    if (password && password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        const updates = { username, email };
        if (password) {
            updates.password = await bcrypt.hash(password, 10);
        }

        const query = password
            ? 'UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?'
            : 'UPDATE users SET username = ?, email = ? WHERE id = ?';

        const params = password
            ? [updates.username, updates.email, updates.password, req.user.id]
            : [updates.username, updates.email, req.user.id];

        db.query(query, params, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.redirect('/');
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating profile' });
    }
});

// Users page
app.get('/users', (req, res) => {
    const query = 'SELECT id, username, email FROM users';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        let table = `
            <html>
                <head>
                    <title>Users</title>
                    <style>
                        table { border-collapse: collapse; width: 80%; margin: 20px auto; font-family: Arial, sans-serif; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f4f4f4; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        tr:hover { background-color: #f1f1f1; }
                    </style>
                </head>
                <body>
                    <h2 style="text-align: center;">User List</h2>
                    <table>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                        </tr>`;
        results.forEach((user) => {
            table += `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                        </tr>`;
        });
        table += `
                    </table>
                </body>
            </html>`;
        res.send(table);
    });
});

// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
