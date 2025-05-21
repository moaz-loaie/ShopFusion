require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const AppError = require("./utils/AppError");
const globalErrorHandler = require("./middleware/errorMiddleware");
const db = require("./db"); // Sequelize instance and models
const logger = require("./utils/logger");

// --- Import Routers ---
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

// --- Global Middleware ---

// Trust proxy headers (important if behind Nginx, Heroku, etc.)
app.enable("trust proxy");

// 1) Security Headers (Helmet) - Apply sensible defaults
app.use(helmet());
// Further Helmet configuration (e.g., Content Security Policy) can be added:
// app.use(helmet.contentSecurityPolicy({ directives: { /* ... */ } }));

// 2) CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // Allow cookies/auth headers
  })
);

// 3) Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100), // Limit per IP
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  // Optional: keyGenerator function for more complex scenarios
});
app.use("/api", limiter); // Apply only to API routes

// 4) Body Parsers
app.use(express.json({ limit: "10kb" })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 5) HTTP Request Logging (Morgan + Winston)
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: logger.stream,
    skip: (req, res) => process.env.NODE_ENV === "test", // Don't log during tests
  })
);

// --- API Routes ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/reviews", reviewRoutes);

// --- Frontend Serving (Production Only) ---
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client/build");
  const fs = require("fs");
  if (fs.existsSync(clientBuildPath)) {
    logger.info(`Serving static files from: ${clientBuildPath}`);
    app.use(express.static(clientBuildPath));
    app.get("*", (req, res, next) => {
      // If request is not for API and not a file, serve index.html
      if (
        req.originalUrl.startsWith("/api/") ||
        req.originalUrl.includes(".")
      ) {
        return next();
      }
      res.sendFile(path.resolve(clientBuildPath, "index.html"));
    });
  } else {
    logger.warn(
      `Client build directory not found at ${clientBuildPath}. Frontend static serving disabled.`
    );
  }
}

// --- Handle Undefined Routes (404) ---
app.all("*", (req, res, next) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// --- Global Error Handling Middleware ---
app.use(globalErrorHandler);

// --- Database Connection & Server Start ---
const PORT = process.env.PORT || 5001;
let serverInstance;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    logger.info("✅ Database connection established successfully.");
    serverInstance = app.listen(PORT, () => {
      logger.info(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode.`
      );
    });
  } catch (err) {
    logger.error("❌ Unable to start server:", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1); // Exit if DB connection fails
  }
};

// --- Graceful Shutdown Handling ---
const shutdown = (signal) => {
  logger.warn(`${signal} received. Shutting down gracefully...`);
  if (serverInstance) {
    serverInstance.close(async () => {
      logger.info("✅ HTTP server closed.");
      try {
        await db.sequelize.close();
        logger.info("✅ Database connection closed.");
        process.exit(0);
      } catch (err) {
        logger.error("❌ Error closing database connection:", err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
  setTimeout(() => {
    logger.error("❌ Forcing shutdown due to timeout.");
    process.exit(1);
  }, 10000); // 10s timeout
};

// Listen for shutdown signals
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle critical errors - attempt graceful shutdown but prioritize process exit
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...", err);
  // Optionally report error to tracking service here (e.g., Sentry)
  shutdown("unhandledRejection");
});
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", err);
  // Optionally report error to tracking service here
  // IMPORTANT: Application state is unreliable, attempt shutdown but expect potential issues
  shutdown("uncaughtException");
});

startServer();

// Export app for integration testing
module.exports = { app };
