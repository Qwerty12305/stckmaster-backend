const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const API_KEY = process.env.TWELVE_API_KEY;

const markets = ["AAPL", "EUR/USD", "BTC/USD", "XAU/USD", "DAX", "AEX"]; // add all symbols

router.get("/all", async (req, res) => {
  try {
    const results = await Promise.all(
      markets.map(async (symbol) => {
        const response = await fetch(
          `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`
        );
        const data = await response.json();
        return {
          symbol,
          price: data.price || null,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("Failed to fetch all market prices:", err);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

module.exports = router;
