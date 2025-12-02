const express = require("express");
const router = express.Router();
const pool = require("../db");

// VALIDATION HELPERS

function isValidYearMonth(year, month) {
  const y = Number(year);
  const m = Number(month);
  return Number.isInteger(y) && Number.isInteger(m) && m >= 1 && m <= 12 && y >= 1970;
}

function isValidISODate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

// CREATE: POST /expenses

router.post("/", async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    if (
      amount === undefined ||
      amount === null ||
      isNaN(Number(amount)) ||
      !category ||
      !date ||
      !isValidISODate(date)
    ) {
      return res.status(400).json({
        error:
          "Invalid input. 'amount' (number), 'category' (string), and 'date' (YYYY-MM-DD) are required.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO expenses (amount, category, description, date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [Number(amount), category, description || null, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /expenses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.get("/", async (req, res) => {
  try {
    const { year, month, startDate, endDate } = req.query;

    let queryText = "SELECT * FROM expenses";
    const params = [];
    const conditions = [];

    if (year && month) {
      if (!isValidYearMonth(year, month)) {
        return res.status(400).json({ error: "Invalid 'year' or 'month'." });
      }
      params.push(Number(year), Number(month));
      conditions.push(
        "EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2"
      );
    }

    if (startDate || endDate) {
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "Both 'startDate' and 'endDate' are required." });
      }
      if (!isValidISODate(startDate) || !isValidISODate(endDate)) {
        return res
          .status(400)
          .json({ error: "Dates must be in YYYY-MM-DD format." });
      }

      const baseIndex = params.length;
      params.push(startDate, endDate);
      conditions.push(
        `date BETWEEN $${baseIndex + 1} AND $${baseIndex + 2}`
      );
    }

    if (conditions.length > 0) {
      queryText += " WHERE " + conditions.join(" AND ");
    }

    queryText += " ORDER BY id DESC";

    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /expenses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPDATE: PUT /expenses/:id

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, description, date } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid 'id' parameter." });
    }

    if (
      amount === undefined ||
      amount === null ||
      isNaN(Number(amount)) ||
      !category ||
      !date ||
      !isValidISODate(date)
    ) {
      return res.status(400).json({
        error:
          "Invalid input. 'amount' (number), 'category' (string), and 'date' (YYYY-MM-DD) are required.",
      });
    }

    const result = await pool.query(
      `
      UPDATE expenses
      SET amount = $1, category = $2, description = $3, date = $4
      WHERE id = $5
      RETURNING *
    `,
      [Number(amount), category, description || null, date, Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /expenses/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE: DELETE /expenses/:id

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid 'id' parameter." });
    }

    await pool.query("DELETE FROM expenses WHERE id = $1", [Number(id)]);

    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("DELETE /expenses/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// MONTHLY SUMMARY


router.get("/summary", async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!isValidYearMonth(year, month)) {
      return res.status(400).json({ error: "Invalid 'year' or 'month'." });
    }

    const y = Number(year);
    const m = Number(month);

    const totalRes = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS total_spending
      FROM expenses
      WHERE EXTRACT(YEAR FROM date) = $1
        AND EXTRACT(MONTH FROM date) = $2
    `,
      [y, m]
    );

    const totalSpending = Number(totalRes.rows[0].total_spending);

    const catRes = await pool.query(
      `
      SELECT category, COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE EXTRACT(YEAR FROM date) = $1
        AND EXTRACT(MONTH FROM date) = $2
      GROUP BY category
      ORDER BY total DESC
    `,
      [y, m]
    );

    const categoryBreakdown = catRes.rows.map((row) => ({
      category: row.category,
      total: Number(row.total),
    }));

    const daysInMonth = new Date(y, m, 0).getDate();
    const averageDailyExpenditure =
      daysInMonth > 0 ? totalSpending / daysInMonth : 0;

    res.json({
      year: y,
      month: m,
      totalSpending,
      averageDailyExpenditure,
      categoryBreakdown,
      daysInMonth,
    });
  } catch (err) {
    console.error("GET /expenses/summary error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// TREND: GET /expenses/monthly-totals

router.get("/monthly-totals", async (req, res) => {
  try {
    const monthsBack = req.query.monthsBack
      ? Number(req.query.monthsBack)
      : 6;

    if (!Number.isInteger(monthsBack) || monthsBack <= 0) {
      return res.status(400).json({
        error: "'monthsBack' must be a positive integer.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        DATE_TRUNC('month', date) AS month_start,
        EXTRACT(YEAR FROM date)::int AS year,
        EXTRACT(MONTH FROM date)::int AS month,
        COALESCE(SUM(amount), 0) AS total_spending
      FROM expenses
      WHERE date >= (CURRENT_DATE - INTERVAL '$1 month')
      GROUP BY month_start, year, month
      ORDER BY month_start
    `,
      [monthsBack]
    );

    const data = result.rows.map((row) => ({
      year: row.year,
      month: row.month,
      totalSpending: Number(row.total_spending),
    }));

    res.json({ monthsBack, data });
  } catch (err) {
    console.error("GET /expenses/monthly-totals error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// MONTH-OVER-MONTH COMPARISON

router.get("/compare", async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!isValidYearMonth(year, month)) {
      return res.status(400).json({ error: "Invalid 'year' or 'month'." });
    }

    const y = Number(year);
    const m = Number(month);

    const currentRes = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS total_spending
      FROM expenses
      WHERE EXTRACT(YEAR FROM date) = $1
        AND EXTRACT(MONTH FROM date) = $2
    `,
      [y, m]
    );

    const currentTotal = Number(currentRes.rows[0].total_spending);

    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;

    const prevRes = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS total_spending
      FROM expenses
      WHERE EXTRACT(YEAR FROM date) = $1
        AND EXTRACT(MONTH FROM date) = $2
    `,
      [prevYear, prevMonth]
    );

    const prevTotal = Number(prevRes.rows[0].total_spending);

    const diff = currentTotal - prevTotal;

    let percentChange = null;
    let direction = "no-change";

    if (prevTotal === 0 && currentTotal === 0) {
      percentChange = 0;
      direction = "no-change";
    } else if (prevTotal === 0 && currentTotal > 0) {
      direction = "increase-from-zero";
    } else {
      percentChange = (diff / prevTotal) * 100;
      direction = diff > 0 ? "increase" : diff < 0 ? "decrease" : "no-change";
    }

    res.json({
      current: { year: y, month: m, totalSpending: currentTotal },
      previous: { year: prevYear, month: prevMonth, totalSpending: prevTotal },
      difference: diff,
      percentChange,
      direction,
    });
  } catch (err) {
    console.error("GET /expenses/compare error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------------------------------------------
module.exports = router;

module.exports = router;

