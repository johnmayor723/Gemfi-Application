import logoLight from '@/assets/gemfi-logo-light.png';
import logoDark from '@/assets/gemfi-logo-dark.png';

export default function Logo({ className = '', light = false, tagline = false }) {
  const large = className.includes('text-3xl');

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <img
        src={light ? logoDark : logoLight}
        alt="gemfi"
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
