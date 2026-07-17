import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ children, className, ...props }: CardProps) => (
  <div 
    className={cn(
      "ssb-card text-on-surface overflow-hidden",
      className
    )} 
    {...props}
  >
    {children}
  </div>
);
