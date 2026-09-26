const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// اجازه اتصال سایت به API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

const verificationCodes = new Map();

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

app.post("/api/send-code", (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({
      success: false,
      message: "ایمیل یا شماره موبایل وارد نشده است."
    });
  }

  const code = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expiresAt =
    Date.now() + 5 * 60 * 1000;

  const key = email || phone;

  verificationCodes.set(key, {
    code,
    expiresAt,
    verified: false
  });

  console.log("================================");
  console.log("MNS Gaming Verification Code");
  console.log("User:", key);
  console.log("CODE:", code);
  console.log("Expires: 5 minutes");
  console.log("================================");

  res.json({
    success: true,
    message: "کد تأیید ساخته شد.",
    expiresIn: 300
  });
});

app.post("/api/verify-code", (req, res) => {
  const { email, phone, code } = req.body;

  if ((!email && !phone) || !code) {
    return res.status(400).json({
      success: false,
      message: "اطلاعات کامل نیست."
    });
  }

  const key = email || phone;

  const savedData =
    verificationCodes.get(key);

  if (!savedData) {
    return res.status(404).json({
      success: false,
      message: "برای این کاربر کدی ساخته نشده است."
    });
  }

  if (Date.now() > savedData.expiresAt) {
    verificationCodes.delete(key);

    return res.status(400).json({
      success: false,
      message: "کد منقضی شده است."
    });
  }

  if (String(code) !== savedData.code) {
    return res.status(400).json({
      success: false,
      message: "کد وارد شده اشتباه است."
    });
  }

  savedData.verified = true;

  res.json({
    success: true,
    message: "کد با موفقیت تأیید شد. ✅"
  });
});

app.post("/api/check-verification", (req, res) => {
  const { email, phone } = req.body;

  const key = email || phone;

  const savedData =
    verificationCodes.get(key);

  if (!savedData) {
    return res.json({
      success: true,
      verified: false
    });
  }

  res.json({
    success: true,
    verified: savedData.verified
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log("MNS Gaming Server");
  console.log("Server is running!");
  console.log("Port:", PORT);
  console.log("================================");
});
