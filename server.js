const path = require("path");
const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI || "";
const DB_NAME = process.env.MONGODB_DB || "soma_education";
const JWT_SECRET = process.env.JWT_SECRET || "";
const DEFAULT_THEME_COLOR = process.env.DEFAULT_THEME_COLOR || "#0a2463";
const PUBLIC_DIR = __dirname;

let mongoClient;
let indexesReady = false;

function requireConfig() {
  const missing = [];
  if (!MONGODB_URI) missing.push("MONGODB_URI");
  if (!JWT_SECRET || JWT_SECRET === "replace-this-with-a-long-random-secret") missing.push("JWT_SECRET");
  if (missing.length) {
    throw new Error("Missing required environment value(s): " + missing.join(", "));
  }
}

function client() {
  requireConfig();
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    });
  }
  return mongoClient;
}

async function usersCollection() {
  const users = client().db(DB_NAME).collection("users");
  if (!indexesReady) {
    await users.createIndex({ email: 1 }, { unique: true });
    indexesReady = true;
  }
  return users;
}

function corsForLocalDevelopment(req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function cleanName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 48);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isHexColor(color) {
  return /^#[0-9a-f]{6}$/i.test(String(color || ""));
}

function defaultSettings(displayName) {
  return {
    displayName: displayName || "Soma learner",
    themeColor: DEFAULT_THEME_COLOR,
    avatar: ""
  };
}

function sanitizeSettings(settings = {}) {
  const safe = {};
  if (typeof settings.displayName === "string") {
    safe.displayName = cleanName(settings.displayName);
  }
  if (isHexColor(settings.themeColor)) {
    safe.themeColor = settings.themeColor;
  }
  if (typeof settings.avatar === "string") {
    const avatar = settings.avatar.trim();
    if (!avatar || /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(avatar) || /^https?:\/\//i.test(avatar)) {
      safe.avatar = avatar.slice(0, 1_500_000);
    }
  }
  return safe;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    role: user.role || "premium",
    status: user.status || "active",
    settings: Object.assign(defaultSettings(user.firstName), user.settings || {})
  };
}

function signToken(user, remember) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role || "premium",
      nonce: crypto.randomBytes(8).toString("hex")
    },
    JWT_SECRET,
    { expiresIn: remember ? "30d" : "12h" }
  );
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return "";
}

async function authOptional(req, res, next) {
  const token = bearerToken(req);
  if (!token) {
    req.user = null;
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await usersCollection();
    const user = await users.findOne({ _id: new ObjectId(payload.sub), status: { $ne: "deactivated" } });
    req.user = user || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

function authRequired(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }
  next();
}

app.use(corsForLocalDevelopment);
app.use(express.json({ limit: "2mb" }));
app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

app.get("/api/health", async (req, res) => {
  try {
    await client().db("admin").command({ ping: 1 });
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const firstName = cleanName(req.body.firstName);
  const lastName = cleanName(req.body.lastName);
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!firstName || !lastName || !isValidEmail(email) || password.length < 8) {
    res.status(400).json({ error: "Enter your name, a valid email, and a password of at least 8 characters." });
    return;
  }

  const displayName = cleanName(firstName + " " + lastName);
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const user = {
    firstName,
    lastName,
    email,
    passwordHash,
    role: "premium",
    status: "active",
    settings: defaultSettings(displayName),
    createdAt: now,
    updatedAt: now
  };

  try {
    const users = await usersCollection();
    const result = await users.insertOne(user);
    user._id = result.insertedId;
    res.status(201).json({ token: signToken(user, true), user: publicUser(user) });
  } catch (error) {
    if (error && error.code === 11000) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  const remember = Boolean(req.body.remember);

  const users = await usersCollection();
  const user = await users.findOne({ email, status: { $ne: "deactivated" } });
  const passwordOk = user && await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  await users.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  res.json({ token: signToken(user, remember), user: publicUser(user) });
});

app.post("/api/auth/logout", authOptional, (req, res) => {
  res.json({ ok: true });
});

app.get("/api/auth/me", authOptional, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.patch("/api/account/settings", authOptional, authRequired, async (req, res) => {
  const settings = sanitizeSettings(req.body.settings || req.body || {});
  if (!Object.keys(settings).length) {
    res.status(400).json({ error: "No valid settings were supplied." });
    return;
  }

  const set = { updatedAt: new Date() };
  Object.keys(settings).forEach((key) => {
    set["settings." + key] = settings[key];
  });

  const users = await usersCollection();
  await users.updateOne({ _id: req.user._id }, { $set: set });
  const updated = await users.findOne({ _id: req.user._id });
  res.json({ user: publicUser(updated) });
});

app.post("/api/account/deactivate", authOptional, authRequired, async (req, res) => {
  const users = await usersCollection();
  await users.updateOne(
    { _id: req.user._id },
    { $set: { status: "deactivated", deactivatedAt: new Date(), updatedAt: new Date() } }
  );
  res.json({ ok: true });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Server error. Check the terminal for details." });
});

app.listen(PORT, () => {
  console.log("Soma education site running at http://localhost:" + PORT);
});
