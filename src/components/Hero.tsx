import { useEffect, useRef, useState } from "react";
import { Banner } from "../types";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeroProps {
  banners?: Banner[];
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImage?: string;
  bannerIsVideo?: boolean;
}

export default function Hero({
  banners = [],
  bannerTitle = "STYLE X COLLECTIVE",
  bannerSubtitle = "A meticulous exploration of minimalist form and avant-garde structure. Curated exclusively by Risat Adnan for the modern visionary.",
  bannerImage = "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop",
  bannerIsVideo = false
}: HeroProps) {
  // Filter active banners
  const activeBanners = banners && banners.length > 0
    ? banners.filter(b => b.active)
    : [];

  // Fallback to single banner if no active banners
  const displayBanners = activeBanners.length > 0 
    ? activeBanners 
    : [{
        id: "default-banner",
        title: bannerTitle,
        subtitle: bannerSubtitle,
        imageUrl: bannerImage,
        isVideo: bannerIsVideo,
        active: true
      }];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Safe helper to auto-detect video extensions
  const isVideoUrlStr = (url?: any) => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return (
      lower.includes('is_video=true') || 
      lower.includes('#video') || 
      lower.includes('#is_video') ||
      lower.includes('.mp4') ||
      lower.includes('.webm') ||
      lower.includes('.mov') ||
      lower.includes('.ogg') ||
      lower.includes('.m4v') ||
      lower.includes('video/') ||
      lower.startsWith('data:video/')
    );
  };

  const currentBanner = displayBanners[currentIndex] || displayBanners[0];
  const isVideo = currentBanner.isVideo || isVideoUrlStr(currentBanner.imageUrl);

  // Auto-advance interval
  useEffect(() => {
    if (!isPlaying || displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlaying, displayBanners.length]);

  // Safe video playback handler for current index video
  useEffect(() => {
    const video = videoRefs.current[currentBanner.id];
    if (isVideo && video) {
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
  }, [currentIndex, isVideo, currentBanner.id, currentBanner.imageUrl]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
  };

  return (
    <div className="relative w-full min-h-[60vh] md:h-[80vh] bg-gradient-to-b from-luxury-black via-[#100122] to-luxury-black flex items-center justify-center overflow-hidden border-b-2 border-luxury-gold/20 shadow-[inset_0_0_100px_rgba(106,13,173,0.3)] group/hero">
      
      {/* Background Slides Render with Framer Motion (cross-fade) */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {isVideo ? (
              <video
                key={currentBanner.imageUrl}
                ref={(el) => { 
                  videoRefs.current[currentBanner.id] = el; 
                  if (el) {
                    el.defaultMuted = true;
                    el.muted = true;
                    el.playsInline = true;
                    try {
                      el.play().catch((err) => {
                        console.warn("Direct autoplay in ref failed:", err);
                      });
                    } catch (e) {}
                  }
                }}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover scale-105"
                style={{
                  filter: "none",
                  opacity: 1
                }}
                src={currentBanner.imageUrl}
              />
            ) : (
              <div 
                className="absolute inset-0 bg-cover bg-center scale-105"
                style={{ 
                  backgroundImage: `url(${currentBanner.imageUrl})`,
                  filter: "none",
                  opacity: 1
                }}
              ></div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subtle overlay to ensure premium readability of serif headers over 100% opacity backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/70 z-[5] pointer-events-none"></div>

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

      {/* Centered Main Story Text Box with Slide Content */}
      <div className="relative max-w-4xl mx-auto px-6 text-center z-20 flex flex-col items-center select-none">
        <p className="text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold via-luxury-purple-glowing to-luxury-gold font-display text-[11px] font-bold tracking-[0.4em] uppercase mb-4 animate-pulse">
          ARCHIVE 00{currentIndex + 1} // THE EXPANSION SERIES
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* Large Playfair Display Headers with sleek serif gradients */}
            <h2 className="font-serif text-5xl sm:text-7xl md:text-9xl font-semibold tracking-normal leading-[1.05] capitalize mb-8 scale-y-[0.98] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              <span className="block text-white transition-all duration-300">Style <span className="font-serif italic font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-luxury-purple-glowing via-luxury-gold to-white">.X</span></span>
              <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-white via-luxury-gold to-luxury-purple-glowing tracking-[0.15em] font-light text-2xl sm:text-4xl md:text-5xl uppercase mt-3">
                {currentBanner.title}
              </span>
            </h2>

            {/* Brand narrative details */}
            <p className="text-white font-sans text-xs sm:text-sm md:text-base font-medium tracking-wide max-w-xl leading-relaxed italic mb-10 min-h-[48px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {currentBanner.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Scroll action element indicators */}
        <div className="w-[1.5px] h-14 bg-gradient-to-b from-luxury-gold via-luxury-purple-glowing to-transparent animate-bounce"></div>
      </div>

      {/* Manual Controls: Prev & Next Arrows (Visible on hover of the banner section) */}
      {displayBanners.length > 1 && (
        <>
          <button 
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full border border-white/10 bg-black/40 hover:bg-luxury-gold text-white hover:text-luxury-black opacity-0 group-hover/hero:opacity-100 transition-all duration-300 backdrop-blur-sm cursor-pointer"
            aria-label="Previous Banner"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full border border-white/10 bg-black/40 hover:bg-luxury-gold text-white hover:text-luxury-black opacity-0 group-hover/hero:opacity-100 transition-all duration-300 backdrop-blur-sm cursor-pointer"
            aria-label="Next Banner"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Bottom Blueprint metadata strips & Slide indicators */}
      <div className="absolute bottom-6 left-8 hidden lg:flex items-center gap-1.5 z-20 text-[10px] tracking-widest text-white/40 font-mono">
        <span className="w-2.5 h-2.5 bg-luxury-gold animate-ping rounded-full inline-block"></span>
        <span className="text-white/60">SEQUENCE LIVE</span>
      </div>

      {/* Interactive indicators / pagination bullets at bottom center */}
      {displayBanners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-black/30 px-3.5 py-1.5 rounded-full border border-white/5 backdrop-blur-xs">
          {displayBanners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                idx === currentIndex 
                  ? "w-6 bg-luxury-gold" 
                  : "w-1.5 bg-white/40 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="ml-1 text-white/50 hover:text-white transition-colors cursor-pointer"
            title={isPlaying ? "Pause autoplay" : "Resume autoplay"}
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          </button>
        </div>
      )}

      <div className="absolute bottom-6 right-8 hidden lg:flex flex-col items-end z-20 text-[10px] tracking-widest text-white/40 font-mono">
        <p>EXHIBITION SEQUENCE {currentIndex + 1} // {displayBanners.length}</p>
      </div>
    </div>
  );
}
