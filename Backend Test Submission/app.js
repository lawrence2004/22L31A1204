import "dotenv/config";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { customAlphabet } from "nanoid";
import ShortUrl from "./models/ShortUrl.js";
import Logger from "../Logging Middleware/log.js";

const app = express();
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(Logger);

const nano = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 7);
const isValidUrl = (u) => {
  try { const x = new URL(u); return !!x.protocol && !!x.host; } catch { return false; }
};
const minutesFromNow = (m = 30) => new Date(Date.now() + m * 60_000);
const base = process.env.BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

app.post("/shorturls", async (req, res, next) => {
  try {
    const { url, validity, shortcode } = req.body || {};

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: "Invalid 'url'. Provide a valid URL string." });
    }
    if (validity !== undefined && (!Number.isInteger(validity) || validity <= 0)) {
      return res.status(400).json({ error: "Invalid 'validity'. Must be a positive integer (minutes)." });
    }
    if (shortcode && !/^[a-zA-Z0-9]{3,32}$/.test(shortcode)) {
      return res.status(400).json({ error: "Invalid 'shortcode'. Use 3–32 alphanumeric characters." });
    }

    let code = shortcode || nano();
    if (await ShortUrl.exists({ shortcode: code })) {
      if (shortcode) return res.status(409).json({ error: "Shortcode already in use." });
      for (let i = 0; i < 4 && await ShortUrl.exists({ shortcode: code }); i++) code = nano();
      if (await ShortUrl.exists({ shortcode: code })) return res.status(500).json({ error: "Collision detected. Retry." });
    }

    const expiresAt = minutesFromNow(validity ?? 30);
    const doc = await ShortUrl.create({ shortcode: code, url, expiresAt });

    return res.status(201).json({
      shortLink: `${base}/${doc.shortcode}`,
      expiry: doc.expiresAt.toISOString()
    });
  } catch (err) { next(err); }
});

app.get("/shorturls/:code", async (req, res, next) => {
  try {
    const code = req.params.code;
    const doc = await ShortUrl.findOne({ shortcode: code }).lean();
    if (!doc) return res.status(404).json({ error: "Shortcode not found." });

    return res.json({
      shortcode: doc.shortcode,
      originalUrl: doc.url,
      createdAt: new Date(doc.createdAt).toISOString(),
      expiry: new Date(doc.expiresAt).toISOString(),
      totalClicks: doc.clicks,
      clicks: doc.clickLog.map(c => ({
        timestamp: new Date(c.ts).toISOString(),
        referrer: c.referrer ?? null,
        source: c.ip ?? null,                  
        userAgent: c.ua ?? null
      }))
    });
  } catch (err) { next(err); }
});

app.get("/:code", async (req, res, next) => {
  try {
    const code = req.params.code;
    const doc = await ShortUrl.findOne({ shortcode: code });
    if (!doc) return res.status(404).json({ error: "Shortcode not found." });

    if (doc.expiresAt <= new Date()) {
      return res.status(410).json({ error: "Link expired." });
    }

    doc.clicks += 1;
    doc.clickLog.push({
      referrer: req.get("referer") || req.get("referrer"),
      ip: (req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "").trim(),
      ua: req.get("user-agent")
    });
    await doc.save();

    return res.redirect(302, doc.url);
  } catch (err) { next(err); }
});


app.use((err, _req, res, _next) => {
  const status = err.name === "ValidationError" ? 400 : 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: true });
  app.listen(process.env.PORT || 3000, () =>
    console.log("App is listening...")
  );
};
main();
