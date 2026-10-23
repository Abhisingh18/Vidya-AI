'use client';

/** This week's XP per day (Mon–Sun, IST) as a small single-series bar chart. */
export function XpWeekChart({
  week, tone = 'light', height = 72,
}: {
  week: { day: string; label: string; xp: number; isToday: boolean }[];
  tone?: 'light' | 'dark';
  height?: number;
}) {
  const max = Math.max(1, ...week.map(d => d.xp));
  const todayIdx = week.findIndex(d => d.isToday);
  const dark = tone === 'dark';

  return (
    <figure className="w-full">
      <figcaption className="sr-only">XP earned each day this week</figcaption>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {week.map((d, i) => {
          const h = d.xp > 0 ? Math.max(6, Math.round((d.xp / max) * (height - 18))) : 3;
          const future = todayIdx >= 0 && i > todayIdx;
          return (
            <div key={d.day} className="group relative flex-1 h-full flex flex-col justify-end items-center" tabIndex={0} aria-label={`${d.label}: ${d.xp} XP`}>
              {/* Direct label only on today's bar; the rest show on hover/focus. */}
              <span
                className={`absolute -top-0.5 text-[10px] font-semibold tabular-nums whitespace-nowrap transition-opacity ${
                  d.isToday && d.xp > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100'
                } ${dark ? 'text-white/80' : 'text-navy dark:text-dark-text'}`}
                style={{ bottom: h + 4, top: 'auto' }}
              >
                {d.xp}
              </span>
              <div
                className={`w-full max-w-[28px] rounded-t-[4px] transition-all duration-700 ${
                  d.xp === 0
                    ? dark ? 'bg-white/10' : 'bg-gray-200 dark:bg-dark-border'
                    : d.isToday ? 'bg-saffron' : dark ? 'bg-saffron/55' : 'bg-saffron/45'
                } ${future ? 'opacity-40' : ''}`}
                style={{ height: h }}
              />
            </div>
          );
        })}
      </div>
      <div className={`mt-1.5 flex gap-1.5 border-t pt-1 ${dark ? 'border-white/10' : 'border-card-border dark:border-dark-border'}`}>
        {week.map(d => (
          <span
            key={d.day}
            className={`flex-1 text-center text-[10px] uppercase ${
              d.isToday ? 'font-bold text-saffron' : dark ? 'text-white/50' : 'text-muted'
            }`}
          >
            {d.label[0]}
          </span>
        ))}
      </div>
    </figure>
  );
}
