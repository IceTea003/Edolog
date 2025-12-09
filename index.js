// index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Spend from "./models/spend.js";
import Income from "./models/income.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// --- Helper: get start/end of month from "YYYY-MM" or current month ---
function getMonthRange(yyyymm) {
  let start;
  if (yyyymm) {
    const [year, month] = yyyymm.split("-").map(Number);
    start = new Date(year, month - 1, 1);
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

// --- MongoDB connection ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// --- ROUTES ---

// Health check
app.get("/", (req, res) => {
  res.send("Edolog backend running");
});

/* ========= SPENDS ========= */

// Create a new spend
app.post("/api/spends", async (req, res) => {
  try {
    const { name, sector, amount, note, date } = req.body;
    if (!name || !sector || amount == null) {
      return res.status(400).json({ error: "name, sector, amount required" });
    }
    const spend = await Spend.create({
      name,
      sector,
      amount,
      note: note || "",
      date: date ? new Date(date) : new Date()
    });
    res.status(201).json(spend);
  } catch (err) {
    console.error("Error creating spend", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Summary of spends for a month
app.get("/api/spends/summary", async (req, res) => {
  try {
    const { month } = req.query;
    const { start, end } = getMonthRange(month);

    const pipeline = [
      {
        $match: {
          date: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: "$sector",
          amount: { $sum: "$amount" }
        }
      }
    ];

    const result = await Spend.aggregate(pipeline);
    const total = result.reduce((sum, r) => sum + r.amount, 0);
    const bySector = result.map((r) => ({
      sector: r._id,
      amount: r.amount
    }));

    res.json({ total, bySector });
  } catch (err) {
    console.error("Error getting spend summary", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Spends in a sector for a month
app.get("/api/sectors/:sector/spends", async (req, res) => {
  try {
    const { sector } = req.params;
    const { month } = req.query;
    const { start, end } = getMonthRange(month);

    const spends = await Spend.find({
      sector,
      date: { $gte: start, $lt: end }
    }).sort({ date: -1 });

    res.json(spends);
  } catch (err) {
    console.error("Error getting sector spends", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Single spend detail
app.get("/api/spends/:id", async (req, res) => {
  try {
    const spend = await Spend.findById(req.params.id);
    if (!spend) return res.status(404).json({ error: "Not found" });
    res.json(spend);
  } catch (err) {
    console.error("Error getting spend", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete spend
app.delete("/api/spends/:id", async (req, res) => {
  try {
    const result = await Spend.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting spend", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ========= INCOMES ========= */

// Create a new income
app.post("/api/incomes", async (req, res) => {
  try {
    const { name, sector, amount, note, date } = req.body;
    if (!name || !sector || amount == null) {
      return res.status(400).json({ error: "name, sector, amount required" });
    }
    const income = await Income.create({
      name,
      sector,
      amount,
      note: note || "",
      date: date ? new Date(date) : new Date()
    });
    res.status(201).json(income);
  } catch (err) {
    console.error("Error creating income", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Summary of incomes for a month
app.get("/api/incomes/summary", async (req, res) => {
  try {
    const { month } = req.query;
    const { start, end } = getMonthRange(month);

    const pipeline = [
      {
        $match: {
          date: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: "$sector",
          amount: { $sum: "$amount" }
        }
      }
    ];

    const result = await Income.aggregate(pipeline);
    const total = result.reduce((sum, r) => sum + r.amount, 0);
    const bySector = result.map((r) => ({
      sector: r._id,
      amount: r.amount
    }));

    res.json({ total, bySector });
  } catch (err) {
    console.error("Error getting income summary", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Incomes in a sector for a month
app.get("/api/incomes/by-sector/:sector", async (req, res) => {
  try {
    const { sector } = req.params;
    const { month } = req.query;
    const { start, end } = getMonthRange(month);

    const incomes = await Income.find({
      sector,
      date: { $gte: start, $lt: end }
    }).sort({ date: -1 });

    res.json(incomes);
  } catch (err) {
    console.error("Error getting sector incomes", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Single income detail
app.get("/api/incomes/:id", async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    if (!income) return res.status(404).json({ error: "Not found" });
    res.json(income);
  } catch (err) {
    console.error("Error getting income", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete income
app.delete("/api/incomes/:id", async (req, res) => {
  try {
    const result = await Income.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting income", err);
    res.status(500).json({ error: "Server error" });
  }
});
