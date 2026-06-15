interface HeroProps {
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImage?: string;
}

export default function Hero({
  bannerTitle = "STYLE X COLLECTIVE",
  bannerSubtitle = "A meticulous exploration of minimalist form and avant-garde structure. Curated exclusively by Risat Adnan for the modern visionary.",
  bannerImage = "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop"
}: HeroProps) {
  return (
    <div className="relative w-full min-h-[60vh] md:h-[80vh] bg-luxury-black flex items-center justify-center overflow-hidden border-b border-luxury-gold/15">
      {/* Cinematic Ambient Background Photo with Dark Luxury Overlays */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ 
          backgroundImage: `url(${bannerImage})`,
          filter: "brightness(0.3) contrast(1.1)"
        }}
      ></div>

      {/* Luxury Golden Glimmer Particles system */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(15)].map((_, i) => {
          const delay = i * 0.7;
          const left = Math.random() * 100;
          return (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-luxury-gold rounded-full opacity-60 animate-gold-particles"
              style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                top: "100%",
                boxShadow: "0 0 8px #FFD700"
              }}
            ></div>
          );
        })}
      </div>

      {/* Decorative Blueprint Corner Metrics - Dhaka Coordinates (Authentic touch!) */}
      <div className="absolute top-8 left-8 hidden lg:flex flex-col gap-1 z-20 text-[10px] tracking-wide text-white/40 font-mono">
        <p>PROJECT: STYLE X SEQUENCE</p>
        <p>LAT: 23.8103° N | LONG: 90.4125° E</p>
        <p className="text-luxury-gold/60 font-sans italic">AUTH: RISAT ADNAN SIGNATURE</p>
      </div>

      <div className="absolute top-8 right-8 hidden lg:flex flex-col items-end gap-1 z-20 text-[10px] tracking-wide text-white/40 font-mono text-right">
        <p>ARCHIVE 001 // COLLECTION 2026</p>
        <p>INTEGRITY: SECURE SHAPE ENGINE</p>
        <p>CONCIERGE ACTIVE</p>
      </div>

      {/* Centered Main Story Text Box */}
      <div className="relative max-w-4xl mx-auto px-6 text-center z-20 flex flex-col items-center">
        <p className="text-luxury-gold font-display text-[10px] tracking-[0.3em] uppercase mb-4 animate-fade-in">
          ARCHIVE 001 / 2026
        </p>

        {/* Large Playfair Display Headers with custom serif italicization */}
        <h2 className="font-serif text-4xl sm:text-6xl md:text-8xl font-medium text-white tracking-normal leading-[1.05] capitalize mb-8 select-none scale-y-[0.98]">
          <span className="block text-white">Style <span className="font-serif italic font-light text-luxury-gold">.X</span></span>
          <span className="block italic text-white tracking-widest font-light text-3xl sm:text-5xl md:text-6xl uppercase mt-2">
            COLLECTIVE
          </span>
        </h2>

        {/* Brand narrative details */}
        <p className="text-white/80 font-sans text-xs sm:text-sm md:text-base font-light tracking-wide max-w-xl leading-relaxed italic mb-10">
          {bannerSubtitle}
        </p>

        {/* Scroll action element indicators */}
        <div className="w-[1px] h-12 bg-gradient-to-b from-luxury-gold to-transparent animate-bounce"></div>
      </div>

      {/* Bottom Blueprint metadata strips */}
      <div className="absolute bottom-6 left-8 hidden lg:flex items-center gap-1.5 z-20 text-[10px] tracking-widest text-white/40 font-mono">
        <span className="w-2.5 h-2.5 bg-luxury-gold animate-ping rounded-full inline-block"></span>
        <span className="text-white/60">SEQUENCE LIVE</span>
      </div>

      <div className="absolute bottom-6 right-8 hidden lg:flex flex-col items-end z-20 text-[10px] tracking-widest text-white/40 font-mono">
        <p>EXHIBITION SEQUENCE</p>
      </div>
    </div>
  );
}
