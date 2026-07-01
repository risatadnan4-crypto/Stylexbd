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
      const difference = new Date(endTime).getTime() - Date.now();
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
    <div id="global-countdown-banner" className="w-full bg-gradient-to-r from-black via-[#110524] to-black border border-luxury-gold/30 hover:border-luxury-gold/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(212,175,55,0.08)] relative overflow-hidden transition-all duration-300 group">
      {/* Radiant glow element */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-luxury-gold/5 rounded-full blur-2xl animate-pulse"></div>
      
      <div className="flex items-center gap-3.5 text-left">
        <div className="p-3 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold rounded-xl shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.15)] group-hover:scale-105 transition-transform duration-300">
          <Hourglass size={20} className="animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div>
          <span className="text-[10px] font-mono text-luxury-gold uppercase tracking-widest font-black block mb-0.5 flex items-center gap-1.5">
            <Sparkles size={10} className="animate-pulse" />
            LIMITED TIME FLASH EVENT
          </span>
          <h4 className="text-sm md:text-base font-serif font-bold text-white uppercase tracking-wide leading-tight">
            {message || "Global Seasonal Privilege Drops Active"}
          </h4>
        </div>
      </div>

      {/* Timer Digits layout */}
      <div className="flex items-center gap-2 sm:gap-3.5 font-mono">
        {[
          { label: 'DAYS', val: timeLeft.days },
          { label: 'HOURS', val: timeLeft.hours },
          { label: 'MINS', val: timeLeft.minutes },
          { label: 'SECS', val: timeLeft.seconds }
        ].map((item, idx) => (
          <React.Fragment key={item.label}>
            {idx > 0 && <span className="text-xl md:text-2xl text-luxury-gold/50 font-sans font-light animate-pulse">:</span>}
            <div className="flex flex-col items-center">
              <div className="bg-[#0b0414] border border-white/5 rounded-xl px-3 py-2.5 min-w-[50px] sm:min-w-[64px] flex items-center justify-center text-lg md:text-xl font-bold text-white shadow-inner relative overflow-hidden">
                {/* Subtle shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none"></div>
                <span>{String(item.val).padStart(2, '0')}</span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-sans text-zinc-500 uppercase tracking-widest mt-1.5 font-semibold">{item.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
