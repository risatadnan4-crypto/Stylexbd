import { useState, useEffect } from 'react';
import { X, Trophy, Sparkles, Copy, Check, Gift, Crown, Star, Lock } from 'lucide-react';

export interface LotteryPrize {
  text: string;
  value: string;
  type: string;
}

interface LotteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizes?: LotteryPrize[];
  discountPercentage?: number;
  isLotteryDeactivated?: boolean;
  lotteryCouponPrefix?: string;
}

export default function LotteryModal({ isOpen, onClose, discountPercentage = 15, isLotteryDeactivated = false, lotteryCouponPrefix = 'RISAT' }: LotteryModalProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasUsedLottery, setHasUsedLottery] = useState(false);

  // Auto load claimed state from localStorage to persist voucher for returning users
  useEffect(() => {
    if (isOpen) {
      const isClaimed = localStorage.getItem('sx_voucher_revealed');
      if (isClaimed === 'true') {
        setRevealed(true);
      }
      const isUsed = localStorage.getItem('has_used_lottery_code') === 'true';
      setHasUsedLottery(isUsed);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const discountPercent = Number(discountPercentage) || 15;
  const voucherCode = `${(lotteryCouponPrefix || 'RISAT').toUpperCase()}${discountPercent}`;

  const handleReveal = () => {
    setRevealed(true);
    localStorage.setItem('sx_voucher_revealed', 'true');
  };

  const handleCopyCode = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(voucherCode).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch((err) => {
          console.warn("Clipboard copy promise failed, attempting fallback:", err);
          fallbackCopyText(voucherCode);
        });
      } else {
        fallbackCopyText(voucherCode);
      }
    } catch (e) {
      console.warn("Clipboard API copy failed, attempting fallback:", e);
      fallbackCopyText(voucherCode);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; // Avoid scrolling/focus jumps
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.warn("Fallback execCommand copy returned false.");
      }
    } catch (err) {
      console.error("Fallback execCommand copy crashed:", err);
    }
  };

  const handleResetVoucher = () => {
    setRevealed(false);
    localStorage.removeItem('sx_voucher_revealed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Absolute background dim overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-luxury-black/95 backdrop-blur-md transition-opacity duration-500"
      ></div>

      {/* Frame panel */}
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-[#0b0a0f] to-[#040007] border-2 border-luxury-gold/30 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(212,175,55,0.15)] z-10 overflow-hidden animate-fade-in transition-all duration-500"
        style={{
          boxShadow: isLotteryDeactivated
            ? "0 0 40px rgba(239,68,68,0.15)"
            : revealed 
              ? "0 0 60px rgba(212,175,55,0.25), inset 0 0 20px rgba(212,175,55,0.05)" 
              : "0 0 40px rgba(154,77,255,0.15)"
        }}
      >
        
        {/* Background ambient accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-luxury-gold/5 blur-3xl rounded-full pointer-events-none"></div>
        {revealed && !isLotteryDeactivated && (
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-luxury-purple/10 blur-3xl rounded-full pointer-events-none"></div>
        )}

        {/* Closing trigger */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-white/40 hover:text-luxury-gold hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 z-20 cursor-pointer p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)]"
          title="Dismiss Lottery"
        >
          <X size={18} />
        </button>

        {isLotteryDeactivated ? (
          /* SYSTEM CURRENTLY OFF SCREEN */
          <div className="space-y-6 py-6 animate-fade-in">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/40 rounded-full flex items-center justify-center text-red-400 relative shadow-xl animate-pulse">
                <Lock size={26} />
              </div>
              
              <h3 className="font-serif text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-white tracking-widest mt-5 uppercase">
                SYSTEM OFFLINE
              </h3>
              <p className="text-[9px] text-[#ff8080] font-mono tracking-widest uppercase mt-1 flex items-center gap-1.5 font-bold">
                <span>IMPERIAL LOTTERY CURRENTLY OFF</span>
              </p>
            </div>

            <div className="border border-white/5 bg-[#090312]/60 p-5 rounded-xl space-y-3.5 shadow-inner backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/50"></div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans font-light tracking-wide">
                The exclusive Imperial Fortune Wheel is currently deactivated by the administrator for seasonal curation and system updates.
              </p>
              <div className="border-t border-white/5 my-2.5"></div>
              <p className="text-[10px] text-white/35 font-mono tracking-widest uppercase">
                Please check back later or contact live support.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#1c0808] border border-red-500/30 hover:border-red-500 text-[#ff8080] font-sans font-black text-[10.5px] uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer"
            >
              Close Window
            </button>
          </div>
        ) : hasUsedLottery ? (
          /* EXCLUSIVE ONE-TIME OFFER ALREADY REDEEMED SCREEN */
          <div className="space-y-6 py-6 animate-fade-in">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-luxury-gold/5 border-2 border-luxury-gold/40 rounded-full flex items-center justify-center text-luxury-gold relative shadow-xl">
                <Check size={26} className="text-luxury-gold" />
              </div>
              
              <h3 className="font-serif text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-luxury-gold tracking-widest mt-5 uppercase">
                OFFER REDEEMED
              </h3>
              <p className="text-[9px] text-luxury-gold font-mono tracking-widest uppercase mt-1 flex items-center gap-1.5 font-bold">
                <span>VOUCHER USED SUCCESSFULLY</span>
              </p>
            </div>

            <div className="border border-white/5 bg-[#090312]/60 p-5 rounded-xl space-y-3.5 shadow-inner backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-luxury-gold"></div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans font-light tracking-wide">
                You have already played your Imperial Fortune Wheel and successfully redeemed your one-time luxury discount voucher code at checkout.
              </p>
              <div className="border-t border-white/5 my-2.5"></div>
              <p className="text-[10px] text-white/35 font-mono tracking-widest uppercase">
                Limit of 1 claim per customer.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#10031f]/60 hover:bg-[#180530]/80 border border-luxury-gold/50 hover:border-luxury-gold text-white font-display font-black text-[10.5px] uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer"
            >
              Back to Showroom
            </button>
          </div>
        ) : !revealed ? (
          /* SECTION A: THE LOCKED VIP EXCLUSIVE ENVELOPE */
          <div className="space-y-6 py-4 animate-fade-in">
            {/* Top crown emblem */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-b from-[#150228] to-luxury-black border-2 border-luxury-gold/40 rounded-full flex items-center justify-center text-luxury-gold relative shadow-xl shadow-luxury-purple/15 animate-pulse">
                <Crown size={26} className="text-luxury-gold" />
                <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20"></div>
              </div>
              
              <h3 className="font-serif text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-luxury-gold to-white tracking-widest mt-4 uppercase">
                Imperial Club
              </h3>
              <p className="text-[10px] text-luxury-gold font-mono tracking-widest uppercase mt-1 flex items-center gap-1.5">
                <span>EXCLUSIVE EXCLUSIVE MEMBERSHIP VOUCHER</span>
              </p>
            </div>

            {/* Simulated Luxury Wax Sealed Letter */}
            <div className="border border-luxury-gold/20 bg-[#08080a] p-6 rounded-xl space-y-4 shadow-2xl relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-luxury-gold"></div>
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">System Status: NOMINATED VIP</span>
                <p className="text-xs text-white/80 leading-relaxed font-sans px-2">
                  Congratulations! Our system has selected you to receive an immediate luxury discount voucher code valid at checkout today.
                </p>
              </div>

              {/* Decorative dotted layout line */}
              <div className="border-t border-dashed border-white/10 my-4"></div>

              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-luxury-gold uppercase tracking-wider">
                <Star size={10} className="animate-spin text-luxury-gold" />
                <span>CONFIDENTIAL • INSTANT GENERATOR</span>
                <Star size={10} className="animate-spin text-luxury-gold" />
              </div>
            </div>

            {/* Interactive Reveal Button */}
            <button
              onClick={handleReveal}
              className="running-glow-gold-filled w-full text-luxury-black font-display font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-xl shadow-luxury-gold/10 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={14} className="animate-spin relative z-10" />
              <span className="relative z-10">REVEAL INSTANT VIP DISCOUNT</span>
            </button>

            <p className="text-[9px] text-white/30 font-mono tracking-wider">
              REPLICA IMPERIAL COLLECTIVE VERIFIED SECURITY ENVELOPE
            </p>
          </div>
        ) : (
          /* SECTION B: REVEALED CUSTOM LUXURY DISCOUNT VOUCHER CARD */
          <div className="space-y-6 py-2 animate-fade-in">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 mb-2">
                <Check size={20} className="animate-bounce" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider">Voucher Generated Successfully</h3>
              <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">
                EXCLUSIVE TO YOUR BROWSER SESSION
              </p>
            </div>

            {/* MAGNIFICENT DESIGN VOUCHER PASS */}
            <div className="border-2 border-dashed border-luxury-gold/50 bg-gradient-to-b from-[#0f0a05] to-[#040201] p-6 rounded-2xl relative overflow-hidden group shadow-2xl">
              {/* Metallic shimmering sheen swipe effect across voucher */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms] pointer-events-none z-10"></div>
              
              {/* Ribbon Gold Badge top corner */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-luxury-gold text-luxury-black text-[8px] font-display font-black uppercase px-2 py-0.5 rounded tracking-wider">
                <Trophy size={8} /> VIP PASS
              </div>

              <div className="space-y-2 relative z-10">
                <span className="text-[9px] font-mono text-luxury-gold uppercase tracking-[0.25em] font-extrabold block">
                  THE IMPERIAL VOUCHER
                </span>
                
                {/* GIANT DYNAMIC DISCOUNT % */}
                <div className="py-2">
                  <span className="block font-serif text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold via-[#fffdf0] to-luxury-gold-dark leading-none tracking-tighter drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)] select-all">
                    {discountPercent}% OFF
                  </span>
                </div>

                <div className="border-t border-dashed border-luxury-gold/30 my-3"></div>

                {/* COPYABLE CODE BLOCK */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                    APPLY THIS CODE AT CHECKOUT
                  </span>
                  
                  <div className="flex items-center gap-2 bg-luxury-black border border-white/10 px-4 py-2 rounded-xl w-full max-w-[240px]">
                    <span className="text-sm font-mono font-bold tracking-widest text-white flex-1 text-center select-all">
                      {voucherCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="text-luxury-gold hover:text-white p-1 hover:bg-white/5 rounded transition-all cursor-pointer"
                      title="Copy Voucher Code"
                    >
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Success Copy Badge */}
              {copied && (
                <div className="absolute inset-x-0 bottom-2 text-center animate-fade-in">
                  <span className="inline-block bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-mono uppercase px-3 py-1 rounded-full">
                    Discount Code Copied to Clipboard!
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-white/60 leading-relaxed font-sans max-w-sm mx-auto">
              Copy the code above and paste it on checkout to receive your <strong>{discountPercent}% immediate price deduction</strong> today!
            </p>

            <div className="pt-4">
              <button
                onClick={onClose}
                className="w-full bg-[#10031f]/60 hover:bg-[#180530]/80 border border-luxury-gold/50 hover:border-luxury-gold text-white font-display font-black text-[10.5px] uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:scale-[1.01] active:scale-95"
              >
                Let's Shop Now
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
