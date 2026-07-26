import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();

// =======================
// CONFIG
// =======================
const PORT = process.env.PORT || 4010;
const FINERACT_BASE = process.env.FINERACT_BASE_URL;

// =======================
// GLOBAL MIDDLEWARE
// =======================

app.use(morgan("combined"));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
  })
);

// Allow Mifos frontend
app.use(
  cors({
    origin: "*", // tighten later
    credentials: true,
  })
);

// =======================
// HEALTH CHECK
// =======================
app.get("/", (req, res) => {
  res.send("Mifos Gateway Running 🚀");
});

// =======================
// PURE PROXY (NO AUTH LOGIC)
// =======================

app.use(
  "/fineract-provider",
  createProxyMiddleware({
    target: "https://155.117.183.133:8443",
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      "^/fineract-provider": "/fineract-provider",
    },
  })
);
/*
app.use(
  "/api",
  createProxyMiddleware({
    target: FINERACT_BASE,
    changeOrigin: true,
    secure: false,

    pathRewrite: {
      "^/api": "",
    },

    // IMPORTANT: DO NOT TOUCH HEADERS (CRITICAL FIX)
    onProxyReq: (proxyReq, req) => {
      console.log(`[PROXY] ${req.method} ${req.originalUrl}`);

      // ONLY ENSURE TENANT HEADER EXISTS
      if (!req.headers["fineract-platform-tenantid"]) {
        proxyReq.setHeader("Fineract-Platform-TenantId", "default");
      }

      // DO NOT override Authorization
    },

    onProxyRes: (proxyRes, req) => {
      console.log(
        `[RESPONSE] ${req.method} ${req.originalUrl} → ${proxyRes.statusCode}`
      );
    },

    onError: (err, req, res) => {
      console.error("Proxy Error:", err.message);

      res.status(500).json({
        message: "Proxy failed",
        error: err.message,
      });
    },
  })
);*/

app.get('/partials/:name', (req, res) => {
  const name = req.params.name;

  // ✅ Match your sidebar EXACTLY
  const allowed = [
    'dashboard',
    'customers',
    'loans',
    'savings',
    'accounting',
    'products',
    'portfolio',
    'reports',
    'payments',
    'admin'
  ];

  if (!allowed.includes(name)) {
    return res.status(404).send('Partial not found');
  }

  res.render(`partials/${name}`, {
    user: req.session?.user || null
  });
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});