const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// ===============================
// MNS Gaming Data
// ===============================

const verificationCodes = new Map();
const users = new Map();

// ===============================
// Password Hash
// ===============================

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return {
    salt,
    hash
  };
}

function checkPassword(password, salt, savedHash) {
  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(savedHash, "hex")
  );
}

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MNS Gaming Server is online 🎮"
  });
});

// ===============================
// API TEST
// ===============================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "MNS Gaming API works!"
  });
});

// ===============================
// SEND VERIFICATION CODE
// ===============================

app.post("/api/send-code", (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({
      success: false,
      message: "ایمیل یا شماره موبایل وارد نشده است."
    });
  }

  const key = email || phone;

  const code = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expiresAt =
    Date.now() + 5 * 60 * 1000;

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

// ===============================
// VERIFY CODE
// ===============================

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

// ===============================
// CREATE ACCOUNT
// ===============================

app.post("/api/register", (req, res) => {
  const {
    username,
    email,
    phone,
    password
  } = req.body;

  if (
    !username ||
    !email ||
    !phone ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "همه اطلاعات را وارد کنید."
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "رمز عبور باید حداقل ۸ کاراکتر باشد."
    });
  }

  const verification =
    verificationCodes.get(email) ||
    verificationCodes.get(phone);

  if (!verification || !verification.verified) {
    return res.status(403).json({
      success: false,
      message: "ابتدا کد تأیید را تأیید کنید."
    });
  }

  if (users.has(email)) {
    return res.status(409).json({
      success: false,
      message: "این ایمیل قبلاً ثبت شده است."
    });
  }

  for (const user of users.values()) {
    if (user.username === username) {
      return res.status(409).json({
        success: false,
        message: "این نام کاربری قبلاً استفاده شده است."
      });
    }

    if (user.phone === phone) {
      return res.status(409).json({
        success: false,
        message: "این شماره موبایل قبلاً ثبت شده است."
      });
    }
  }

  const passwordData =
    hashPassword(password);

  const user = {
    id: crypto.randomUUID(),
    username,
    email,
    phone,
    passwordHash: passwordData.hash,
    passwordSalt: passwordData.salt,
    createdAt: new Date().toISOString()
  };

  users.set(email, user);

  verificationCodes.delete(email);
  verificationCodes.delete(phone);

  console.log("================================");
  console.log("MNS Gaming New Account");
  console.log("Username:", username);
  console.log("Email:", email);
  console.log("Phone:", phone);
  console.log("Account created!");
  console.log("================================");

  res.json({
    success: true,
    message: "حساب کاربری با موفقیت ساخته شد! 🎮",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone
    }
  });
});

// ===============================
// LOGIN
// ===============================

app.post("/api/login", (req, res) => {
  const {
    email,
    password
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "ایمیل و رمز عبور را وارد کنید."
    });
  }

  const user = users.get(email);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "ایمیل یا رمز عبور اشتباه است."
    });
  }

  const passwordCorrect =
    checkPassword(
      password,
      user.passwordSalt,
      user.passwordHash
    );

  if (!passwordCorrect) {
    return res.status(401).json({
      success: false,
      message: "ایمیل یا رمز عبور اشتباه است."
    });
  }

  res.json({
    success: true,
    message: "ورود موفق بود! 🎮",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone
    }
  });
});

// ===============================
// CHECK VERIFICATION
// ===============================

app.post("/api/check-verification", (req, res) => {
  const { email, phone } = req.body;

  const key = email || phone;

  const savedData =
    verificationCodes.get(key);

  res.json({
    success: true,
    verified:
      savedData
        ? savedData.verified
        : false
  });
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log("MNS Gaming Server");
  console.log("Server is running!");
  console.log("Port:", PORT);
  console.log("================================");
});
