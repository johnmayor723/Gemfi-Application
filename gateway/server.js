import express from "express";
import cors from "cors";
import axios from "axios";
import http from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = 3100;

const FINERACT = "https://localhost:8444/fineract-provider";
const ONBOARDING_SERVICE = "http://127.0.0.1:4008";
const CONNECT_TARGET = "http://127.0.0.1:5176"; // gemfi-connect (customer banking)
const STAFF_PORTAL_TARGET = "http://127.0.0.1:5175"; // gemfi-mfb-portal (staff/back-office)

// gateway.gemfitech.com is the Gateway's own control-plane hostname (used
// e.g. by onboard-tenant.sh's verification curl) - it is NOT a tenant slug,
// so it skips tenant resolution entirely and keeps the old header-driven
// /fineract-provider behavior.
const GATEWAY_CONTROL_HOST = "gateway.gemfitech.com";
const TENANT_DOMAIN_SUFFIX = ".gemfitech.com";

// The wildcard cert/DNS only cover a single hostname label (*.gemfitech.com,
// not *.*.gemfitech.com), so the staff portal can't live at a nested
// subdomain like staff.acme.gemfitech.com - it gets its own single-label
// sibling instead: acme-staff.gemfitech.com. Both resolve to the exact same
// tenant record; only which app gets served differs.
const STAFF_SUFFIX = "-staff";

app.use(cors({ origin: true, credentials: true }));

// =======================
// REQUEST LOGGER
// =======================
app.use((req, res, next) => {
  console.log("\n========================");
  console.log("📥 REQUEST");
  console.log(req.method, req.originalUrl, "| Host:", req.headers.host);
  console.log("========================\n");

  next(); // IMPORTANT: allow forwarding
});

// =======================
// TENANT RESOLUTION
// ----------------------------------------------------------
// Any *.gemfitech.com subdomain other than the control host reaches this
// Gateway only via nginx's wildcard catch-all (every other GemFi surface -
// apply/api/admin-console/demo/ib-demo/todo - has its own explicit vhost
// that nginx matches first). So every Host seen here, besides the control
// host, is a live-or-not tenant slug that must be resolved against
// onboarding-service before we know what to do with the request.
//
// Resolution reuses the same public /branding/:subdomain endpoint the
// frontend uses for branding - it already 404s for anything that isn't an
// active tenant (pending/rejected/disabled/unknown, indistinguishably, by
// design - see onboarding.service.js), and now also returns
// fineractTenantIdentifier for exactly this purpose.
//
// Results (including negative ones) are cached briefly so a burst of
// requests to the same tenant - or a scan of nonexistent subdomains -
// doesn't hammer onboarding-service on every single request.
// =======================
const TENANT_CACHE_TTL_MS = 30_000;
const tenantCache = new Map(); // subdomain -> { tenant: {...} | null, expiresAt }

/**
 * Splits a Host header into { subdomain, isStaff }, or null if it isn't
 * shaped like a tenant host at all (control host, bare domain, www,
 * multi-label, etc.). isStaff is true for the acme-staff.gemfitech.com
 * sibling - the underlying tenant slug is always the part before that
 * suffix, since both hostnames map to the one onboarding record.
 */
function parseTenantHost(host) {
  if (!host) return null;

  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === GATEWAY_CONTROL_HOST) return null;
  if (!hostname.endsWith(TENANT_DOMAIN_SUFFIX)) return null;

  const label = hostname.slice(0, -TENANT_DOMAIN_SUFFIX.length);

  // Reject the bare domain, www, and anything with more than one label
  // (e.g. foo.bar.gemfitech.com) - tenant slugs are always a single label.
  if (!label || label === "www" || label.includes(".")) return null;

  if (label.endsWith(STAFF_SUFFIX)) {
    const subdomain = label.slice(0, -STAFF_SUFFIX.length);

    if (!subdomain) return null;

    return { subdomain, isStaff: true };
  }

  return { subdomain: label, isStaff: false };
}

async function resolveTenant(subdomain) {
  const cached = tenantCache.get(subdomain);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  let tenant = null;

  try {
    const { data } = await axios.get(
      `${ONBOARDING_SERVICE}/branding/${subdomain}`,
      { timeout: 3000 }
    );

    tenant = data?.data || null;
  } catch (err) {
    // 404 (unknown/inactive tenant) and transient errors both resolve to
    // "no tenant" - a flaky onboarding-service shouldn't be distinguishable
    // from an unknown subdomain to the caller.
    tenant = null;
  }

  tenantCache.set(subdomain, {
    tenant,
    expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
  });

  return tenant;
}

app.use(async (req, res, next) => {
  const parsed = parseTenantHost(req.headers.host);

  if (!parsed) {
    // Control host or anything not shaped like a tenant slug - legacy
    // behavior, no tenant attached.
    req.tenant = null;
    req.isStaffHost = false;
    return next();
  }

  req.tenant = await resolveTenant(parsed.subdomain);
  req.isStaffHost = parsed.isStaff;

  if (!req.tenant) {
    return res.status(404).send("Unknown or inactive tenant.");
  }

  next();
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

    // NOTE: http-proxy-middleware v3 nests event handlers under `on`, not
    // top-level onProxyReq/onProxyRes/onError (that was a v2 API). Getting
    // this wrong doesn't error - it just silently never fires, which is
    // exactly what happened before this fix: the tenant header override
    // below (and even the plain console logs) were never actually running.
    on: {
      proxyReq: (proxyReq, req) => {
        console.log("➡️ FORWARDING TO FINERACT:", req.originalUrl);

        // A resolved tenant subdomain is authoritative - it overrides
        // whatever a client sends, so one tenant's frontend can never (by
        // accident or otherwise) address another tenant's Fineract schema.
        // Only the control host (req.tenant === null) still trusts a
        // client-supplied header, same as before tenant resolution existed.
        // Falls back to "default" if a resolved tenant is somehow missing
        // its identifier - an invalid/undefined header value here throws
        // synchronously and takes the whole process down with it, so this
        // must never be allowed to be empty.
        const tenantId =
          (req.tenant && req.tenant.fineractTenantIdentifier) ||
          req.headers["fineract-platform-tenantid"] ||
          "default";

        proxyReq.setHeader("Fineract-Platform-TenantId", tenantId);
      },

      proxyRes: (proxyRes, req) => {
        console.log("📤 RESPONSE:", req.method, req.originalUrl, proxyRes.statusCode);
      },

      error: (err, req, res) => {
        console.error("❌ PROXY ERROR:", err.message);
        res.status(500).send("Proxy error");
      },
    },
  })
);

// =======================
// PROXY TO TENANT PORTALS
// ----------------------------------------------------------
// Everything that isn't /fineract-provider, for a resolved tenant host,
// serves one of two apps depending on which hostname was used:
//   acme.gemfitech.com       -> gemfi-connect (customer banking)
//   acme-staff.gemfitech.com -> gemfi-mfb-portal (staff/back-office)
// Host is preserved (no changeOrigin) because both apps' Vite dev servers
// check the incoming Host header against their own allowedHosts list
// before serving anything.
// =======================
// Node's default global http.Agent does NOT keep connections alive - every
// proxied request opens a brand-new TCP connection to Vite. A dev SPA's
// first load fires 30+ near-simultaneous module requests; that much
// connection churn intermittently drops a random few under load (reproduced
// as unpredictable 503s, occasionally on main.jsx itself, blanking the
// whole page). Shared across both portal proxies since they're both proxying
// to the same class of backend (a local Vite dev server).
const keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 100 });

function makePortalProxy(target, label) {
  return createProxyMiddleware({
    target,
    changeOrigin: false,
    agent: keepAliveAgent,
    // NOTE: no `ws: true` here - that auto-subscribes to the server's
    // 'upgrade' event on the first request through app.use(), which
    // conflicts with the manual server.on('upgrade', ...) wiring below
    // ("External WebSocket upgrade" in http-proxy-middleware's docs is an
    // alternative to ws:true, not something to combine with it). Doing
    // both caused every websocket upgrade to be handled twice, corrupting
    // the handshake (browser saw "Invalid frame header").

    on: {
      proxyReq: (proxyReq, req) => {
        console.log(`➡️ FORWARDING TO ${label}:`, req.headers.host, req.originalUrl);
      },

      error: (err, req, res) => {
        console.error(`❌ ${label} PROXY ERROR:`, err.message);
        res.status(502).send(`${label} proxy error`);
      },
    },
  });
}

const connectProxy = makePortalProxy(CONNECT_TARGET, "CONNECT");
const staffPortalProxy = makePortalProxy(STAFF_PORTAL_TARGET, "STAFF PORTAL");

app.use((req, res, next) => {
  if (!req.tenant) {
    return res
      .status(404)
      .send("No portal configured for this host. Use a tenant subdomain or /fineract-provider.");
  }

  const proxy = req.isStaffHost ? staffPortalProxy : connectProxy;

  return proxy(req, res, next);
});

// =======================
const server = app.listen(PORT, () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
});

// Vite HMR runs over a WebSocket - upgrade requests bypass Express's normal
// request handling, so they need to be wired to the proxy explicitly. Both
// portal proxies are attached; each only actually handles an upgrade whose
// Host resolves to it (http-proxy-middleware ignores upgrades that don't
// match its own target routing internally... in practice here, dispatch by
// Host so only the right one ever proxies a given socket).
server.on("upgrade", (req, socket, head) => {
  const parsed = parseTenantHost(req.headers.host);

  if (parsed && parsed.isStaff) {
    staffPortalProxy.upgrade(req, socket, head);
  } else {
    connectProxy.upgrade(req, socket, head);
  }
});
