import { Landmark } from 'lucide-react';
import logoLight from '@/assets/gemfi-logo-light.png';
import logoDark from '@/assets/gemfi-logo-dark.png';
import { useBranding } from '@/lib/branding';

export default function Logo({ className = '', light = false, tagline = false }) {
  const branding = useBranding();
  const large = className.includes('text-3xl');
  const sizeClass = large ? 'h-10 w-auto' : 'h-7 w-auto';

  const showTenantLogo = branding.isDynamic && branding.logoUrl;
  // Only a confirmed GemFi platform host ever gets GemFi's own
  // logo - a tenant mid-resolution, mid-outage, or with no
  // uploaded logo gets a neutral placeholder instead, never
  // GemFi's brand.
  const showGemfiLogo = !branding.isDynamic && !branding.isResolving;

  return (
    <span className={`inline-flex flex-col ${className}`}>
      {showTenantLogo ? (
        <img src={branding.logoUrl} alt={branding.companyName} className={sizeClass} />
      ) : showGemfiLogo ? (
        <img src={light ? logoDark : logoLight} alt="Gemfi" className={sizeClass} />
      ) : (
        <span className={`${large ? 'h-10 w-10' : 'h-7 w-7'} rounded-lg grid place-items-center ${light ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-400'}`}>
          <Landmark className="w-1/2 h-1/2" />
        </span>
      )}
      {tagline && (
        <span className={`text-xs font-medium tracking-wide mt-1 ${light ? 'text-slate-400' : 'text-slate-500'}`}>
          Microfinance Bank
        </span>
      )}
    </span>
  );
}
