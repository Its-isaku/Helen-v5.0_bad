import React, { useEffect, useMemo, useState } from 'react';

/**
 * TimeDisplay
 * Self-contained time/date/day display that updates every second without
 * causing parent re-renders. UI output remains the same.
 */
export const TimeDisplay = React.memo(function TimeDisplay({
  className = '',
  format = 'time', // 'time' | 'date' | 'day'
  locale = 'es-ES',
  options = {},
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const text = useMemo(() => {
    switch (format) {
      case 'time':
        return now.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          ...options,
        });
      case 'date':
        return now.toLocaleDateString(locale, {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          ...options,
        });
      case 'day':
        return now
          .toLocaleDateString(locale, { weekday: 'short', ...options })
          .toUpperCase();
      default:
        return now.toLocaleString(locale, options);
    }
  }, [now, locale, options, format]);

  return <span className={className}>{text}</span>;
});

TimeDisplay.displayName = 'TimeDisplay';