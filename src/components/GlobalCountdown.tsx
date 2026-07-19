import React, { useState, useEffect } from 'react';
import { Sparkles, Hourglass } from 'lucide-react';

interface GlobalCountdownProps {
  endTime?: string;
  message?: string;
  active?: boolean;
}

export function GlobalCountdown({ endTime, message, active }: GlobalCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!active || !endTime) {
      setTimeLeft(null);
      setExpired(false);
      return;
    }

    const calculateTimeLeft = () => {
      const targetTime = new Date(endTime).getTime();
      if (isNaN(targetTime)) {
        setTimeLeft(null);
        setExpired(true);
        return;
      }
      const difference = targetTime - Date.now();
      if (difference <= 0) {
        setTimeLeft(null);
        setExpired(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
      setExpired(false);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, active]);

  if (!active || expired || !timeLeft) return null;

  return (
    <div id="global-countdown-banner" className="w-full bg-gradient-to-r from-black via-[#0f0521] to-black border-2 border-luxury-gold/40 hover:border-luxury-gold/75 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shadow-[0_4px_30px_rgba(212,175,55,0.15)] relative overflow-hidden transition-all duration-300 group">
      {/* Radiant glow elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-luxury-gold/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
      
      <div className="flex items-center gap-3 sm:gap-4 text-left w-full md:w-auto">
        <div className="p-2.5 sm:p-3 bg-luxury-gold/15 border border-luxury-gold/40 text-luxury-gold rounded-xl shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.25)] group-hover:scale-105 transition-transform duration-300">
          <Hourglass size={18} className="animate-spin sm:w-5 sm:h-5" style={{ animationDuration: '4s' }} />
        </div>
        <div>
          <span className="text-[9px] sm:text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-black block mb-0.5 flex items-center gap-1.5">
            <Sparkles size={10} className="animate-pulse" />
            LIMITED TIME FLASH EVENT
          </span>
          <h4 className="text-xs sm:text-sm md:text-base font-serif font-bold text-white uppercase tracking-wider leading-tight">
            {message || "Global Seasonal Privilege Drops Active"}
          </h4>
        </div>
      </div>

      {/* Timer Digits layout - Perfect mobile fit */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 w-full md:w-auto mt-2 md:mt-0 select-none">
        {[
          { label: 'DAYS', val: timeLeft.days },
          { label: 'HOURS', val: timeLeft.hours },
          { label: 'MINS', val: timeLeft.minutes },
          { label: 'SECS', val: timeLeft.seconds }
        ].map((item, idx) => (
          <React.Fragment key={item.label}>
            {idx > 0 && (
              <span className="text-xl sm:text-3xl text-luxury-gold font-sans font-black animate-pulse px-0.5 sm:px-1 self-center mb-5">
                :
              </span>
            )}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-b from-[#14062c] to-[#070112] border-2 border-luxury-gold/45 rounded-xl py-2.5 sm:py-3.5 w-[58px] sm:w-[76px] md:w-[84px] h-[48px] sm:h-[64px] md:h-[72px] flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_4px_12px_rgba(0,0,0,0.6)] relative overflow-hidden shrink-0">
                {/* Accent line on top of each card */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-luxury-gold to-transparent opacity-90" />
                {/* Subtle shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none"></div>
                <span className="relative z-10 text-luxury-gold text-shadow-sm font-mono font-black text-lg sm:text-2xl md:text-3xl tracking-wide tabular-nums leading-none">
                  {String(item.val).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] font-sans text-zinc-400 uppercase tracking-widest mt-1.5 sm:mt-2 font-black text-center">
                {item.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
