import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Lock, X, EyeOff, Sparkles, AlertOctagon } from 'lucide-react';

interface SourceProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  imageUrl?: string;
}

export default function SourceProtectionModal({ isOpen, onClose, title, description, imageUrl }: SourceProtectionModalProps) {
  if (!isOpen) return null;

  const displayTitle = title && title.trim() ? title : "Nice Try! 🛑";
  const displayDesc = description && description.trim() 
    ? description 
    : "This application's proprietary source code, styling assets, and architecture are protected by strict intellectual property controls.";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-start sm:items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative max-w-lg w-full my-auto bg-[#0a0a0c] border-2 border-red-500/50 rounded-2xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-luxury-gold/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 z-20 cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold tracking-widest uppercase mb-4">
            <Lock size={12} /> Access Restricted
          </div>

          {/* Banner Image or Default Shield Icon */}
          {imageUrl && imageUrl.trim() ? (
            <div className="mb-5 relative group overflow-hidden rounded-xl border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
              <img 
                src={imageUrl} 
                alt="Protection Notice" 
                className="w-full max-h-56 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-5 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <ShieldAlert size={40} className="animate-pulse" />
            </div>
          )}

          {/* Main Title */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            {displayTitle}
          </h2>

          <p className="text-sm sm:text-base text-zinc-300 font-medium mb-4 leading-relaxed">
            Source Code & DevTools Inspection is disabled for <span className="text-luxury-gold font-bold">STYLE X</span>.
          </p>

          {/* Big Notice Text / Warning Description */}
          <div className="p-4 bg-black/70 border border-red-500/30 rounded-xl text-left mb-6 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap space-y-2 shadow-inner">
            <div className="text-red-400 font-mono font-bold flex items-center gap-1.5 pb-1 border-b border-white/10">
              <AlertOctagon size={15} /> SECURITY WARNING NOTICE:
            </div>
            <p className="pt-1 text-zinc-200">
              {displayDesc}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 via-luxury-gold to-red-600 text-black font-extrabold text-sm uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <EyeOff size={16} /> Close & Return to Shop
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
