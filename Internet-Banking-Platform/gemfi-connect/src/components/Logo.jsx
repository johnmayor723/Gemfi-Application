import logoLight from '@/assets/gemfi-logo-light.png';
import logoDark from '@/assets/gemfi-logo-dark.png';
import { useBranding } from '@/lib/branding';

export default function Logo({ className = '', light = false, tagline = false }) {
  const branding = useBranding();
  const large = className.includes('text-3xl');
  const src = branding.isDynamic && branding.logoUrl ? branding.logoUrl : (light ? logoDark : logoLight);

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <img
        src={src}
        alt={branding.companyName}
        className={large ? 'h-10 w-auto' : 'h-7 w-auto'}
      />
      {tagline && (
        <span className={`text-xs font-medium tracking-wide mt-1 ${light ? 'text-slate-400' : 'text-slate-500'}`}>
          Microfinance Bank
        </span>
      )}
    </span>
  );
}
