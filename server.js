const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// دریافت JSON
app.use(express.json());

// ذخیره موقت کدهای تأیید
const verificationCodes = new Map();

// صفحه اصلی سرور
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MNS Gaming Server is online 🎮"
  });
});

// تست API
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "MNS Gaming API works!"
  });
});

// ارسال/ساخت کد تأیید
app.post("/api/send-code", (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({
      success: false,
      message: "ایمیل یا شماره موبایل وارد نشده است."
    });
  }

  // ساخت کد ۶ رقمی
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // کد بعد از 5 دقیقه منقضی می‌شود
  const expiresAt = Date.now() + 5 * 60 * 1000;

  const key = email || phone;

  verificationCodes.set(key, {
    code,
    expiresAt,
    verified: false
  });

  // فعلاً برای تست در لاگ سرور نمایش داده می‌شود
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

// بررسی کد تأیید
app.post("/api/verify-code", (req, res) => {
  const { email, phone, code } = req.body;

  if ((!email && !phone) || !code) {
    return res.status(400).json({
      success: false,
      message: "اطلاعات کامل نیست."
    });
  }

  const key = email || phone;
  const savedData = verificationCodes.get(key);

  if (!savedData) {
    return res.status(404).json({
      success: false,
      message: "برای این کاربر کدی ساخته نشده است."
    });
  }

  // بررسی زمان انقضا
  if (Date.now() > savedData.expiresAt) {
    verificationCodes.delete(key);

    return res.status(400).json({
      success: false,
      message: "کد منقضی شده است."
    });
  }

  // بررسی کد
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

// بررسی وضعیت تأیید
app.post("/api/check-verification", (req, res) => {
  const { email, phone } = req.body;

  const key = email || phone;
  const savedData = verificationCodes.get(key);

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

// اجرای سرور
app.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log("MNS Gaming Server");
  console.log("Server is running!");
  console.log("Port:", PORT);
  console.log("================================");
});
