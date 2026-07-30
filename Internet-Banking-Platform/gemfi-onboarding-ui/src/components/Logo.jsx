import logoLight from '@/assets/gemfi-logo-light.png';
import logoDark from '@/assets/gemfi-logo-dark.png';

export default function Logo({ className = '', light = false }) {
  const large = className.includes('text-3xl');

  return (
    <img
      src={light ? logoDark : logoLight}
      alt="GEMFI"
      className={`${large ? 'h-9' : 'h-7'} w-auto ${className}`}
    />
  );
}
