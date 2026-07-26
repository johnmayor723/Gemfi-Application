import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = 4010;

const FINERACT_TARGET = "https://155.117.183.133";

// =======================
// MIDDLEWARE
// =======================
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// =======================
// SESSION STORE (in-memory)
// =======================
const sessions = new Map();

// =======================
// REQUEST LOGGER (AUTH ONLY)
// =======================
function isAuthFlow(req) {
  return req.originalUrl.includes("/authentication");
}

// =======================
// SESSION ATTACHER
// =======================
app.use((req, res, next) => {
  let sessionId = req.headers["x-session-id"];

  if (!sessionId) {
    sessionId = uuidv4();
    req.headers["x-session-id"] = sessionId;
  }

  req.sessionId = sessionId;

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      requests: [],
      responses: []
    });
  }

  next();
});

// =======================
// LOG REQUEST (ONLY AUTH + ALL FOR GROUPING)
// =======================
app.use((req, res, next) => {
  const session = sessions.get(req.sessionId);

  const requestData = {
    time: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  };

  session.requests.push(requestData);

  if (isAuthFlow(req)) {
    console.log("\n🔥 AUTH REQUEST");
    console.log(requestData);
  }

  next();
});

// =======================
// RESPONSE INTERCEPTOR HELPER
// =======================
function logResponse(req, body, statusCode) {
  const session = sessions.get(req.sessionId);

  const responseData = {
    time: new Date().toISOString(),
    url: req.originalUrl,
    statusCode,
    body
  };

  session.responses.push(responseData);

  if (isAuthFlow(req)) {
    console.log("\n🔥 AUTH RESPONSE");
    console.log(responseData);
  }
}

// =======================
// PROXY (FORWARD EVERYTHING UNCHANGED)
// =======================
/*app.use(
  "/fineract-provider",
  createProxyMiddleware({
    target: FINERACT_TARGET,
    changeOrigin: true,
    secure: false,
    selfHandleResponse: true,

    onProxyRes: (proxyRes, req, res) => {
      let body = Buffer.from("");

      proxyRes.on("data", (chunk) => {
        body = Buffer.concat([body, chunk]);
      });

      proxyRes.on("end", () => {
        const responseBody = body.toString("utf8");

        // log response
        logResponse(req, responseBody, proxyRes.statusCode);

        // set status
        res.status(proxyRes.statusCode);

        // copy headers safely
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
          if (value) res.setHeader(key, value);
        });

        // CRITICAL: end response properly
        res.end(responseBody);
      });

      proxyRes.on("error", (err) => {
        console.error("Response stream error:", err);
        res.status(500).end("Proxy response error");
      });

    }
  })
);*/
app.use(
  "/fineract-provider",
  createProxyMiddleware({
    target: "https://155.117.183.133:8443",
    changeOrigin: true,
    secure: false,

    logLevel: "debug"
  })
);
// =======================
// DEBUG VIEW (optional)
// =======================
app.get("/__sessions", (req, res) => {
  res.json(Object.fromEntries(sessions));
});

// =======================
// START
// =======================
app.listen(PORT, () => {
  console.log(`🟢 Spy Gateway running on ${PORT}`);
});