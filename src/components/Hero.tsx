import { useEffect, useRef } from "react";

interface HeroProps {
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImage?: string;
  bannerIsVideo?: boolean;
}

export default function Hero({
  bannerTitle = "STYLE X COLLECTIVE",
  bannerSubtitle = "A meticulous exploration of minimalist form and avant-garde structure. Curated exclusively by Risat Adnan for the modern visionary.",
  bannerImage = "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop",
  bannerIsVideo = false
}: HeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Safe helper to auto-detect video extensions
  const isVideoUrlStr = (url?: any) => {
    if (!url || typeof url !== 'string') return false;
    if (url.includes('is_video=true') || url.includes('#video') || url.includes('#is_video')) return true;
    const cleanUrl = url.split(/[?#]/)[0].toLowerCase();
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.mov') ||
      cleanUrl.endsWith('.ogg') ||
      cleanUrl.endsWith('.m4v') ||
      url.startsWith('data:video/')
    );
  };

  const isVideo = bannerIsVideo || isVideoUrlStr(bannerImage);

  // Programmatic state correction for bulletproof mobile browsers compatibility
  useEffect(() => {
    if (isVideo && videoRef.current) {
      const video = videoRef.current;
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;

      const triggerPlayback = () => {
        try {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("Autoplay block was bypassed or delayed by browser preferences.", err);
            });
          }
        } catch (e) {
          console.error("Video play programmatic execution interrupted safely:", e);
        }
      };

      if (video.readyState >= 2) {
        triggerPlayback();
      } else {
        video.addEventListener('canplay', triggerPlayback);
      }

      return () => {
        video.removeEventListener('canplay', triggerPlayback);
      };
    }
  }, [bannerImage, isVideo]);

  return (
    <div className="relative w-full min-h-[60vh] md:h-[80vh] bg-gradient-to-b from-luxury-black via-[#100122] to-luxury-black flex items-center justify-center overflow-hidden border-b-2 border-luxury-gold/20 shadow-[inset_0_0_100px_rgba(106,13,173,0.3)]">
      {/* Cinematic Ambient Background Photo/Video with Dark Luxury Overlays */}
      {isVideo ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 scale-105"
          style={{
            filter: "brightness(0.3) contrast(1.1) saturate(0.7)"
          }}
          src={bannerImage}
        />
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
          style={{ 
            backgroundImage: `url(${bannerImage})`,
            filter: "brightness(0.25) contrast(1.15) saturate(0.8)"
          }}
        ></div>
      )}

      {/* Luxury Golden and Royal Purple Glimmer Particles system */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(20)].map((_, i) => {
          const delay = i * 0.5;
          const left = Math.random() * 100;
          const isPurple = i % 2 === 0;
          return (
            <div 
              key={i}
              className="absolute w-1 h-1 rounded-full opacity-65 animate-gold-particles"
              style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                top: "100%",
                background: isPurple ? "#9A4DFF" : "#D4AF37",
                boxShadow: isPurple ? "0 0 10px rgba(154,77,255,0.8)" : "0 0 8px rgba(212,175,55,0.8)"
              }}
            ></div>
          );
        })}
      </div>

      {/* Decorative Blueprint Corner Metrics - Dhaka Coordinates */}
      <div className="absolute top-8 left-8 hidden lg:flex flex-col gap-1 z-20 text-[10px] tracking-wide text-white/40 font-mono">
        <p>PROJECT: STYLE X EXPANSION</p>
        <p>LAT: 23.8103° N | LONG: 90.4125° E</p>
        <p className="text-luxury-purple-glowing font-sans italic">SIGNATURE INK: ROYAL PURPLE</p>
      </div>

      <div className="absolute top-8 right-8 hidden lg:flex flex-col items-end gap-1 z-20 text-[10px] tracking-wide text-white/40 font-mono text-right">
        <p>EDITION 2.0 // GOLD & PURPLE ROYAL</p>
        <p>INTEGRITY: HIGH-CRAFT ENGINE</p>
        <p className="text-luxury-gold/60">CONCIERGE ONLINE</p>
      </div>

      {/* Centered Main Story Text Box */}
      <div className="relative max-w-4xl mx-auto px-6 text-center z-20 flex flex-col items-center">
        <p className="text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold via-luxury-purple-glowing to-luxury-gold font-display text-[11px] font-bold tracking-[0.4em] uppercase mb-4 animate-pulse">
          ARCHIVE 001 // THE EXPANSION SERIES
        </p>

        {/* Large Playfair Display Headers with sleek serif gradients */}
        <h2 className="font-serif text-5xl sm:text-7xl md:text-9xl font-semibold tracking-normal leading-[1.05] capitalize mb-8 select-none scale-y-[0.98]">
          <span className="block text-white transition-all duration-300">Style <span className="font-serif italic font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-luxury-purple-glowing via-luxury-gold to-white">.X</span></span>
          <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-white via-luxury-gold to-luxury-purple-glowing tracking-[0.2em] font-light text-2xl sm:text-4xl md:text-5xl uppercase mt-3">
            ROYAL COUTURE
          </span>
        </h2>

        {/* Brand narrative details */}
        <p className="text-white/85 font-sans text-xs sm:text-sm md:text-base font-light tracking-wide max-w-xl leading-relaxed italic mb-10">
          {bannerSubtitle}
        </p>

        {/* Scroll action element indicators */}
        <div className="w-[1.5px] h-14 bg-gradient-to-b from-luxury-gold via-luxury-purple-glowing to-transparent animate-bounce"></div>
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
