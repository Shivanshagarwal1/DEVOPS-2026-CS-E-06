const express = require("express");

const app = express();

const PORT = 3000;

// Middleware
app.use(express.json());

// Serve frontend files
app.use(express.static("public"));

// Test API
app.get("/api/test", (req, res) => {
    res.json({
        message: "Backend is working"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
