import gemfiIcon from '@/assets/gemfi-icon.png';
import { useBranding } from '@/lib/branding';

export default function GemfiLogo({ className = 'w-9 h-9' }) {
  const branding = useBranding();
  const src = branding.isDynamic && branding.logoUrl ? branding.logoUrl : gemfiIcon;

  return <img src={src} alt={branding.companyName} className={`${className} object-contain`} />;
}
