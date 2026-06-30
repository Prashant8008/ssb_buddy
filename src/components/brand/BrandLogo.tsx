import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

const LOGO_SRC = '/ssb-connect-logo.png';

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  showWordmark?: boolean;
  to?: string;
};

export const BrandLogo = ({
  className,
  imageClassName,
  showWordmark = true,
  to = '/feed',
}: BrandLogoProps) => {
  const content = (
    <>
      <img
        src={LOGO_SRC}
        alt="SSB Connect"
        className={cn('h-9 w-9 rounded-full object-cover ring-1 ring-white/15', imageClassName)}
      />
      {showWordmark && (
        <span className="font-display font-bold text-sm sm:text-base tracking-tight">SSB CONNECT</span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cn('flex items-center gap-2.5 min-w-0', className)}>
        {content}
      </Link>
    );
  }

  return <div className={cn('flex items-center gap-2.5 min-w-0', className)}>{content}</div>;
};
