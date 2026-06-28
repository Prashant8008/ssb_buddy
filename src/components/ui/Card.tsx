import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ children, className, ...props }: CardProps) => (
  <div 
    className={cn(
      "bg-white text-navy-900 border border-navy-100 rounded-xl shadow-sm overflow-hidden",
      className
    )} 
    {...props}
  >
    {children}
  </div>
);
