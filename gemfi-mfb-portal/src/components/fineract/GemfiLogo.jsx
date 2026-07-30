import { Landmark } from 'lucide-react';
import gemfiIcon from '@/assets/gemfi-icon.png';
import { useBranding } from '@/lib/branding';

export default function GemfiLogo({ className = 'w-9 h-9' }) {
  const branding = useBranding();

  if (branding.isDynamic && branding.logoUrl) {
    return <img src={branding.logoUrl} alt={branding.companyName} className={`${className} object-contain`} />;
  }

  // Only a confirmed GemFi platform host ever gets GemFi's own
  // logo - a tenant mid-resolution, mid-outage, or with no
  // uploaded logo gets a neutral placeholder instead, never
  // GemFi's brand.
  if (!branding.isDynamic && !branding.isResolving) {
    return <img src={gemfiIcon} alt="Gemfi" className={`${className} object-contain`} />;
  }

  return (
    <span className={`${className} rounded-lg bg-slate-700 text-slate-400 grid place-items-center`}>
      <Landmark className="w-1/2 h-1/2" />
    </span>
  );
}
