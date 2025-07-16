// src/components/ui/card.tsx
import React from 'react';
import clsx from 'clsx';

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={clsx("rounded-lg border bg-white shadow-sm", className)}>{children}</div>
);

export const CardContent: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={clsx("p-4", className)}>{children}</div>
);
