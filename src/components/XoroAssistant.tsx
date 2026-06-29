import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  Sparkles, X, Send, Bot, Copy, Check, Ticket, 
  MapPin, HelpCircle, Shirt, Package, Compass, ShoppingBag,
  Volume2, VolumeX
} from 'lucide-react';
import { Product, CartItem, Coupon } from '../types';

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



const XORO_AVATAR = "/src/assets/images/xoro_mascot_3d_1782635214676.jpg";

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
  onTrackOrder
}: XoroAssistantProps) {
  const dragControls = useDragControls();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(XORO_AVATAR);

  useEffect(() => {
    makeAvatarBackgroundTransparent(XORO_AVATAR).then((transparentUrl) => {
      setAvatarUrl(transparentUrl);
    });
  }, []);

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

  // Helper to read aloud text using Web Speech API (Text-to-Speech)
  // plays a cute EMO-style robotic sound and then speaks the text using SpeechSynthesis.
  // Tuned to be extremely soft, calm, beautiful, and soothing.
  const speakText = (text: string) => {
    if (!isSoundEnabled) return;
    try {
      // 1. Play the cute robotic chirp/beep sound effect like EMO GO HOME first
      const isShort = text.length < 50;
      playEmoRobotSound(isShort ? 'greet' : 'happy');

      // 2. Speak the actual text using the Web Speech API
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        // Cancel any pending speech first
        window.speechSynthesis.cancel();

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
        
        // Smooth, elegant, and professional Alexa-style premium voice profile
        utterance.rate = 0.95; // Perfectly polished, natural human-like pacing (just like Alexa)
        utterance.pitch = 1.0; // Warm, natural, balanced mid-frequency human voice (instead of high squeaky robot)
        utterance.volume = 1.0;

        // Use high-quality female or cute sweet English voices
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        // Prioritize soft, lovely, sweet female English voices resembling Alexa
        const softVoiceKeys = ['zira', 'sara', 'samantha', 'aria', 'jenny', 'sonia', 'natural', 'female', 'google us english', 'microsoft'];
        for (const key of softVoiceKeys) {
          selectedVoice = voices.find(v => {
            const lang = v.lang.toLowerCase();
            const name = v.name.toLowerCase();
            return lang.startsWith('en') && name.includes(key);
          });
          if (selectedVoice) break;
        }

        if (!selectedVoice) {
          // Fallback: Any female English voice or any English voice
          selectedVoice = voices.find(v => {
            const lang = v.lang.toLowerCase();
            const name = v.name.toLowerCase();
            return lang.startsWith('en') && (name.includes('female') || name.includes('girl'));
          }) || voices.find(v => v.lang.toLowerCase().startsWith('en'));
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        }

        // Retain reference to prevent garbage collection mid-speech (major Chrome bug fix)
        currentUtteranceRef.current = utterance;
        utterance.onend = () => {
          currentUtteranceRef.current = null;
        };
        utterance.onerror = (e) => {
          console.warn("SpeechSynthesisUtterance error:", e);
          currentUtteranceRef.current = null;
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

  return (
    <>
      {/* 1. FLOATING ASSISTANT WRAPPER IN THE LEFT CENTER (DRAGGABLE) */}
      <motion.div 
        id="xoro-floating-assistant" 
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
            isCelebrating 
              ? { y: [0, -12, 0, -12, 0], rotate: [0, -5, 5, -5, 0] }
              : isWaving 
              ? { rotate: [0, -10, 10, -10, 10, 0] }
              : { y: [0, -4, 0] }
          }
          transition={
            isCelebrating 
              ? { duration: 1.2, ease: "easeInOut" }
              : isWaving 
              ? { duration: 1.8, ease: "easeInOut" }
              : { repeat: Infinity, duration: 4, ease: "easeInOut" }
          }
          className={`relative h-16 w-16 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-visible transition-all duration-300 bg-transparent border-none shadow-none text-luxury-gold`}
        >
          {/* Glowing Aura backdrop */}
          <span className="absolute inset-4 rounded-full border border-luxury-gold/15 animate-ping opacity-30 animate-pulse"></span>
          
          <img 
            src={avatarUrl} 
            alt="Xoro" 
            className="h-full w-full object-contain select-none pointer-events-none filter drop-shadow-[0_8px_16px_rgba(212,175,55,0.45)]" 
            referrerPolicy="no-referrer"
          />
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
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </>
  );
}
