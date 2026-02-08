import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";

const app = express();

//used when deploying
const __dirname = path.resolve();

// middleware
app.use(express.json());
// credentials:true meaning?? => server allows a browser to include cookies on request
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://talentiq-frontend3.onrender.com",
];

// Add CLIENT_URL if it's set in environment
if (ENV.CLIENT_URL && !allowedOrigins.includes(ENV.CLIENT_URL)) {
  allowedOrigins.push(ENV.CLIENT_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(clerkMiddleware()); // this adds auth field to request object: req.auth()

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});
app.get("/books", (req, res) => {
  res.status(200).json({ msg: "Server is up and running" });
});

// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Serve frontend's index.html for any unmatched GET request that accepts HTML.
  // Use `app.use` middleware instead of `app.get("/*", ...)` to avoid
  // path-to-regexp parsing issues across different Express versions.
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    const accept = req.headers.accept || "";
    if (!accept.includes("text/html")) return next();

    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

// app.use(express.static(path.join(__dirname, "../frontend/dist")));

// app.get("/{*any}", (_, res) => {
//     res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
//   });


const startServer = async () => {
  try {
    await connectDB();

    // Prefer the platform-provided PORT, then ENV.PORT, then fallback to 3000
    const PORT = process.env.PORT || ENV.PORT || 3000;

    // Listen on 0.0.0.0 so the service is reachable from Render's network
    app.listen(PORT, "0.0.0.0", () => console.log("Server is running on port:", PORT));
  } catch (error) {
    console.error("Error starting the server", error);
    // Exit with a non-zero code so Render marks the deploy as failed
    process.exit(1);
  }
};

// Log and exit on unhandled errors so we can diagnose deploy failures
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
  process.exit(1);
});

startServer();
