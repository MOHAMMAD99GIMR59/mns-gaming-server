const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MNS Gaming Server is online 🎮"
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "MNS Gaming API works!"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MNS Gaming Server running on port ${PORT}`);
});
