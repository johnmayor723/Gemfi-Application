import logoLight from '@/assets/gemfi-logo-light.png';
import logoDark from '@/assets/gemfi-logo-dark.png';

export default function Logo({ className = '', light = false }) {
  const large = className.includes('text-3xl');

  return (
    <img
      src={light ? logoDark : logoLight}
      alt="GEMFI"
      className={`${large ? 'h-12' : 'h-9'} w-auto self-start shrink-0 ${className}`}
    />
  );
}
