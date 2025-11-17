const express = require("express");
const router = express.Router();
const pool = require("../db");

// for insertion
router.post("/", async (req, res) => {
    try {
        console.log("POST /expenses hit");
        console.log("Body received:", req.body);

        const { amount, category, description, date } = req.body;

        const result = await pool.query(
            `INSERT INTO expenses (amount, category, description, date)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [amount, category, description, date]
        );

        console.log("Inserted:", result.rows[0]);
        res.json(result.rows[0]);

    } catch (err) {
        console.error("Insert error:", err);
        res.status(500).send("Server error");
    }
});

// for fetching
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM expenses ORDER BY id DESC"
        );
        res.json(result.rows);

    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).send("Server error");
    }
});

// for deletion
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query(
            "DELETE FROM expenses WHERE id = $1",
            [id]
        );

        console.log(`Deleted expense with ID: ${id}`);
        res.json("Expense deleted successfully");

    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).send("Server error");
    }
});

// for editing
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, category, description, date } = req.body;

        if (!amount || !category || !date) {
            return res.status(400).json({ error: "Missing required fields for update." });
        }

        const result = await pool.query(
            `UPDATE expenses 
             SET amount = $1, category = $2, description = $3, date = $4 
             WHERE id = $5 
             RETURNING *`, 
            [amount, category, description, date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Expense not found." });
        }

        console.log("Updated Expense:", result.rows[0]);
        res.json(result.rows[0]);

    } catch (err) {
        console.error("Update error:", err);
        res.status(500).send("Server error during update.");
    }
});

module.exports = router;
