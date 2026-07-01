import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  Sparkles, X, Send, Bot, Copy, Check, Ticket, 
  MapPin, HelpCircle, Shirt, Package, Compass, ShoppingBag,
  Volume2, VolumeX
} from 'lucide-react';
import { Product, CartItem, Coupon } from '../types';

// @ts-ignore
import defaultXoroAvatar from '../assets/images/xoro_mascot_3d_1782635214676.jpg';

interface XoroAssistantProps {
  products: Product[];
  coupons: Coupon[];
  cart: CartItem[];
  currentProduct: Product | null;
  isCartOpen: boolean;
  confirmedOrderId: string;
  isTrackMode: boolean;
  onSelectProduct: (product: Product) => void;
  onTrackOrder: (orderId: string) => void;
  settings?: any;
  onToggleCart?: (isOpen: boolean) => void;
  onSetCategory?: (category: string) => void;
  onToggleLottery?: (isOpen: boolean) => void;
  onSetTrackMode?: (track: boolean) => void;
  onShowLoginModal?: (show: boolean) => void;
  onSetSearchPage?: (search: boolean) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  type?: 'text' | 'products' | 'coupons' | 'fit';
  meta?: any;
}

const XORO_TIPS = [
  "👕 Black and white never go out of style.",
  "⌚ A great watch completes your look.",
  "✨ Confidence is your best outfit.",
  "🧥 Layering with a premium jacket raises your outfit status instantly.",
  "👟 Match your shoe color to your belt for a cohesive, professional aesthetic.",
  "👔 A crisp, well-fitted collar frames the face beautifully."
];



const XORO_AVATAR = defaultXoroAvatar;

const makeAvatarBackgroundTransparent = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageSrc);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // Sample a 15x15 area at the top-left corner to get the baseline background color
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      const sampleSize = Math.min(15, width, height);
      for (let y = 0; y < sampleSize; y++) {
        for (let x = 0; x < sampleSize; x++) {
          const idx = (y * width + x) * 4;
          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
          count++;
        }
      }
      const refR = sumR / count;
      const refG = sumG / count;
      const refB = sumB / count;
      
      // Visited array to mark pixels classified as background
      const visited = new Uint8Array(width * height);
      
      // Helper function to check if a pixel matches background properties (bright, neutral, near-corner color)
      const isMaybeBackgroundPixel = (x: number, y: number): boolean => {
        // Protect Xoro's belly (পেট) and legs (পা) in the central bottom region from being classified as background (preventing transparency bleeding)
        if (y > height * 0.35 && x > width * 0.25 && x < width * 0.75) {
          return false;
        }

        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        
        const distToBg = Math.sqrt((r - refR) ** 2 + (g - refG) ** 2 + (b - refB) ** 2);
        const distToWhite = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
        
        // Stricter background classification:
        // Background in this studio backdrop is very close to white/light-grey.
        // - distToBg < 35 (close to the sampled white corner color)
        // - OR distToWhite < 35 (close to absolute white)
        // - OR a bright, low-saturation neutral color (r > 220, g > 220, b > 220, and chroma < 15)
        const isNearBg = distToBg < 35;
        const isNearWhite = distToWhite < 35;
        const isBrightNeutral = r > 220 && g > 220 && b > 220 && chroma < 15;
        
        return isNearBg || isNearWhite || isBrightNeutral;
      };
      
      // BFS queue to perform border-connected flood fill
      const queue: number[] = [];
      
      // Enqueue all border pixels that are part of the background
      for (let x = 0; x < width; x++) {
        // Top row
        if (isMaybeBackgroundPixel(x, 0)) {
          const offset = x;
          visited[offset] = 1;
          queue.push(offset);
        }
        // Bottom row (only near the left and right corners, avoiding the feet in the center)
        if ((x < width * 0.25 || x > width * 0.75) && isMaybeBackgroundPixel(x, height - 1)) {
          const offset = (height - 1) * width + x;
          visited[offset] = 1;
          queue.push(offset);
        }
      }
      for (let y = 1; y < height - 1; y++) {
        // Left column
        if (isMaybeBackgroundPixel(0, y)) {
          const offset = y * width;
          visited[offset] = 1;
          queue.push(offset);
        }
        // Right column
        if (isMaybeBackgroundPixel(width - 1, y)) {
          const offset = y * width + (width - 1);
          visited[offset] = 1;
          queue.push(offset);
        }
      }
      
      // Run flood-fill queue to discover all connected background regions
      let qHead = 0;
      while (qHead < queue.length) {
        const offset = queue[qHead++];
        const cx = offset % width;
        const cy = Math.floor(offset / width);
        
        const neighbors = [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1]
        ];
        
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nOffset = ny * width + nx;
            if (visited[nOffset] === 0 && isMaybeBackgroundPixel(nx, ny)) {
              visited[nOffset] = 1;
              queue.push(nOffset);
            }
          }
        }
      }
      
      // Apply transparency and soft-feather borders
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = y * width + x;
          const idx = offset * 4;
          
          if (visited[offset] === 1) {
            // Check if this background pixel is immediately adjacent to the body
            let isBoundary = false;
            if (x > 0 && visited[offset - 1] === 0) isBoundary = true;
            else if (x < width - 1 && visited[offset + 1] === 0) isBoundary = true;
            else if (y > 0 && visited[offset - width] === 0) isBoundary = true;
            else if (y < height - 1 && visited[offset + width] === 0) isBoundary = true;
            
            if (isBoundary) {
              data[idx + 3] = 95; // Soft anti-aliased edge
            } else {
              data[idx + 3] = 0; // Pure transparent background
            }
          } else {
            // Xoro's 3D Body: absolutely 100% opaque, no transference!
            data[idx + 3] = 255;
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        resolve(imageSrc);
      }
    };
    img.onerror = () => {
      resolve(imageSrc);
    };
  });
};

export default function XoroAssistant({
  products,
  coupons,
  cart,
  currentProduct,
  isCartOpen,
  confirmedOrderId,
  isTrackMode,
  onSelectProduct,
  onTrackOrder,
  settings,
  onToggleCart,
  onSetCategory,
  onToggleLottery,
  onSetTrackMode,
  onShowLoginModal,
  onSetSearchPage
}: XoroAssistantProps) {
  const dragControls = useDragControls();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'explore'>('chat');
  const [isTouring, setIsTouring] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(settings?.xoroAvatarUrl || XORO_AVATAR);

  const currentAvatar = settings?.xoroAvatarUrl || XORO_AVATAR;

  useEffect(() => {
    makeAvatarBackgroundTransparent(currentAvatar).then((transparentUrl) => {
      setAvatarUrl(transparentUrl);
    });
  }, [currentAvatar]);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "👋 আসসালামু আলাইকুম! স্টাইল এক্স (Style X)-এ আপনাকে স্বাগতম! আমি জোরো (Xoro)। আজ আপনার স্টাইলকে আরও আকর্ষণীয় করতে আমি কীভাবে সাহায্য করতে পারি?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Speech bubble state variables declared early to prevent temporal dead zone (TS2448)
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [speechBubbleText, setSpeechBubbleText] = useState("👋 আসসালামু আলাইকুম! স্টাইল এক্স-এ আপনাকে স্বাগতম! আমি জোরো (Xoro)। আজ আপনার ফ্যাশন ট্রেন্ড আপগ্রেড করতে প্রস্তুত?");
  const [hasDismissedBubble, setHasDismissedBubble] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Audio state for robotic idle humming (always enabled by default)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const biquadFilterRef = useRef<BiquadFilterNode | null>(null);

  const hasSpokenWelcomeRef = useRef(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechPulseIntervalRef = useRef<any>(null);
  const speechAuraRef = useRef<{ osc: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null>(null);

  // Clean up speech pulse interval and aura on unmount
  useEffect(() => {
    return () => {
      if (speechPulseIntervalRef.current) {
        clearInterval(speechPulseIntervalRef.current);
      }
      try {
        const sa = speechAuraRef.current;
        if (sa) {
          sa.osc.stop();
          sa.lfo.stop();
        }
      } catch (e) {}
    };
  }, []);

  // Helper to play procedural cute robotic sounds (EMO Go Home style beeps/chirps)
  const playEmoRobotSound = (type: 'greet' | 'think' | 'happy' = 'greet') => {
    if (!isSoundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'greet') {
        // Greet sound: 3 rapid, cute, high-pitched bubbly rising chirps
        // Chirp 1: 950Hz -> 1350Hz sweep
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(950, now);
        osc1.frequency.exponentialRampToValueAtTime(1350, now + 0.08);
        gain1.gain.setValueAtTime(0.06, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.08);

        // Chirp 2: 1200Hz -> 1700Hz sweep, starts slightly delayed
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, now + 0.07);
        osc2.frequency.exponentialRampToValueAtTime(1700, now + 0.15);
        gain2.gain.setValueAtTime(0.0, now);
        gain2.gain.setValueAtTime(0.06, now + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.15);

        // Chirp 3: 1500Hz -> 2100Hz sweep, starts delayed
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1500, now + 0.14);
        osc3.frequency.exponentialRampToValueAtTime(2100, now + 0.24);
        gain3.gain.setValueAtTime(0.0, now);
        gain3.gain.setValueAtTime(0.05, now + 0.14);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now + 0.14);
        osc3.stop(now + 0.24);
      } else if (type === 'happy') {
        // Happy sound: Multi-tone cute musical run
        const notes = [1046.50, 1174.66, 1318.51, 1567.98]; // C6, D6, E6, G6
        notes.forEach((freq, idx) => {
          const startTime = now + idx * 0.06;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.1, startTime + 0.05);
          gain.gain.setValueAtTime(0.05, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.06);
        });
      } else if (type === 'think') {
        // Thinking sound: Cute alternating high-low chirps
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(800, now);
        osc1.frequency.linearRampToValueAtTime(600, now + 0.1);
        gain1.gain.setValueAtTime(0.04, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.1);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1000, now + 0.08);
        osc2.frequency.linearRampToValueAtTime(1200, now + 0.18);
        gain2.gain.setValueAtTime(0.0, now);
        gain2.gain.setValueAtTime(0.04, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.18);
      }
    } catch (e) {
      console.warn("Robotic audio synthesis error:", e);
    }
  };

  const playClimbBeeps = () => {
    if (!isSoundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.04, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.15);
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const playJetIgnitionSound = () => {
    if (!isSoundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.5);
      osc.frequency.linearRampToValueAtTime(220, now + 1.5);
      
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.0);
    } catch (e) {
      console.warn(e);
    }
  };

  // Cozy, ambient high-fidelity cybernetic warmth pad (replaces mechanical clicks/digital beeps)
  // Plays a beautiful, soft, comforting 144Hz frequency aura (at < 1% volume) during speaking
  const startSpeechAura = () => {
    if (!isSoundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      // Stop any existing speech aura cleanly first
      if (speechAuraRef.current) {
        try {
          speechAuraRef.current.osc.stop();
          speechAuraRef.current.lfo.stop();
        } catch (e) {}
        speechAuraRef.current = null;
      }

      const now = ctx.currentTime;
      
      // Dual friendly harmonic sine waves (extremely low gain, warm studio vibe)
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(144, now); // Sweet solfeggio resonant humming frequency

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(2.2, now); // Gentle organic breathing rate
      lfoGain.gain.setValueAtTime(1.8, now); // Tiny warmth frequency wiggle (±1.8Hz)

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.008, now + 0.25); // Extremely soft, almost imperceptible premium AI warmth texture

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      lfo.start(now);
      osc.start(now);

      speechAuraRef.current = { osc, lfo, gain: gainNode };
    } catch (e) {}
  };

  const stopSpeechAura = () => {
    try {
      const sa = speechAuraRef.current;
      if (sa && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        sa.gain.gain.setValueAtTime(sa.gain.gain.value, now);
        sa.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        setTimeout(() => {
          try {
            sa.osc.stop();
            sa.lfo.stop();
          } catch (e) {}
          if (speechAuraRef.current === sa) {
            speechAuraRef.current = null;
          }
        }, 400);
      }
    } catch (e) {}
  };

  // Helper to read aloud text using Web Speech API (Text-to-Speech)
  // Tuned to sound premium, soft, comforting, warm, and highly professional with a medium-slow, gentle pace.
  const speakText = (text: string) => {
    if (!isSoundEnabled) return;
    try {
      // 1. Play the cozy introductory chirp sound effect
      const isShort = text.length < 50;
      playEmoRobotSound(isShort ? 'greet' : 'happy');
  
      // 2. Speak the actual text using the Web Speech API
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        // Cancel any pending speech first
        window.speechSynthesis.cancel();
        stopSpeechAura();
  
        // Workaround for Chrome bug where synthesis gets stuck in a "paused" state
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
  
        // Clean up emojis, markdown patterns for clean voice synthesis
        const cleanText = text
          .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '') // strip emojis
          .replace(/[*_#`~৳-]/g, ' ') // strip markdown and special symbols
          .replace(/XP-/gi, 'style code ')
          .trim();
  
        if (!cleanText) return;
  
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        const hasBengali = /[\u0980-\u09FF]/.test(cleanText);
  
        // Premium, comforting, warm, and clear voice tuning (no monotone or mechanical clicks)
        if (hasBengali) {
          utterance.rate = 0.90;  // Elegant, natural medium-slow tempo (0.88-0.92) for Bangla
          utterance.pitch = 1.02; // Friendly, sweet youthful pitch with a natural "voice smile"
          utterance.volume = 0.95; // Perfectly clear articulation
        } else {
          utterance.rate = 0.90;  // Comforting and articulate English pacing
          utterance.pitch = 1.05; // Soft premium tech tone
          utterance.volume = 0.95; 
        }
  
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;
  
        if (hasBengali) {
          // Prioritize clear high-quality Bangla voices (Google বাংলা, Microsoft Ananya, etc.)
          const bengaliKeys = ['bengali', 'bangla', 'bn', 'google বাংলা', 'ananya', 'shreya', 'dilara'];
          for (const key of bengaliKeys) {
            selectedVoice = voices.find(v => {
              const lang = v.lang.toLowerCase();
              const name = v.name.toLowerCase();
              return (lang.startsWith('bn') || name.includes(key));
            });
            if (selectedVoice) break;
          }
        }
  
        // Prioritize soft, warm, premium English voices if no Bangla selected or if speaking English
        if (!selectedVoice) {
          const warmVoiceKeys = ['natural', 'samantha', 'aria', 'jenny', 'sara', 'zira', 'female', 'google us english', 'microsoft'];
          for (const key of warmVoiceKeys) {
            selectedVoice = voices.find(v => {
              const lang = v.lang.toLowerCase();
              const name = v.name.toLowerCase();
              return lang.startsWith('en') && name.includes(key);
            });
            if (selectedVoice) break;
          }
        }
  
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith('en')) || voices[0];
        }
  
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else if (hasBengali) {
          utterance.lang = 'bn-BD';
        }
  
        // Retain reference to prevent garbage collection mid-speech (major Chrome bug fix)
        currentUtteranceRef.current = utterance;
  
        // Start cozy premium background presence hum when speaking begins
        startSpeechAura();
  
        utterance.onend = () => {
          currentUtteranceRef.current = null;
          stopSpeechAura();
        };
        utterance.onerror = (e) => {
          console.warn("SpeechSynthesisUtterance error:", e);
          currentUtteranceRef.current = null;
          stopSpeechAura();
        };
  
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  };

  const startHumming = () => {
    try {
      if (oscRef.current) return; // Already running

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Deep 60Hz hum for soft machine warmth
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(60, ctx.currentTime);

      // Higher metallic overtone at 120Hz
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(120, ctx.currentTime);

      // Cybernetic filter sweep to simulate machine fan / cooling air
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      // Low volume to keep it super cozy and non-intrusive
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.012, ctx.currentTime);

      // Slow LFO to pulse the power humming (representing breathing) at 0.15Hz
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.15, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.005, ctx.currentTime);

      // Connections
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(ctx.destination);

      lfo.connect(lfoGain);
      lfoGain.connect(mainGain.gain);

      // Start oscillators
      osc.start();
      osc2.start();
      lfo.start();

      oscRef.current = osc;
      osc2Ref.current = osc2;
      lfoRef.current = lfo;
      gainNodeRef.current = mainGain;
      biquadFilterRef.current = filter;
    } catch (err) {
      console.warn("Could not initiate Xoro digital sound engine:", err);
    }
  };

  const stopHumming = () => {
    try {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      if (osc2Ref.current) {
        osc2Ref.current.stop();
        osc2Ref.current.disconnect();
        osc2Ref.current = null;
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
        lfoRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      if (biquadFilterRef.current) {
        biquadFilterRef.current.disconnect();
        biquadFilterRef.current = null;
      }
    } catch (e) {
      // Ignored
    }
  };

  // Run hummingbird idle sound whenever sound is enabled (continuous robotic ambient feel)
  useEffect(() => {
    if (isSoundEnabled) {
      startHumming();
    } else {
      stopHumming();
    }
    return () => {
      stopHumming();
    };
  }, [isSoundEnabled]);

  // Hook up automatic audio context activation and welcome speech on first user interaction or scroll with the page
  useEffect(() => {
    const handleGesture = () => {
      if (isSoundEnabled) {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        startHumming();

        // Speak the welcome speech bubble greeting on the very first user interaction or scroll if it hasn't spoken yet
        if (!hasSpokenWelcomeRef.current && showSpeechBubble && !isOpen) {
          hasSpokenWelcomeRef.current = true;
          speakText("Assalamu Alaikum! Welcome to Style X. I am Xoro.");
        }
      }
    };

    // Listen to all potential user inputs and viewport updates to trigger voice greeting immediately on entering the homepage
    window.addEventListener('click', handleGesture);
    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);
    window.addEventListener('scroll', handleGesture);
    window.addEventListener('touchstart', handleGesture, { passive: true });
    window.addEventListener('mousemove', handleGesture, { passive: true });
    window.addEventListener('mouseenter', handleGesture);
    window.addEventListener('focus', handleGesture);

    // Also attempt to run directly on mount
    const onMountTimer = setTimeout(handleGesture, 100);

    return () => {
      clearTimeout(onMountTimer);
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('scroll', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('mousemove', handleGesture);
      window.removeEventListener('mouseenter', handleGesture);
      window.removeEventListener('focus', handleGesture);
    };
  }, [isSoundEnabled, showSpeechBubble, isOpen]);

  // Listen for new items added to the cart and speak with a gentle Alexa voice
  const prevCartLengthRef = useRef(cart.length);
  useEffect(() => {
    if (!isSoundEnabled) return;
    if (cart.length > prevCartLengthRef.current) {
      // Speak in English with a soft Alexa voice when something is added to the cart
      speakText("Wonderful choice! I have added that exquisite item to your selection.");
    }
    prevCartLengthRef.current = cart.length;
  }, [cart, isSoundEnabled]);



  // Animation triggers
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [isClimbing, setIsClimbing] = useState(false);
  const [isFlyingJet, setIsFlyingJet] = useState(false);
  const [showRope, setShowRope] = useState(false);

  // Trigger rope climb and jet engine sequence on idle
  const triggerClimbAndFlySequence = () => {
    if (isOpen || isClimbing || isFlyingJet) return;

    // Drop the rope
    setShowRope(true);
    setSpeechBubbleText("আইচ্ছা! আমি একটু রশি বেয়ে উপরে উটছি... 🧗");
    setShowSpeechBubble(true);
    playEmoRobotSound('think');
    
    // Start climbing
    setTimeout(() => {
      setIsClimbing(true);
      playClimbBeeps();

      // Finish climbing, ignite jet engine
      setTimeout(() => {
        setIsClimbing(false);
        setShowRope(false);
        setIsFlyingJet(true);
        setSpeechBubbleText("উড়ছি জেট ইঞ্জিন দিয়ে! 🚀 জুম্ম্ম্ম্ম্ম্ম্ম্ম!");
        playJetIgnitionSound();

        // Hover around for 6 seconds, then land back down
        setTimeout(() => {
          setIsFlyingJet(false);
          setSpeechBubbleText("হাফ! নিরাপদে ল্যান্ড করলাম। 😄");
          playEmoRobotSound('happy');
          
          // Hide bubble after 3 seconds
          setTimeout(() => {
            setShowSpeechBubble(false);
          }, 3000);
        }, 6000);

      }, 2500);
    }, 500);
  };

  const handleNavigateToSection = async (section: string, customSpeech?: string) => {
    // 1. Close chat window so user can see the website and Xoro flying
    setIsOpen(false);
    
    // 2. Start rocket engine flying!
    setIsFlyingJet(true);
    playJetIgnitionSound();
    
    // 3. Set custom bubble speech text and show it
    const defaultSpeechMap: Record<string, string> = {
      hero: "আসসালামু আলাইকুম! চলুন উড়ি! আমরা এখন স্টাইল এক্স-এর রাজকীয় হিরো সেকশনে প্রবেশ করছি! 🚀✨",
      countdown: "⏳ এই জোনে লিমিটেড টাইম রয়েল ফ্ল্যাশ ইভেন্ট চলছে! মিস করবেন না কিন্তু!",
      catalog: "👔 এটি আমাদের স্টাইল এক্স সিগনেচার কালেকশন! চমৎকার ডিজাইন এবং নিখুঁত কাপড়ের মেলবন্ধন!",
      lottery: "🎟️ স্বাগতম রয়েল লাক্সারি স্পিন লটারিতে! কুপন এবং বিশেষ অফার জিতে নিতে এখানে ক্লিক করুন!",
      cart: "🛒 এটি আপনার রাজকীয় শপিং কার্ট! এখানে আপনার নির্বাচিত পোশাকগুলো সুরক্ষিতভাবে চেকআউট করতে পারেন।",
      tracker: "📦 আপনার অর্ডারটি কোথায় আছে দেখতে চান? এখানে আপনার আইডি বা নম্বর দিয়ে লাইভ ট্র্যাক করুন!",
      reviews: "✍️ আমাদের বৈশ্বিক গ্রাহকদের ভেরিফাইড এক্সপেরিয়েন্স লেজার বুক দেখুন! আপনার মতামতও জানাতে পারেন।",
      admin: "👑 এটি রাজকীয় অ্যাডমিন কন্ট্রোল ডেস্ক! এখানে সিস্টেম সেটিংস এবং স্টোর আপডেট পরিচালিত হয়।"
    };

    const speechText = customSpeech || defaultSpeechMap[section] || "উড়ছি জেট ইঞ্জিন দিয়ে! 🚀 জুম্ম্ম্ম্ম্ম্ম্ম্ম!";
    setSpeechBubbleText(speechText);
    setShowSpeechBubble(true);

    // 4. Smoothly fly to the target
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Perform the actual navigation action in the website!
    switch (section) {
      case 'hero':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'countdown':
        const banner = document.getElementById('global-countdown-banner');
        if (banner) {
          banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }
        break;
      case 'catalog':
        if (onSetCategory) onSetCategory('ALL');
        const cat = document.getElementById('exclusive-series-catalog');
        if (cat) {
          cat.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 900, behavior: 'smooth' });
        }
        break;
      case 'lottery':
        if (onToggleLottery) onToggleLottery(true);
        break;
      case 'cart':
        if (onToggleCart) onToggleCart(true);
        break;
      case 'tracker':
        if (onSetTrackMode) onSetTrackMode(true);
        const trackerEl = document.getElementById('order-tracker-container');
        if (trackerEl) {
          trackerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 500, behavior: 'smooth' });
        }
        break;
      case 'reviews':
        const rev = document.getElementById('customer-experiences-reviews');
        if (rev) {
          rev.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 1800, behavior: 'smooth' });
        }
        break;
      case 'admin':
        if (onShowLoginModal) onShowLoginModal(true);
        break;
      default:
        break;
    }

    // 5. Land / stop flying after showing off
    setTimeout(() => {
      setIsFlyingJet(false);
      playEmoRobotSound('happy');
      
      // Hide speech bubble after 5 more seconds
      setTimeout(() => {
        setShowSpeechBubble(false);
      }, 5000);
    }, 4000);
  };

  const startAutomaticTour = async () => {
    setIsTouring(true);
    setIsOpen(false);
    
    const steps = [
      { section: 'hero', speech: "👋 আসসালামু আলাইকুম! আমি জোরো। চলুন, স্টাইল এক্স-এর পুরো ওয়েবসাইট ঘুরে দেখাই! আমাদের প্রথম স্টপ: রাজকীয় হিরো ব্যানার! 🌟" },
      { section: 'countdown', speech: "⏳ ২য় স্টপ: লিমিটেড টাইম ফ্ল্যাশ সেল ইভেন্ট! বিশেষ ছাড়ের সময় শেষ হবার আগে এখনই কিনে নিন!" },
      { section: 'catalog', speech: "👔 ৩য় স্টপ: এক্সক্লুসিভ ক্লোথিং কালেকশন! চমৎকার ডিজাইন এবং নিখাদ সুতার প্রিমিয়াম পোশাক!" },
      { section: 'lottery', speech: "🎟️ ৪র্থ স্টপ: রয়্যাল লাক্সারি স্পিন লটারিতে আপনার ভাগ্য পরীক্ষা করে নিন!" },
      { section: 'reviews', speech: "✍️ ৫মি স্টপ: ভেরিফাইড কাস্টমার লেজার! বৈশ্বিক গ্রাহকদের চমৎকার সব রিভিউ এবং ফিডব্যাক বুক!" },
      { section: 'cart', speech: "🛒 শেষ স্টপ: চেকআউট কার্ট! এখানে আপনার নির্বাচিত রাজকীয় পোশাক ও নিরাপদ পেমেন্ট সম্পন্ন করতে পারবেন।" }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Ignite rocket & set speech
      setIsFlyingJet(true);
      playJetIgnitionSound();
      setSpeechBubbleText(step.speech);
      setShowSpeechBubble(true);
      
      // Wait for flight thrill
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Trigger action
      switch (step.section) {
        case 'hero':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'countdown':
          const banner = document.getElementById('global-countdown-banner');
          if (banner) banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
          else window.scrollTo({ top: 400, behavior: 'smooth' });
          break;
        case 'catalog':
          if (onSetCategory) onSetCategory('ALL');
          const cat = document.getElementById('exclusive-series-catalog');
          if (cat) cat.scrollIntoView({ behavior: 'smooth', block: 'center' });
          else window.scrollTo({ top: 900, behavior: 'smooth' });
          break;
        case 'lottery':
          if (onToggleLottery) onToggleLottery(true);
          break;
        case 'reviews':
          if (onToggleLottery) onToggleLottery(false); // Close previous
          const rev = document.getElementById('customer-experiences-reviews');
          if (rev) rev.scrollIntoView({ behavior: 'smooth', block: 'center' });
          else window.scrollTo({ top: 1800, behavior: 'smooth' });
          break;
        case 'cart':
          if (onToggleCart) onToggleCart(true);
          break;
        default:
          break;
      }
      
      // Hover at destination
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Close open modals/drawers for transition
      if (step.section === 'cart' && onToggleCart) {
        onToggleCart(false);
      }
    }

    // Done!
    setIsFlyingJet(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSpeechBubbleText("🎉 ওয়াও! স্টাইল এক্স-এর পুরো সফর সম্পন্ন হলো! আপনার কেনাকাটা দারুণ উপভোগ্য হোক। 😄");
    playEmoRobotSound('happy');
    setIsTouring(false);
    
    setTimeout(() => {
      setShowSpeechBubble(false);
    }, 4000);
  };

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const startIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (isOpen || isClimbing || isFlyingJet) return;
      
      idleTimer = setTimeout(() => {
        triggerClimbAndFlySequence();
      }, 3000); // 3 seconds idle threshold
    };

    const handleUserActivity = () => {
      if (!isClimbing && !isFlyingJet) {
        startIdleTimer();
      }
    };

    // User activity listeners
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Initial trigger
    startIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [isOpen, isClimbing, isFlyingJet]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Monitor Scrolling to Auto-Hide Speech Bubble if needed
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsScrolled(true);
        if (!hasDismissedBubble) {
          setShowSpeechBubble(false);
        }
      } else {
        setIsScrolled(false);
        if (!hasDismissedBubble && !isOpen) {
          setShowSpeechBubble(true);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasDismissedBubble, isOpen]);

  // 2. Initial Greetings & Smart Page Behaviors
  useEffect(() => {
    // Wave and show speech bubble immediately on entering the website
    if (!hasDismissedBubble && !isOpen) {
      setIsWaving(true);
      setShowSpeechBubble(true);
      // Reset wave after 2.5s
      const waveTimer = setTimeout(() => setIsWaving(false), 2500);

      // Attempt to speak the greeting right away (supported by some browsers/configurations directly on load)
      if (isSoundEnabled) {
        const speakTimer = setTimeout(() => {
          if (!hasSpokenWelcomeRef.current) {
            hasSpokenWelcomeRef.current = true;
            speakText("Assalamu Alaikum! Welcome to Style X. I am Xoro.");
          }
        }, 300);
        return () => {
          clearTimeout(waveTimer);
          clearTimeout(speakTimer);
        };
      }

      return () => clearTimeout(waveTimer);
    }
  }, []);

  // Update speech bubble based on current website page / interactions
  useEffect(() => {
    if (hasDismissedBubble || isOpen) return;

    if (confirmedOrderId) {
      setSpeechBubbleText("🎉 আসসালামু আলাইকুম! স্টাইল এক্স থেকে কেনাকাটার জন্য ধন্যবাদ! আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।");
      setShowSpeechBubble(true);
      setIsCelebrating(true);
    } else if (isCartOpen) {
      setSpeechBubbleText("🛒 আসসালামু আলাইকুম! আপনার পছন্দের পণ্যগুলো কার্টে আছে। অর্ডার সম্পন্ন করতে প্রস্তুত কি?");
      setShowSpeechBubble(true);
    } else if (currentProduct) {
      setSpeechBubbleText(`✨ আসসালামু আলাইকুম! "${currentProduct.title}" আমাদের গ্রাহকদের অন্যতম প্রিয় পোশাক!`);
      setShowSpeechBubble(true);
    } else if (cart.length > 0) {
      setSpeechBubbleText("🛒 আসসালামু আলাইকুম! আপনার কার্টে চমৎকার কিছু পোশাক অপেক্ষা করছে!");
      setShowSpeechBubble(true);
    }
  }, [currentProduct, cart, isCartOpen, confirmedOrderId]);

  // Celebratory reset
  useEffect(() => {
    if (isCelebrating) {
      const timer = setTimeout(() => setIsCelebrating(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isCelebrating]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Send message to Backend Express endpoint
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Create context payload
      const historyPayload = messages.slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch('/api/xoro/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          cart,
          currentPage: currentProduct ? 'product' : isCartOpen ? 'cart' : isTrackMode ? 'track' : 'home',
          currentProduct: currentProduct || undefined
        })
      });

      if (!response.ok) {
        throw new Error("Concurrence with style servers lost.");
      }

      const data = await response.json();
      
      const modelMsg: Message = {
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // If backend detected matched orders, let's embed them in message meta
      if (data.matchedOrders && data.matchedOrders.length > 0) {
        modelMsg.type = 'fit';
        modelMsg.meta = { order: data.matchedOrders[0] };
      }

      setMessages(prev => [...prev, modelMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "🔌 *Xoro digital connection interrupted.* Please verify your network. In the meantime, I am always ready to assist you via WhatsApp!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Quick Action triggers
  const triggerQuickAction = (action: string) => {
    let textPrompt = '';
    switch (action) {
      case 'recommend':
        textPrompt = "Recommend some trending products for me!";
        break;
      case 'coupons':
        textPrompt = "What active coupon codes do you have right now?";
        break;
      case 'fit':
        textPrompt = "How do I choose the correct size?";
        break;
      case 'track':
        textPrompt = "I want to track my order.";
        break;
      case 'tips':
        textPrompt = "Can you give me some exclusive fashion tips?";
        break;
      default:
        return;
    }
    handleSendMessage(textPrompt);
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isHidden = !!currentProduct || isCartOpen;

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div 
          id="xoro-floating-assistant" 
          initial={{ opacity: 0, scale: 0, x: -30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0, x: -30 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0.05}
          className="fixed left-6 top-[40%] z-50 flex flex-col items-start select-none touch-none"
        >
        
        {/* SPEECH BUBBLE OUTLET */}
        <AnimatePresence>
          {showSpeechBubble && !isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: 'spring', damping: 15 }}
              className="mb-3 max-w-[240px] bg-zinc-950 border-2 border-luxury-gold/50 shadow-[0_10px_30px_rgba(212,175,55,0.25)] rounded-2xl p-3.5 text-left relative"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeechBubble(false);
                  setHasDismissedBubble(true);
                }}
                className="absolute top-1.5 right-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
              <p className="text-[11px] leading-relaxed text-zinc-100 font-sans pr-3">
                {speechBubbleText}
              </p>
              {/* Little arrow pointing at button */}
              <div className="absolute bottom-[-6px] left-6 w-3 h-3 bg-zinc-950 border-r border-b border-luxury-gold/50 rotate-45"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GOLDEN ROPE FOR CLIMBING */}
        <AnimatePresence>
          {showRope && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 240, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute bottom-16 left-8 -translate-x-1/2 w-[6px] z-[-1] origin-bottom select-none pointer-events-none"
            >
              {/* Outer bright golden fuzzy glow */}
              <div className="absolute inset-0 bg-yellow-400 blur-[4px] opacity-60 rounded-full animate-pulse"></div>
              {/* Main braided rope texture */}
              <div 
                className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(212,175,55,1),rgba(212,175,55,1)_3px,rgba(163,117,14,1)_3px,rgba(163,117,14,1)_6px)] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)] border border-yellow-300/30"
              />
              {/* Ultra-glowing core thread */}
              <div className="absolute top-0 bottom-0 left-[2px] right-[2px] bg-gradient-to-b from-white/90 via-yellow-300/40 to-transparent rounded-full mix-blend-overlay"></div>
              
              {/* Decorative golden tassel/knot at the bottom end of the rope */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] rounded-full shadow-[0_4px_10px_rgba(212,175,55,0.9)] border border-yellow-200">
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2 h-2.5 bg-[#aa7c11] rounded-b-full animate-bounce"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FLOATING MASCOT BUTTON */}
        <motion.button
          onClick={() => {
            const nextOpen = !isOpen;
            setIsOpen(nextOpen);
            setShowSpeechBubble(false);
            if (nextOpen && isSoundEnabled) {
              speakText("Assalamu Alaikum! Welcome to Style X. I am Xoro.");
            }
          }}
          onPointerDown={(e) => {
            dragControls.start(e);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={
            isClimbing 
              ? { 
                  y: [-120], 
                  rotate: [0, -6, 6, -6, 6, -6, 0] 
                }
              : isFlyingJet 
              ? {
                  y: [-150, -170, -140, -160, -150],
                  x: [0, 8, -8, 4, -4, 0],
                  rotate: [0, 5, -5, 3, -3, 0]
                }
              : isCelebrating 
              ? { y: [0, -12, 0, -12, 0], rotate: [0, -5, 5, -5, 0] }
              : isWaving 
              ? { rotate: [0, -10, 10, -10, 10, 0] }
              : { y: [0, -4, 0] }
          }
          transition={
            isClimbing 
              ? { duration: 2.5, ease: "easeInOut" }
              : isFlyingJet 
              ? { 
                  y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                  x: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                  rotate: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
                }
              : isCelebrating 
              ? { duration: 1.2, ease: "easeInOut" }
              : isWaving 
              ? { duration: 1.8, ease: "easeInOut" }
              : { repeat: Infinity, duration: 4, ease: "easeInOut" }
          }
          className={`relative h-14 w-14 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-visible transition-all duration-300 rounded-full text-luxury-gold p-1 ${
            isFlyingJet 
              ? 'bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border-2 border-luxury-gold shadow-[0_0_35px_rgba(212,175,55,0.85)]' 
              : 'bg-gradient-to-b from-zinc-950 via-zinc-900 to-black border-2 border-luxury-gold/50 shadow-[0_4px_24px_rgba(212,175,55,0.4)]'
          } hover:shadow-[0_4px_32px_rgba(212,175,55,0.6)] hover:border-luxury-gold`}
        >
          {/* ROCKET BODY EXTRAS */}
          {isFlyingJet && (
            <>
              {/* Nose Cone */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.2, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-8 bg-gradient-to-b from-luxury-gold via-yellow-600 to-zinc-950 border border-luxury-gold/60 z-20 shadow-[0_0_15px_rgba(212,175,55,0.5)] pointer-events-none"
                style={{ borderRadius: '60% 60% 0 0' }}
              >
                {/* Nose Cone Red Beacon Light */}
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse pointer-events-none" />
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-400 rounded-full animate-ping pointer-events-none" />
              </motion.div>

              {/* Left Wing / Delta Fin */}
              <motion.div 
                initial={{ opacity: 0, x: 10, rotate: -40 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                className="absolute -left-3.5 bottom-1.5 w-4 h-8 bg-gradient-to-br from-luxury-gold via-yellow-700 to-zinc-950 border border-luxury-gold/50 rounded-tl-[100%] rounded-bl-[20%] origin-bottom-right z-10 pointer-events-none"
              />

              {/* Right Wing / Delta Fin */}
              <motion.div 
                initial={{ opacity: 0, x: -10, rotate: 40 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                className="absolute -right-3.5 bottom-1.5 w-4 h-8 bg-gradient-to-bl from-luxury-gold via-yellow-700 to-zinc-950 border border-luxury-gold/50 rounded-tr-[100%] rounded-br-[20%] origin-bottom-left z-10 pointer-events-none"
              />

              {/* Cockpit glass panel reflection overlay */}
              <div className="absolute inset-0 rounded-full border-2 border-luxury-gold bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-30" />
            </>
          )}

          {/* Glowing Aura backdrop */}
          <span className="absolute inset-0 rounded-full border border-luxury-gold/25 animate-ping opacity-30 animate-pulse pointer-events-none"></span>
          
          <img 
            src={avatarUrl} 
            alt="Xoro" 
            className="h-full w-full rounded-full object-cover select-none pointer-events-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] z-20" 
            referrerPolicy="no-referrer"
          />

          {/* JET ENGINE EXHAUST FLAME */}
          <AnimatePresence>
            {isFlyingJet && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.4, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.4, y: -8 }}
                className="absolute bottom-[-55px] left-1/2 -translate-x-1/2 flex flex-col items-center z-[-2] pointer-events-none w-20 overflow-visible"
              >
                {/* Sleek metallic thruster nozzle */}
                <div className="w-5 h-3 bg-gradient-to-b from-zinc-800 via-zinc-950 to-zinc-900 border border-zinc-700/40 rounded-b-md shadow-lg flex items-center justify-center relative overflow-hidden z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                  {/* Glowing hot inside rim */}
                  <div className="absolute bottom-0 w-3 h-[2px] bg-gradient-to-r from-orange-500 via-yellow-300 to-orange-500 blur-[0.5px]"></div>
                </div>

                {/* Triple-layer super realistic plasma exhaust */}
                <div className="relative flex flex-col items-center mt-[-1px] w-full h-[60px] overflow-visible">
                  
                  {/* Layer 1: Outer thermal gas envelope (Flickering orange-purple aura) */}
                  <motion.div 
                    animate={{ 
                      height: [45, 65, 45],
                      width: [24, 30, 24],
                      opacity: [0.55, 0.85, 0.55],
                      filter: ["blur(4px)", "blur(6px)", "blur(4px)"]
                    }}
                    transition={{ repeat: Infinity, duration: 0.18, ease: "easeInOut" }}
                    className="absolute top-0 bg-gradient-to-b from-orange-500/80 via-red-500/40 to-transparent rounded-b-full w-6 z-0"
                  />

                  {/* Layer 2: Main golden-yellow thruster plume (Medium heat) */}
                  <motion.div 
                    animate={{ 
                      height: [35, 50, 35],
                      width: [14, 18, 14],
                      filter: ["blur(1px)", "blur(2px)", "blur(1px)"]
                    }}
                    transition={{ repeat: Infinity, duration: 0.12, ease: "linear" }}
                    className="absolute top-0 bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-600 rounded-b-full w-4 z-10 shadow-[0_0_20px_rgba(251,191,36,0.8)]"
                  />

                  {/* Layer 3: Shock diamonds & Core heat column (Blazing white-blue core) */}
                  <motion.div 
                    animate={{ 
                      height: [20, 32, 20],
                      scaleX: [0.85, 1.1, 0.85]
                    }}
                    transition={{ repeat: Infinity, duration: 0.08, ease: "linear" }}
                    className="absolute top-0 bg-gradient-to-b from-white via-cyan-200/90 to-transparent rounded-b-full w-2.5 z-20 shadow-[0_0_12px_#fff,0_0_25px_rgba(56,189,248,0.9)]"
                  >
                    {/* Shock diamond nodes inside the core */}
                    <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rotate-45 rounded-[1px] shadow-[0_0_8px_#fff]"></div>
                    <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-300 rotate-45 rounded-[1px]"></div>
                  </motion.div>

                  {/* Downward drifting heat distortion & sparks */}
                  <div className="absolute top-[35px] flex flex-col gap-2.5 items-center">
                    <motion.div 
                      animate={{ 
                        y: [0, 25], 
                        opacity: [1, 0], 
                        scale: [1, 0.3] 
                      }}
                      transition={{ repeat: Infinity, duration: 0.25, ease: "easeOut" }}
                      className="w-1.5 h-1.5 bg-yellow-400 rounded-full blur-[0.5px]"
                    />
                    <motion.div 
                      animate={{ 
                        y: [0, 30], 
                        opacity: [0.8, 0], 
                        scale: [0.8, 0.2] 
                      }}
                      transition={{ repeat: Infinity, duration: 0.35, ease: "easeOut", delay: 0.1 }}
                      className="w-1 h-1 bg-orange-400 rounded-full blur-[0.5px]"
                    />
                  </div>

                  {/* Ring-like energy thrust waves */}
                  <motion.div 
                    animate={{ 
                      scale: [0.6, 2.2],
                      opacity: [0.7, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 0.4, ease: "easeOut" }}
                    className="absolute top-[12px] w-7 h-[2px] bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent border-t border-yellow-300/40 rounded-full blur-[0.5px] z-30"
                  />
                  <motion.div 
                    animate={{ 
                      scale: [0.6, 2.2],
                      opacity: [0.7, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 0.4, ease: "easeOut", delay: 0.2 }}
                    className="absolute top-[24px] w-5 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent border-t border-cyan-300/40 rounded-full blur-[0.5px] z-30"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* 2. CHAT DRAWER PANEL */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20 }}
              className="absolute bottom-20 left-0 w-[290px] sm:w-[310px] h-[410px] bg-zinc-950 border border-luxury-gold/35 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95),0_10px_25px_rgba(212,175,55,0.2)] overflow-hidden flex flex-col z-50"
            >
              {/* DRAWER HEADER */}
              <div className="p-3 bg-gradient-to-r from-luxury-black via-[#0d0d0d] to-luxury-black border-b border-white/5 flex items-center justify-between relative">
                {/* Visual Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-luxury-gold/5 to-transparent pointer-events-none"></div>

                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 rounded-full bg-zinc-950/40 border border-luxury-gold/20 flex items-center justify-center p-1 overflow-hidden">
                    <img 
                      src={avatarUrl} 
                      alt="Xoro" 
                      className="h-full w-full object-contain scale-110" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-black animate-pulse"></span>
                  </div>
                  <div>
                    <h4 className="font-display font-black text-[10px] uppercase tracking-widest text-luxury-gold flex items-center gap-1">
                      <span>Xoro Assistant</span>
                      <Sparkles size={9} className="text-luxury-gold animate-pulse" />
                    </h4>
                    <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider">Style X Ambassador</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Drone hum power indicator/switch */}
                  <button 
                    onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center relative ${
                      isSoundEnabled 
                        ? 'text-luxury-gold bg-luxury-gold/10 border border-luxury-gold/20' 
                        : 'text-zinc-500 bg-white/5 border border-white/5 hover:text-zinc-300'
                    }`}
                    title={isSoundEnabled ? "Mute futuristic hum" : "Activate engine hum"}
                  >
                    {isSoundEnabled ? <Volume2 size={12} className="animate-pulse" /> : <VolumeX size={12} />}
                    {isSoundEnabled && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luxury-gold opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-luxury-gold"></span>
                      </span>
                    )}
                  </button>
                  <span className="text-[7px] bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold font-mono px-1 py-0.5 rounded uppercase tracking-widest">AI</span>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* TAB SELECTOR */}
              <div className="flex border-b border-white/5 bg-[#070707] shrink-0">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2 text-[9px] font-mono font-bold uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                    activeTab === 'chat' 
                      ? 'border-luxury-gold text-luxury-gold bg-zinc-950/40' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Bot size={11} className={activeTab === 'chat' ? 'text-luxury-gold' : 'text-zinc-500'} />
                  <span>💬 Chat Concierge</span>
                </button>
                <button 
                  onClick={() => setActiveTab('explore')}
                  className={`flex-1 py-2 text-[9px] font-mono font-bold uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                    activeTab === 'explore' 
                      ? 'border-luxury-gold text-luxury-gold bg-zinc-950/40' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Compass size={11} className={`${activeTab === 'explore' ? 'text-luxury-gold animate-spin' : 'text-zinc-500'}`} style={{ animationDuration: '6s' }} />
                  <span>🌐 Travel Map</span>
                </button>
              </div>

              {activeTab === 'chat' ? (
                <>
                  {/* MESSAGES BODY */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                
                {/* Brand introduction banner card */}
                <div className="p-2.5 bg-gradient-to-br from-[#121212] to-black border border-white/5 rounded-xl flex flex-col items-center text-center space-y-1">
                  <span className="text-lg">🤖</span>
                  <p className="text-[8px] font-mono uppercase tracking-widest text-luxury-gold font-bold">Virtual Fashion Concierge</p>
                  <p className="text-[10px] text-zinc-400 leading-normal font-sans max-w-[210px]">
                    Hello, I am Xoro! Let's find your ultimate ensemble.
                  </p>
                </div>

                {/* Messages map */}
                {messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <div 
                      key={idx} 
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2.5`}
                    >
                      {!isUser && (
                        <div className="h-7 w-7 rounded-full bg-zinc-950/40 border border-luxury-gold/20 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                          <img 
                            src={avatarUrl} 
                            alt="Xoro" 
                            className="h-full w-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-col max-w-[78%]">
                        <div 
                          className={`rounded-2xl px-3.5 py-2.5 text-xs font-sans leading-relaxed text-left whitespace-pre-line ${
                            isUser 
                              ? 'bg-luxury-gold text-luxury-black font-semibold rounded-tr-none' 
                              : 'bg-zinc-900/80 border border-white/5 text-zinc-100 rounded-tl-none'
                          }`}
                        >
                          {m.text}

                          {/* Render helper panels based on message type/text hooks */}
                          {/* 1. COUPON SUGGESTIONS */}
                          {!isUser && (m.text.includes("Code:") || m.text.includes("coupon") || m.type === 'coupons') && coupons.length > 0 && (
                            <div className="mt-3.5 space-y-2 border-t border-white/5 pt-3">
                              <p className="text-[9px] font-mono uppercase text-luxury-gold tracking-widest font-bold">Active Promo Codes:</p>
                              {coupons.map((c, cIdx) => (
                                <div key={cIdx} className="flex items-center justify-between p-2 bg-black border border-white/5 rounded-xl">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-mono font-bold text-white tracking-wider flex items-center gap-1">
                                      <Ticket size={10} className="text-luxury-gold" />
                                      <span>{c.code}</span>
                                    </p>
                                    <p className="text-[8px] text-zinc-400 font-mono">Save {c.value}{c.type === 'PERCENTAGE' ? '%' : '৳'} on elite apparel</p>
                                  </div>
                                  <button 
                                    onClick={() => copyCoupon(c.code)}
                                    className="px-2 py-1 bg-luxury-gold/10 border border-luxury-gold/30 hover:bg-luxury-gold hover:text-black rounded text-[8px] font-bold uppercase tracking-wider transition-all"
                                  >
                                    {copiedCode === c.code ? <Check size={10} /> : <Copy size={10} />}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 2. ORDER SPECIFIC EMBED */}
                          {!isUser && m.meta?.order && (
                            <div className="mt-3 p-3 bg-black border border-luxury-gold/30 rounded-xl space-y-1.5 text-left">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-mono text-luxury-gold font-bold uppercase">Order Dispatch #{m.meta.order.id}</span>
                                <span className="text-[8px] bg-luxury-gold/10 text-luxury-gold px-1.5 py-0.5 rounded uppercase font-mono">{m.meta.order.status || 'Delivering'}</span>
                              </div>
                              <p className="text-[10px] text-white">Client: {m.meta.order.customerName}</p>
                              <p className="text-[10px] text-zinc-400">Total: ৳{m.meta.order.totalAmount} ({m.meta.order.paymentMethod || 'COD'})</p>
                              <button 
                                onClick={() => {
                                  onTrackOrder(m.meta.order.id);
                                  setIsOpen(false);
                                }}
                                className="w-full text-center py-1.5 bg-luxury-gold text-luxury-black text-[9px] font-mono font-bold uppercase rounded hover:brightness-110 active:scale-95 transition-all mt-1"
                              >
                                View full VIP tracking details
                              </button>
                            </div>
                          )}

                          {/* 3. PRODUCT RECOMMENDATIONS LIST */}
                          {!isUser && (m.text.includes("trending") || m.text.includes("product") || m.text.includes("XP-")) && (
                            <div className="mt-3.5 space-y-2 border-t border-white/5 pt-3">
                              <p className="text-[9px] font-mono uppercase text-luxury-gold tracking-widest font-bold">Suggested Style Acquisitions:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {products.slice(0, 2).map((p, pIdx) => (
                                  <div 
                                    key={pIdx} 
                                    onClick={() => {
                                      onSelectProduct(p);
                                      setIsOpen(false);
                                    }}
                                    className="bg-black/40 border border-white/5 hover:border-luxury-gold/30 rounded-xl p-1.5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col group relative"
                                  >
                                    <div className="aspect-square rounded-lg overflow-hidden bg-zinc-950 relative">
                                      <img 
                                        src={p.imageUrl} 
                                        alt={p.title} 
                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="absolute top-1 left-1 text-[7px] bg-black/80 text-luxury-gold px-1 rounded font-mono uppercase tracking-widest">
                                        {p.code}
                                      </span>
                                    </div>
                                    <p className="text-[9px] font-bold text-white truncate mt-1 leading-tight">{p.title}</p>
                                    <p className="text-[8px] text-luxury-gold font-mono font-black mt-0.5">৳{p.offerPrice || p.price}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <span className={`text-[8px] font-mono text-zinc-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Typing status */}
                {isTyping && (
                  <div className="flex justify-start items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-zinc-950/40 border border-luxury-gold/20 flex items-center justify-center p-0.5 overflow-hidden">
                      <img 
                        src={avatarUrl} 
                        alt="Xoro typing" 
                        className="h-full w-full object-contain animate-pulse" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="bg-zinc-900 border border-white/5 text-zinc-400 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs flex items-center gap-1.5 font-mono">
                      <span>Xoro is analyzing</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* QUICK SUGGESTIONS CAROUSEL */}
              <div className="p-2 border-t border-white/5 bg-zinc-950/80 overflow-x-auto flex gap-1.5 scrollbar-none whitespace-nowrap">
                <button 
                  onClick={() => triggerQuickAction('recommend')}
                  className="px-3 py-1.5 bg-[#121212] hover:bg-white/[0.04] border border-white/5 hover:border-luxury-gold/40 text-[9px] font-mono font-bold uppercase tracking-wider text-luxury-gold rounded-full transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                >
                  <Compass size={10} />
                  <span>🛍️ Recommendations</span>
                </button>
                <button 
                  onClick={() => triggerQuickAction('coupons')}
                  className="px-3 py-1.5 bg-[#121212] hover:bg-white/[0.04] border border-white/5 hover:border-luxury-gold/40 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-100 rounded-full transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                >
                  <Ticket size={10} className="text-luxury-gold" />
                  <span>🔑 Coupons</span>
                </button>
                <button 
                  onClick={() => triggerQuickAction('fit')}
                  className="px-3 py-1.5 bg-[#121212] hover:bg-white/[0.04] border border-white/5 hover:border-luxury-gold/40 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-100 rounded-full transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                >
                  <Shirt size={10} className="text-luxury-gold" />
                  <span>📏 Size Guide</span>
                </button>
                <button 
                  onClick={() => triggerQuickAction('track')}
                  className="px-3 py-1.5 bg-[#121212] hover:bg-white/[0.04] border border-white/5 hover:border-luxury-gold/40 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-100 rounded-full transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                >
                  <Package size={10} className="text-luxury-gold" />
                  <span>📦 Track Order</span>
                </button>
                <button 
                  onClick={() => triggerQuickAction('tips')}
                  className="px-3 py-1.5 bg-[#121212] hover:bg-white/[0.04] border border-white/5 hover:border-luxury-gold/40 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-100 rounded-full transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                >
                  <Sparkles size={10} className="text-luxury-gold" />
                  <span>💡 Fashion Tips</span>
                </button>
              </div>

              {/* INPUT BAR */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="p-3 bg-black border-t border-white/5 flex gap-2"
              >
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Xoro styling tips, track order..."
                  className="flex-1 bg-[#121212] border border-white/10 hover:border-white/20 focus:border-luxury-gold focus:outline-none rounded-2xl text-xs px-3.5 py-2.5 font-sans text-white transition-all"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="h-9 w-9 bg-luxury-gold hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 text-luxury-black rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 outline-none"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            /* EXPLORE MAP BODY */
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col bg-zinc-950/90 text-left">
              {/* Tour banner */}
              <div className="p-3 bg-gradient-to-r from-luxury-black via-[#0d0a14] to-luxury-black border border-luxury-gold/40 rounded-xl flex flex-col items-center text-center space-y-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-luxury-gold/5 rounded-full blur-xl animate-pulse pointer-events-none"></div>
                <div className="w-8 h-8 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center text-luxury-gold">
                  <Compass size={16} className={isTouring ? "animate-spin" : "animate-pulse"} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-luxury-gold font-bold">অটো ওয়েবসাইট সফর</p>
                  <p className="text-[9px] text-zinc-400 font-sans">জোরো আপনাকে নিজ দায়িত্বে পুরো ওয়েবসাইট ঘুরিয়ে দেখাবে</p>
                </div>
                
                <button
                  onClick={startAutomaticTour}
                  disabled={isTouring}
                  className="w-full py-1.5 bg-luxury-gold hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 text-luxury-black font-mono font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(212,175,55,0.2)] cursor-pointer"
                >
                  <span>{isTouring ? "সফর চলছে..." : "ট্যুর শুরু করুন 🚀"}</span>
                </button>
              </div>

              {/* Manual Navigation Pins */}
              <div className="space-y-2">
                <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 font-bold border-b border-white/5 pb-1 flex items-center gap-1">
                  <MapPin size={9} className="text-luxury-gold" />
                  <span>ম্যানুয়াল লোকেশন নেভিগেশন (জোরো স্পেস)</span>
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'hero', name: '🏠 হোম ব্যানার', desc: 'ওয়েবসাইটের প্রারম্ভে ফিরুন' },
                    { id: 'countdown', name: '⏳ ফ্ল্যাশ সেল', desc: 'কাউন্টডাউন এবং অফার' },
                    { id: 'catalog', name: '👕 প্রোডাক্ট ক্যাটালগ', desc: 'এক্সক্লুসিভ ক্লোথিং সিরিজ' },
                    { id: 'lottery', name: '🎟️ রয়্যাল লটারি', desc: 'লাকি স্পিন হুইল' },
                    { id: 'cart', name: '🛒 শপিং কার্ট', desc: 'আপনার ক্রিত পণ্য তালিকা' },
                    { id: 'tracker', name: '📦 অর্ডার ট্র্যাকার', desc: 'অর্ডারের লাইভ আপডেট' },
                    { id: 'reviews', name: '✍️ ভেরিফাইড রিভিউ', desc: 'গ্রাহকদের মতামত খাতা' },
                    { id: 'admin', name: '👑 অ্যাডমিন ডেস্ক', desc: 'স্টোর এডমিনিস্ট্রেশন' }
                  ].map((poi) => (
                    <button
                      key={poi.id}
                      onClick={() => handleNavigateToSection(poi.id)}
                      className="p-2.5 bg-[#0e0e0e] hover:bg-zinc-900 border border-white/5 hover:border-luxury-gold/30 rounded-xl text-left transition-all duration-200 flex flex-col justify-between h-16 group active:scale-95 cursor-pointer outline-none"
                    >
                      <span className="text-[10px] font-semibold text-white group-hover:text-luxury-gold transition-colors block">
                        {poi.name}
                      </span>
                      <span className="text-[8px] text-zinc-500 block leading-tight font-light truncate w-full">
                        {poi.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-2.5 bg-[#0d0d0d] border border-white/5 rounded-xl text-center">
                <p className="text-[8.5px] text-zinc-500 font-mono italic leading-normal">
                  পিনের ওপর ক্লিক করলে জোরো তার রকেট থ্রাস্টার জ্বালিয়ে আপনাকে ওই সেকশনে নিয়ে যাবে! 🚀
                </p>
              </div>
            </div>
          )}
        </motion.div>
          )}
        </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
