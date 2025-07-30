const BankList = require("../models/BankList"); // this is a collection of all possible bank names

router.get("/all-banks", async (req, res) => {
  try {
    const banks = await BankList.find();
    res.json(banks);
  } catch (err) {
    console.error("❌ Fetch Bank Names Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
