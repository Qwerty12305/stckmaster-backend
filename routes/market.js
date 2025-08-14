const express = require("express");
const fetch = require("node-fetch"); // v2 works with require
const router = express.Router();

const API_KEY = "1a94f12ee8d841fbb5ad2487b2915e4c";

// Fetch current price
router.get("/price", async (req, res) => {
  const symbol = req.query.symbol;
  try {
    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`
    );
    const data = await response.json();
    if (data.price) {
      res.json({ price: data.price });
    } else {
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  } catch (err) {
    console.error("Price fetch error:", err);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

// Fetch chart data
router.get("/chart", async (req, res) => {
  const symbol = req.query.symbol;
  const interval = req.query.interval || "1min";
  try {
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&apikey=${API_KEY}`
    );
    const data = await response.json();
    if (data.values) {
      res.json({ values: data.values });
    } else {
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  } catch (err) {
    console.error("Chart fetch error:", err);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

module.exports = router;
