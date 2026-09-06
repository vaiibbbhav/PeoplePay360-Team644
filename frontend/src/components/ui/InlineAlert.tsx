import React from 'react';

type InlineAlertProps = {
  children: React.ReactNode;
};

export const InlineAlert: React.FC<InlineAlertProps> = ({ children }) => (
  <div
    role="alert"
    className="rounded-lg border border-over-red/30 bg-over-red/10 px-3.5 py-3 text-xs text-over-red"
  >
    {children}
  </div>
);
