import { useState } from 'react';
import { X, Trophy, Sparkles, Copy, Check } from 'lucide-react';

interface LotteryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOTTERY_PRIZES = [
  { text: "15% OFF (STYLEGOLD)", value: "STYLEGOLD", type: "coupon" },
  { text: "VIP Free Carriage", value: "FREE_SHIPPING", type: "shipping" },
  { text: "৳20 OFF (RISATVIP)", value: "RISATVIP", type: "coupon" },
  { text: "Limited Edition SX Patch", value: "SX_PATCH", type: "merch" },
  { text: "Exclusive Concierge Pass", value: "MEMBER_PASS", type: "pass" },
  { text: "Royal Golden Keychain", value: "KEYCHAIN", type: "merch" }
];

export default function LotteryModal({ isOpen, onClose }: LotteryModalProps) {
  const [spinning, setSpinning] = useState(false);
  const [outcome, setOutcome] = useState<typeof LOTTERY_PRIZES[0] | null>(null);
  const [copied, setCopied] = useState(false);
  const [rotations, setRotations] = useState(0);

  if (!isOpen) return null;

  const handleLaunchSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setOutcome(null);
    setCopied(false);

    // Add multiple rotations for visual impact
    const additionalRotation = rotations + 1440 + Math.floor(Math.random() * 360);
    setRotations(additionalRotation);

    setTimeout(() => {
      // Pick random index
      const randomIndex = Math.floor(Math.random() * LOTTERY_PRIZES.length);
      setOutcome(LOTTERY_PRIZES[randomIndex]);
      setSpinning(false);
    }, 2800);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Absolute gray backing dim */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-luxury-black/90 backdrop-blur-sm"
      ></div>

      {/* Frame panel */}
      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-luxury-gold/30 rounded-lg p-6 text-center shadow-2xl z-10 overflow-hidden animate-fade-in gold-glow-border">
        
        {/* Background ambient accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-luxury-gold/5 blur-3xl rounded-full pointer-events-none"></div>

        {/* Closing trigger */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-white/50 hover:text-luxury-gold transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-luxury-charcoal border border-luxury-gold/30 rounded-full flex items-center justify-center text-luxury-gold mb-2.5">
            <Trophy size={20} className="animate-bounce" />
          </div>
          <h3 className="font-serif text-xl font-bold text-white uppercase tracking-wider">The Imperial Draw</h3>
          <p className="text-[10px] text-luxury-gold uppercase font-mono tracking-widest mt-1">
            Exclusive Luxury fortune wheel
          </p>
        </div>

        {/* Visual spinning roulette board */}
        <div className="relative mx-auto w-52 h-52 flex items-center justify-center mb-6">
          {/* External wheel perimeter circle */}
          <div 
            className="w-full h-full rounded-full border-4 border-luxury-gold/40 relative flex items-center justify-center bg-luxury-charcoal/50 transition-transform duration-[2800ms] ease-out shadow-2xl"
            style={{ 
              transform: `rotate(${rotations}deg)`,
              boxShadow: "0 0 25px rgba(212, 175, 55, 0.2)"
            }}
          >
            {/* Dividing spoke lines */}
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-luxury-gold/15" 
                style={{ transform: `rotate(${i * 30}deg)` }}
              ></div>
            ))}

            {/* Inner Prizes names */}
            {LOTTERY_PRIZES.map((p, idx) => (
              <div 
                key={idx}
                className="absolute text-[7px] text-white/70 font-mono uppercase font-bold tracking-tight select-none pointer-events-none"
                style={{
                  transform: `rotate(${idx * 60}deg) translateY(-72px)`
                }}
              >
                {p.text.split(" ")[0]}
              </div>
            ))}

            {/* Solid Center hub */}
            <div className="w-12 h-12 rounded-full bg-luxury-black border-2 border-luxury-gold flex items-center justify-center z-10">
              <Sparkles size={14} className="text-luxury-gold" />
            </div>
          </div>

          {/* Golden Pointer top needle indicator arrow */}
          <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-luxury-gold z-20"></div>
        </div>

        {/* Wheels interaction rules and outcome reveal panels */}
        {outcome ? (
          <div className="bg-[#121212] border border-luxury-gold/20 p-4 rounded-lg mb-6 flex flex-col items-center animate-fade-in">
            <span className="text-[9px] text-luxury-gold font-mono uppercase tracking-[0.2em] mb-1">
              CONGRATULATIONS IN THE DRAW
            </span>
            <p className="font-serif text-lg font-bold text-white">{outcome.text}</p>
            
            {outcome.type === 'coupon' ? (
              <div className="mt-3.5 flex items-center gap-2 w-full max-w-[200px]">
                <div className="bg-luxury-black text-center font-mono text-xs uppercase tracking-widest text-white border border-white/15 px-3 py-1.5 rounded flex-1">
                  {outcome.value}
                </div>
                <button
                  onClick={() => handleCopyCode(outcome.value)}
                  className="bg-luxury-gold text-luxury-black hover:bg-white p-2 rounded transition-all cursor-pointer"
                  title="Copy Coupon"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-white/50 leading-relaxed font-sans italic max-w-sm mt-3">
                Instruct our live VIP support of this prize inside checkout notes or WhatsApp verification!
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-white/50 leading-relaxed max-w-sm mx-auto mb-6">
            Spin the Royal fortune wheel to win limited discount coupons or luxury accessories. Valid for checkout today!
          </p>
        )}

        {/* Interactive primary Spin CTA button */}
        <button
          onClick={handleLaunchSpin}
          disabled={spinning}
          className="w-full bg-gradient-to-r from-luxury-gold-dark to-luxury-gold hover:brightness-110 text-luxury-black font-display font-extrabold text-[11px] uppercase tracking-[0.2em] py-3 rounded-full transition-all disabled:opacity-50"
        >
          {spinning ? "SPINNING WHEEL..." : "SPIN THE IMPERIAL WHEEL"}
        </button>

      </div>
    </div>
  );
}
