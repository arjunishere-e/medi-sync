import React from 'react';

const Progress = React.forwardRef(({ value = 0, className, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative h-4 w-full overflow-hidden rounded-full bg-slate-200 ${className}`}
    {...props}
  >
    <div
      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-in-out"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
));
Progress.displayName = 'Progress';

export { Progress };
