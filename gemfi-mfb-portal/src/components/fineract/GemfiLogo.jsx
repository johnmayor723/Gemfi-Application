import gemfiIcon from '@/assets/gemfi-icon.png';

export default function GemfiLogo({ className = 'w-9 h-9' }) {
  return <img src={gemfiIcon} alt="Gemfi" className={`${className} object-contain`} />;
}
