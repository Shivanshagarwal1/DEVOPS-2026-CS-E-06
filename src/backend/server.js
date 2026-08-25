const express = require("express");

const app = express();

const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Temporary user storage
let users = [];


// ===============================
// TEST ROUTE
// ===============================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Backend is working"
    });
});


// ===============================
// REGISTRATION API
// ===============================

app.post("/api/register", (req, res) => {

    const { name, email, password } = req.body;

    // Validate fields
    if (!name || !email || !password) {

        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });

    }

    // Check if user already exists
    const existingUser = users.find(
        user => user.email === email
    );

    if (existingUser) {

        return res.status(400).json({
            success: false,
            message: "User already exists"
        });

    }

    // Create new user
    const newUser = {
        id: users.length + 1,
        name: name,
        email: email,
        password: password
    };

    // Store user
    users.push(newUser);

    console.log("New user registered:", email);

    res.status(201).json({
        success: true,
        message: "Registration successful"
    });

});


// ===============================
// LOGIN API
// ===============================

app.post("/api/login", (req, res) => {

    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {

        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });

    }

    // Find user
    const user = users.find(
        user =>
            user.email === email &&
            user.password === password
    );

    // User found
    if (user) {

        console.log("User logged in:", email);

        return res.json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    }

    // Invalid credentials
    res.status(401).json({
        success: false,
        message: "Invalid email or password"
    });

});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});
