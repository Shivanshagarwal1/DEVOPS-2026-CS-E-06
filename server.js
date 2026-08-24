const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Temporary in-memory database
let expenses = [];
let nextId = 1;


// GET all expenses
app.get("/api/expenses", (req, res) => {
    res.json(expenses);
});


// ADD expense
app.post("/api/expenses", (req, res) => {

    const { description, amount, category, date } = req.body;

    if (!description || !amount || !category || !date) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const expense = {
        id: nextId++,
        description,
        amount: Number(amount),
        category,
        date
    };

    expenses.push(expense);

    res.status(201).json(expense);
});


// DELETE expense
app.delete("/api/expenses/:id", (req, res) => {

    const id = Number(req.params.id);

    const oldLength = expenses.length;

    expenses = expenses.filter(expense => expense.id !== id);

    if (expenses.length === oldLength) {
        return res.status(404).json({
            message: "Expense not found"
        });
    }

    res.json({
        message: "Expense deleted successfully"
    });
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});