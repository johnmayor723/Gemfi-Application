import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = 3100;

const FINERACT = "https://localhost:8444/fineract-provider";

app.use(cors({ origin: true, credentials: true }));

// =======================
// REQUEST LOGGER
// =======================
app.use((req, res, next) => {
  console.log("\n========================");
  console.log("📥 REQUEST");
  console.log(req.method, req.originalUrl);
  console.log("========================\n");

  next(); // IMPORTANT: allow forwarding
});

// =======================
// PROXY TO FINERACT
// =======================
app.use(
  "/fineract-provider",
  createProxyMiddleware({
    target: FINERACT,
    changeOrigin: true,
    secure: false,

    pathRewrite: {
      "^/fineract-provider": "/fineract-provider",
    },

    onProxyReq: (proxyReq, req) => {
      console.log("➡️ FORWARDING TO FINERACT:", req.originalUrl);

      proxyReq.setHeader(
        "Fineract-Platform-TenantId",
        req.headers["fineract-platform-tenantid"] || "default"
      );
    },

    onProxyRes: (proxyRes, req) => {
      console.log("📤 RESPONSE:", req.method, req.originalUrl, proxyRes.statusCode);
    },

    onError: (err, req, res) => {
      console.error("❌ PROXY ERROR:", err.message);
      res.status(500).send("Proxy error");
    },
  })
);

// =======================
app.listen(PORT, () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
});
