import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
//Http failure response for https://localhost:8443/fineract-provider
app.use(
  "/",
  createProxyMiddleware({
    target: "https://155.117.183.133:8443",
    changeOrigin: true,
    secure: false,
    logLevel: "debug",

    onProxyReq: (proxyReq, req) => {
      console.log("\n==============================");
      console.log("📥 REQUEST");
      console.log("==============================");
      console.log("➡️", req.method, req.originalUrl);
      console.log("Headers:", req.headers);
      console.log("==============================");
    },

    onProxyRes: (proxyRes, req, res) => {
      console.log("\n==============================");
      console.log("📤 RESPONSE");
      console.log("==============================");
      console.log("⬅️", proxyRes.statusCode, req.originalUrl);
      console.log("Headers:", proxyRes.headers);
      console.log("==============================\n");
    },

    onError: (err, req, res) => {
      console.error("❌ Proxy Error:", err.message);
    }
  })
);

app.listen(8443, () => {
  console.log("🚀 Gateway running on 3000");
});