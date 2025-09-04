import express from "express";
import dotenv from "dotenv";
import Logger from "./log.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use(async (req, res, next) => {
  await Logger(
    "backend",
    "info",
    "middleware",
    `Incoming request: ${req.method} ${req.url}`
  );
  next();
});

app.get("/", async (req, res) => {
  await Logger("backend", "debug", "controller", "Root route accessed");
  res.send("Welcome to Logging Middleware");
});

app.get("/error", async (req, res) => {
  try {
    throw new Error("Simulated application error");
  } 
  catch(err) {
    await Logger("backend", "error", "handler", err.message);
    res.status(500).send("Something went wrong!");
  }
});

app.use(async (err, req, res, next) => {
  await Logger("backend", "fatal", "handler", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on PORT : ${process.env.PORT}`);
});
