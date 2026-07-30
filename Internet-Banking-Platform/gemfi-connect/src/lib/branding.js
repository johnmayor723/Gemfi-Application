import { createContext, useContext, useEffect, useState, createElement } from 'react';

/**
 * Hostnames that ARE the GemFi platform itself, not a tenant.
 * These are the ONLY place the bundled GemFi identity (logo,
 * "Gemfi" name) is allowed to render. A white-labeled tenant's
 * customers must never see GemFi's brand under any
 * circumstance - not on a slow network, not on an outage, not
 * on a typo'd subdomain. See NEUTRAL_STATE below for what every
 * other hostname falls back to instead.
 */
const GEMFI_PLATFORM_HOSTS = [
  'demo.gemfitech.com',
  'ib-demo.gemfitech.com',
  'gemfitech.com',
  'www.gemfitech.com',
  'localhost',
  '127.0.0.1',
];

const GEMFI_STATIC = {
  companyName: 'Gemfi',
  logoUrl: null, // null + isDynamic:false + isResolving:false => bundled GemFi asset
  primaryColor: null,
  secondaryColor: null,
  isDynamic: false,
  isResolving: false,
};

/**
 * The "we don't yet (or don't ever) know this tenant's brand"
 * state - deliberately blank, not GemFi. Used for a genuinely
 * unrecognized subdomain (404), a network/server error before
 * retries exhaust, and while an initial fetch is in flight.
 * Components render a neutral placeholder for this, never the
 * GemFi logo/name - see Logo.jsx.
 */
const NEUTRAL_STATE = {
  companyName: '',
  logoUrl: null,
  primaryColor: null,
  secondaryColor: null,
  isDynamic: false,
  isResolving: true,
};

const ONBOARDING_BASE = import.meta.env.VITE_ONBOARDING_SERVICE_URL || 'https://api.gemfitech.com';
const CACHE_PREFIX = 'gemfi_branding_cache:';
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const BACKGROUND_RETRY_MS = 10000;
const BACKGROUND_RETRY_ATTEMPTS = 6;

function isPlatformHost(hostname) {
  return GEMFI_PLATFORM_HOSTS.includes(hostname);
}

/**
 * The tenant subdomain is just the leftmost hostname label -
 * matches how onboarding-service derives `subdomain` from the
 * company name at submission time.
 */
function subdomainFromHostname(hostname) {
  const label = hostname.split('.')[0];
  return label || null;
}

function readCache(subdomain) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + subdomain);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(subdomain, tenant) {
  try {
    localStorage.setItem(CACHE_PREFIX + subdomain, JSON.stringify(tenant));
  } catch {
    // localStorage unavailable/full - caching is a nice-to-have, not required
  }
}

function hexToHslTriplet(hex) {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return null;

  const r = parseInt(match[1].slice(0, 2), 16) / 255;
  const g = parseInt(match[1].slice(2, 4), 16) / 255;
  const b = parseInt(match[1].slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Applies the tenant's colors as CSS custom properties on the
 * root element. Inline styles set this way outrank both the
 * light-mode :root block and the .dark class override in
 * index.css, so this is mode-independent by construction.
 *
 * primaryColor -> --primary/--ring/--sidebar-ring (this app's
 * light-mode --primary IS the brand teal by default).
 *
 * secondaryColor -> a dedicated --brand-secondary var, NOT
 * --accent - --accent already drives ~40 shadcn/ui primitives'
 * hover/surface states across this app.
 */
function applyBrandColors(primaryColor, secondaryColor) {
  const root = document.documentElement;
  const primaryHsl = primaryColor ? hexToHslTriplet(primaryColor) : null;
  const secondaryHsl = secondaryColor ? hexToHslTriplet(secondaryColor) : null;

  if (primaryHsl) {
    root.style.setProperty('--primary', primaryHsl);
    root.style.setProperty('--ring', primaryHsl);
    root.style.setProperty('--sidebar-ring', primaryHsl);
  }
  if (secondaryHsl) {
    root.style.setProperty('--brand-secondary', secondaryHsl);
  }
}

function clearBrandColors() {
  const root = document.documentElement;
  ['--primary', '--ring', '--sidebar-ring', '--brand-secondary'].forEach((prop) =>
    root.style.removeProperty(prop)
  );
}

/**
 * Fetches branding for a subdomain, retrying only on network
 * failures / non-404 error responses (a 404 is a definitive
 * "no such tenant" answer - retrying it can't help). Returns
 * `{ status: 'found', tenant }`, `{ status: 'not-found' }`, or
 * `{ status: 'error' }` once retries are exhausted.
 */
async function fetchBranding(subdomain, { retries = RETRY_DELAYS_MS.length } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(`${ONBOARDING_BASE}/branding/${encodeURIComponent(subdomain)}`);
      if (res.status === 404) return { status: 'not-found' };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json().catch(() => null);
      if (!body?.data) throw new Error('Malformed branding response');
      return {
        status: 'found',
        tenant: {
          companyName: body.data.companyName || '',
          logoUrl: body.data.logoUrl ? `${ONBOARDING_BASE}${body.data.logoUrl}` : null,
          primaryColor: body.data.primaryColor || null,
          secondaryColor: body.data.secondaryColor || null,
        },
      };
    } catch {
      if (attempt >= retries) return { status: 'error' };
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt] || RETRY_DELAYS_MS.at(-1)));
    }
  }
}

const BrandingContext = createContext(GEMFI_STATIC);

export function BrandingProvider({ children }) {
  const hostname = window.location.hostname;
  const [branding, setBranding] = useState(() => (isPlatformHost(hostname) ? GEMFI_STATIC : NEUTRAL_STATE));

  useEffect(() => {
    if (isPlatformHost(hostname)) return; // GEMFI_STATIC is correct and final - no fetch needed

    const subdomain = subdomainFromHostname(hostname);
    if (!subdomain) return;

    let cancelled = false;
    let backgroundTimer = null;

    const settle = (tenant) => {
      if (cancelled) return;
      setBranding({ ...tenant, isDynamic: true, isResolving: false });
      applyBrandColors(tenant.primaryColor, tenant.secondaryColor);
      writeCache(subdomain, tenant);
    };

    const fallBackOrRetryInBackground = () => {
      if (cancelled) return;
      const cached = readCache(subdomain);
      if (cached) {
        // Stale-but-real tenant branding beats showing no brand at all.
        setBranding({ ...cached, isDynamic: true, isResolving: false });
        applyBrandColors(cached.primaryColor, cached.secondaryColor);
        return;
      }
      setBranding(NEUTRAL_STATE);
      scheduleBackgroundRetry(1);
    };

    const scheduleBackgroundRetry = (attempt) => {
      if (cancelled || attempt > BACKGROUND_RETRY_ATTEMPTS) return;
      backgroundTimer = setTimeout(async () => {
        if (cancelled) return;
        const result = await fetchBranding(subdomain, { retries: 0 });
        if (cancelled) return;
        if (result.status === 'found') {
          settle(result.tenant);
        } else {
          scheduleBackgroundRetry(attempt + 1);
        }
      }, BACKGROUND_RETRY_MS);
    };

    fetchBranding(subdomain).then((result) => {
      if (cancelled) return;
      if (result.status === 'found') settle(result.tenant);
      else fallBackOrRetryInBackground();
    });

    return () => {
      cancelled = true;
      if (backgroundTimer) clearTimeout(backgroundTimer);
      clearBrandColors();
    };
  }, []);

  useEffect(() => {
    document.title = branding.isDynamic
      ? `${branding.companyName} Connect`
      : isPlatformHost(hostname)
        ? 'Gemfi Connect'
        : 'Loading…';
  }, [branding]);

  return createElement(BrandingContext.Provider, { value: branding }, children);
}

export function useBranding() {
  return useContext(BrandingContext);
}
