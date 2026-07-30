import { createContext, useContext, useEffect, useState, createElement } from 'react';

/**
 * Hostnames that ARE the GemFi platform itself, not a tenant.
 * These always render the bundled static GemFi identity - no
 * branding fetch is even attempted, so there's no risk of a
 * slow/broken onboarding-service call affecting GemFi's own
 * app.
 */
const GEMFI_PLATFORM_HOSTS = [
  'demo.gemfitech.com',
  'ib-demo.gemfitech.com',
  'gemfitech.com',
  'www.gemfitech.com',
  'localhost',
  '127.0.0.1',
];

const STATIC_DEFAULT = {
  companyName: 'Gemfi',
  logoUrl: null, // null means "use the bundled asset", set by each app's Logo component
  primaryColor: null,
  secondaryColor: null,
  isDynamic: false,
};

const ONBOARDING_BASE = import.meta.env.VITE_ONBOARDING_SERVICE_URL || 'https://api.gemfitech.com';

/**
 * The tenant subdomain is just the leftmost hostname label -
 * matches how onboarding-service derives `subdomain` from the
 * company name at submission time. A platform host never
 * reaches this - see GEMFI_PLATFORM_HOSTS above.
 */
function subdomainFromHostname(hostname) {
  const label = hostname.split('.')[0];
  return label || null;
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
 * light-mode --primary IS the brand teal by default, unlike
 * the mfb-portal's neutral-black light primary).
 *
 * secondaryColor -> a dedicated --brand-secondary var, NOT
 * --accent - --accent already drives ~40 shadcn/ui primitives'
 * hover/surface states across this app, and repurposing it for
 * a tenant's CTA-orange would visually break dropdowns, menus,
 * and toggles in ways unrelated to branding.
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

const BrandingContext = createContext(STATIC_DEFAULT);

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(STATIC_DEFAULT);

  useEffect(() => {
    const hostname = window.location.hostname;

    if (GEMFI_PLATFORM_HOSTS.includes(hostname)) {
      return; // stays STATIC_DEFAULT - this is GemFi's own domain, not a tenant
    }

    const subdomain = subdomainFromHostname(hostname);
    if (!subdomain) return;

    let cancelled = false;

    fetch(`${ONBOARDING_BASE}/branding/${encodeURIComponent(subdomain)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled || !body?.data) return; // 404 or malformed - fall back to static, silently
        const tenant = {
          companyName: body.data.companyName || STATIC_DEFAULT.companyName,
          logoUrl: body.data.logoUrl ? `${ONBOARDING_BASE}${body.data.logoUrl}` : null,
          primaryColor: body.data.primaryColor || null,
          secondaryColor: body.data.secondaryColor || null,
          isDynamic: true,
        };
        setBranding(tenant);
        applyBrandColors(tenant.primaryColor, tenant.secondaryColor);
      })
      .catch(() => {
        // Network error, onboarding-service down, etc. - stay on
        // STATIC_DEFAULT rather than leaving the app unbranded.
      });

    return () => {
      cancelled = true;
      clearBrandColors();
    };
  }, []);

  useEffect(() => {
    document.title = branding.isDynamic ? `${branding.companyName} Connect` : 'Gemfi Connect';
  }, [branding]);

  return createElement(BrandingContext.Provider, { value: branding }, children);
}

export function useBranding() {
  return useContext(BrandingContext);
}
