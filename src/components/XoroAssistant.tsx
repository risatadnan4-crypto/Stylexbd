import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  Sparkles, X, Send, Bot, Copy, Check, Ticket, 
  MapPin, HelpCircle, Shirt, Package, Compass, ShoppingBag,
  Volume2, VolumeX
} from 'lucide-react';
import { Product, CartItem, Coupon } from '../types';
import { getProductActivePrice } from '../utils/totalHelper';

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
      
      const visited = new Uint8Array(width * height);
      
      const isMaybeBackgroundPixel = (x: number, y: number): boolean => {
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
        
        const isNearBg = distToBg < 35;
        const isNearWhite = distToWhite < 35;
        const isBrightNeutral = r > 220 && g > 220 && b > 220 && chroma < 15;
        
        return isNearBg || isNearWhite || isBrightNeutral;
      };
      
      const queue: number[] = [];
      
      for (let x = 0; x < width; x++) {
        if (isMaybeBackgroundPixel(x, 0)) {
          const offset = x;
          visited[offset] = 1;
          queue.push(offset);
        }
        if ((x < width * 0.25 || x > width * 0.75) && isMaybeBackgroundPixel(x, height - 1)) {
          const offset = (height - 1) * width + x;
          visited[offset] = 1;
          queue.push(offset);
        }
      }
      for (let y = 1; y < height - 1; y++) {
        if (isMaybeBackgroundPixel(0, y)) {
          const offset = y * width;
          visited[offset] = 1;
          queue.push(offset);
        }
        if (isMaybeBackgroundPixel(width - 1, y)) {
          const offset = y * width + (width - 1);
          visited[offset] = 1;
          queue.push(offset);
        }
      }
      
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
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = y * width + x;
          const idx = offset * 4;
          
          if (visited[offset] === 1) {
            let isBoundary = false;
            if (x > 0 && visited[offset - 1] === 0) isBoundary = true;
            else if (x < width - 1 && visited[offset + 1] === 0) isBoundary = true;
            else if (y > 0 && visited[offset - width] === 0) isBoundary = true;
            else if (y < height - 1 && visited[offset + width] === 0) isBoundary = true;
            
            if (isBoundary) {
              data[idx + 3] = 95;
            } else {
              data[idx + 3] = 0;
            }
          } else {
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
  const isDraggingRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'explore'>('chat');
  const [isTouring, setIsTouring] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(settings?.xoroAvatarUrl || XORO_AVATAR);

  const [isWaving, setIsWaving] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isFlyingJet, setIsFlyingJet] = useState(false);
  const [isClimbing, setIsClimbing] = useState(false);
  const [showRope, setShowRope] = useState(false);

  const currentAvatar = settings?.xoroAvatarUrl || XORO_AVATAR;

  // Listen for Escape key to close chat drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
  const [bubbleInput, setBubbleInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [showSpeechBubble, setShowSpeechBubble] = useState(settings?.isXoroVoiceAndAnswerDisabled ? false : true);
  const [speechBubbleText, setSpeechBubbleText] = useState("👋 আসসালামু আলাইকুম! স্টাইল এক্স-এ আপনাকে স্বাগতম! আমি জোরো (Xoro)। আজ আপনার ফ্যাশন ট্রেন্ড আপগ্রেড করতে প্রস্তুত?");
  const [hasDismissedBubble, setHasDismissedBubble] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [isSoundEnabled, setIsSoundEnabled] = useState(settings?.isXoroVoiceDisabled !== undefined ? !settings.isXoroVoiceDisabled : true);
  const [voicePitch, setVoicePitch] = useState<'low' | 'normal' | 'high'>('high');

  useEffect(() => {
    if (settings?.isXoroVoiceDisabled !== undefined) {
      setIsSoundEnabled(!settings.isXoroVoiceDisabled);
    }
  }, [settings?.isXoroVoiceDisabled]);

  useEffect(() => {
    if (settings?.isXoroVoiceAndAnswerDisabled) {
      setShowSpeechBubble(false);
    } else {
      setShowSpeechBubble(true);
    }
  }, [settings?.isXoroVoiceAndAnswerDisabled]);

  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [xoroProductContext, setXoroProductContext] = useState<Product | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const filtered = voices.filter(v => 
          v.lang.toLowerCase().startsWith('bn') || 
          v.lang.toLowerCase().includes('bengali') ||
          v.lang.toLowerCase().includes('bangla') ||
          v.lang.toLowerCase().startsWith('en')
        );
        setSystemVoices(filtered);

        const usVoice = filtered.find(v => {
          const lang = v.lang.toLowerCase();
          return lang === 'en-us' || lang === 'en_us' || lang.startsWith('en-us') || lang.startsWith('en_us');
        }) || filtered.find(v => v.lang.toLowerCase().startsWith('en'));

        if (usVoice) {
          setSelectedVoiceName(prev => prev || usVoice.name);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  useEffect(() => {
    const handleAskXoroEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const product = customEvent.detail as Product;
      if (product) {
        setIsOpen(true);
        setXoroProductContext(product);
        
        const greetingText = `✨ আমি দেখতে পাচ্ছি আপনি "${product.title}" সম্পর্কে জানতে চাচ্ছেন! এই চমৎকার পোশাকটির ডিজাইন, ফেব্রিক বা সাইজ নিয়ে আপনার যেকোনো প্রশ্ন আমাকে করতে পারেন।`;
        
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            text: greetingText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        
        setTimeout(() => {
          speakText(greetingText);
        }, 300);
      }
    };
    window.addEventListener('ask-xoro', handleAskXoroEvent);
    return () => window.removeEventListener('ask-xoro', handleAskXoroEvent);
  }, []);

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

  const playEmoRobotSound = (type: 'greet' | 'think' | 'happy' | 'launch' = 'greet') => {
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

      if (type === 'launch') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.5);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (type === 'greet') {
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
      } else if (type === 'happy') {
        const notes = [1046.50, 1174.66, 1318.51, 1567.98];
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
      }
    } catch (e) {
      console.warn("Robotic audio synthesis error:", e);
    }
  };

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
      
      if (speechAuraRef.current) {
        try {
          speechAuraRef.current.osc.stop();
          speechAuraRef.current.lfo.stop();
        } catch (e) {}
        speechAuraRef.current = null;
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(144, now);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(2.2, now);
      lfoGain.gain.setValueAtTime(1.8, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.0, now + 0.25);

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

  const speakText = (text: string) => {
    if (!isSoundEnabled || settings?.isXoroVoiceDisabled || settings?.isXoroVoiceAndAnswerDisabled || settings?.isXoroTextOnly) return;
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        stopSpeechAura();
  
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
  
        const hasBengali = /[\u0980-\u09FF]/.test(text);

        let cleanText = text
          .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
          .replace(/[*_`~]/g, ' ')
          .replace(/-/g, ' ')
          .replace(/:/g, ', ')
          .replace(/[!?]/g, '.')
          .replace(/\s+/g, ' ');

        if (hasBengali) {
          cleanText = cleanText
            .replace(/১ম/g, ' প্রথম ')
            .replace(/২য়/g, ' দ্বিতীয় ')
            .replace(/৩য়/g, ' তৃতীয় ')
            .replace(/৪র্থ/g, ' চতুর্থ ')
            .replace(/৫ম/g, ' পঞ্চম ')
            .replace(/৫মি/g, ' পঞ্চম ')
            .replace(/৬ষ্ঠ/g, ' ষষ্ঠ ')
            .replace(/৭ম/g, ' সপ্তম ')
            .replace(/৮ম/g, ' অষ্টম ')
            .replace(/৯ম/g, ' নবম ')
            .replace(/১০ম/g, ' দশম ')
            .replace(/Xoro/gi, ' জোরো ')
            .replace(/Style X/gi, ' স্টাইল এক্স ')
            .replace(/XP-/gi, ' স্টাইল কোড ')
            .replace(/৳/g, ' টাকা ')
            .replace(/&/g, ' এবং ')
            .replace(/\+/g, ' প্লাস ')
            .replace(/VIP/gi, ' ভি আই পি ')
            .replace(/SSL/gi, ' এস এস এল ');
        } else {
          cleanText = cleanText
            .replace(/Xoro/gi, ' Zoro ')
            .replace(/Style X/gi, ' Style Ex ')
            .replace(/XP-/gi, ' Style Code ')
            .replace(/৳/g, ' Taka ')
            .replace(/&/g, ' and ')
            .replace(/\+/g, ' plus ')
            .replace(/VIP/gi, ' V I P ')
            .replace(/SSL/gi, ' S S L ');
        }

        cleanText = cleanText.trim();
        if (!cleanText) return;
   
        const utterance = new SpeechSynthesisUtterance(cleanText);
    
        let currentPitch = 1.0;
        let currentRate = 1.0;
        if (hasBengali) {
          if (voicePitch === 'low') {
            currentPitch = 0.95;
            currentRate = 0.96;
          } else if (voicePitch === 'normal') {
            currentPitch = 1.0;
            currentRate = 1.0;
          } else {
            currentPitch = 1.05;
            currentRate = 1.0;
          }
          utterance.rate = currentRate;
          utterance.pitch = currentPitch;
          utterance.volume = 1.0;
        } else {
          if (voicePitch === 'low') {
            currentPitch = 0.95;
            currentRate = 0.96;
          } else if (voicePitch === 'normal') {
            currentPitch = 1.0;
            currentRate = 1.0;
          } else {
            currentPitch = 1.04;
            currentRate = 1.0;
          }
          utterance.rate = currentRate;
          utterance.pitch = currentPitch;
          utterance.volume = 1.0;
        }
   
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;
  
        if (selectedVoiceName) {
          selectedVoice = voices.find(v => v.name === selectedVoiceName);
        }

        if (!selectedVoice) {
          if (hasBengali) {
            const bnVoices = voices.filter(v => 
              v.lang.toLowerCase().startsWith('bn') || 
              v.lang.toLowerCase().includes('bengali') || 
              v.lang.toLowerCase().includes('bangla')
            );
            
            const femaleBnVoices = bnVoices.filter(v => 
              !v.name.toLowerCase().includes('male') && 
              !v.name.toLowerCase().includes('hemant') && 
              !v.name.toLowerCase().includes('pradeep') &&
              !v.name.toLowerCase().includes('niloy') &&
              !v.name.toLowerCase().includes('giri')
            );
            
            const premiumKeys = ['kalpana', 'nabanita', 'tanishaa', 'sabina', 'shreya', 'ananya', 'dilara', 'female', 'girl', 'woman', 'natural', 'neural', 'online', 'premium', 'google বাংলা', 'google'];
            for (const key of premiumKeys) {
              selectedVoice = femaleBnVoices.find(v => v.name.toLowerCase().includes(key));
              if (selectedVoice) break;
            }
            
            if (!selectedVoice) {
              selectedVoice = femaleBnVoices[0] || bnVoices[0];
            }
          }
    
          if (!selectedVoice) {
            const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
            const femaleEnVoices = enVoices.filter(v => 
              !v.name.toLowerCase().includes('male') && 
              !v.name.toLowerCase().includes('david') && 
              !v.name.toLowerCase().includes('george') && 
              !v.name.toLowerCase().includes('ravi') && 
              !v.name.toLowerCase().includes('james') &&
              !v.name.toLowerCase().includes('mark') && 
              !v.name.toLowerCase().includes('richard') &&
              !v.name.toLowerCase().includes('microsoft default')
            );
            
            const femaleKeys = ['samantha', 'aria', 'jenny', 'sara', 'zira', 'female', 'girl', 'woman', 'karen', 'moira', 'tessa', 'veena', 'hazel', 'susan', 'heera'];
            for (const key of femaleKeys) {
              selectedVoice = femaleEnVoices.find(v => v.name.toLowerCase().includes(key));
              if (selectedVoice) break;
            }
            
            if (!selectedVoice && enVoices.length > 0) {
              selectedVoice = femaleEnVoices[0] || enVoices.find(v => !v.name.toLowerCase().includes('male')) || enVoices[0];
            }
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
  
        currentUtteranceRef.current = utterance;
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
      if (oscRef.current) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(60, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(120, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.012, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.15, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.005, ctx.currentTime);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(ctx.destination);

      lfo.connect(lfoGain);
      lfoGain.connect(mainGain.gain);

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
    } catch (e) {}
  };

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

  useEffect(() => {
    const handleGesture = () => {
      if (isSoundEnabled) {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        startHumming();

        if (!hasSpokenWelcomeRef.current && showSpeechBubble && !isOpen) {
          hasSpokenWelcomeRef.current = true;
          speakText("Assalamu Alaikum! Welcome to Style X. I am Xoro.");
        }
      }
    };

    window.addEventListener('click', handleGesture);
    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);
    window.addEventListener('scroll', handleGesture);
    window.addEventListener('touchstart', handleGesture, { passive: true });
    window.addEventListener('mousemove', handleGesture, { passive: true });
    window.addEventListener('mouseenter', handleGesture);
    window.addEventListener('focus', handleGesture);

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

  const prevCartLengthRef = useRef(cart.length);
  useEffect(() => {
    if (cart.length > prevCartLengthRef.current) {
      if (isSoundEnabled) {
        speakText("দারুণ পছন্দ! পণ্যটি আপনার কার্টে যোগ করা হয়েছে।");
      }
      setSpeechBubbleText("🛍️ চমৎকার নির্বাচন! পণ্যটি কার্টে যোগ করা হয়েছে।");
      setShowSpeechBubble(true);
      setIsCelebrating(true);
      setTimeout(() => setIsCelebrating(false), 2500);
    }
    prevCartLengthRef.current = cart.length;
  }, [cart.length, isSoundEnabled]);

  const handleNavigateToSection = async (section: string, customSpeech?: string) => {
    setIsFlyingJet(true);
    playEmoRobotSound('launch');

    const defaultSpeechMap: Record<string, string> = {
      hero: "আসসালামু আলাইকুম! চলুন যাই! আমরা এখন স্টাইল এক্স-এর রাজকীয় হিরো সেকশনে প্রবেশ করছি! ✨",
      countdown: "⏳ এই জোনে লিমিটেড টাইম রয়েল ফ্ল্যাশ ইভেন্ট চলছে! মিস করবেন না কিন্তু!",
      catalog: "👔 এটি আমাদের স্টাইল এক্স সিগনেচার কালেকশন! চমৎকার ডিজাইন এবং নিখুঁত কাপড়ের মেলবন্ধন!",
      lottery: "🎟️ স্বাগতম রয়েল লাক্সারি স্পিন লটারিতে! কুপন এবং বিশেষ অফার জিতে নিতে এখানে ক্লিক করুন!",
      cart: "🛒 এটি আপনার রাজকীয় শপিং কার্ট! এখানে আপনার নির্বাচিত পোশাকগুলো সুরক্ষিতভাবে চেকআউট করতে পারেন।",
      tracker: "📦 আপনার অর্ডারটি কোথায় আছে দেখতে চান? এখানে আপনার আইডি বা নম্বর দিয়ে লাইভ ট্র্যাক করুন!",
      reviews: "✍️ আমাদের বৈশ্বিক গ্রাহকদের ভেরিফাইড এক্সপেরিয়েন্স লেজার বুক দেখুন! আপনার মতামতও জানাতে পারেন।"
    };

    const speechText = customSpeech || defaultSpeechMap[section] || "চলুন যাই! ✨";
    setSpeechBubbleText(speechText);
    setShowSpeechBubble(true);

    if (isSoundEnabled) {
      speakText(speechText);
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    switch (section) {
      case 'hero':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'countdown': {
        const banner = document.getElementById('global-countdown-banner');
        if (banner) {
          banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }
        break;
      }
      case 'catalog': {
        if (onSetCategory) onSetCategory('ALL');
        const cat = document.getElementById('exclusive-series-catalog');
        if (cat) {
          cat.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 900, behavior: 'smooth' });
        }
        break;
      }
      case 'lottery':
        if (onToggleLottery) onToggleLottery(true);
        break;
      case 'cart':
        if (onToggleCart) onToggleCart(true);
        break;
      case 'tracker': {
        if (onSetTrackMode) onSetTrackMode(true);
        const trackerEl = document.getElementById('order-tracker-container');
        if (trackerEl) {
          trackerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 500, behavior: 'smooth' });
        }
        break;
      }
      case 'reviews': {
        const rev = document.getElementById('customer-experiences-reviews');
        if (rev) {
          rev.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 1800, behavior: 'smooth' });
        }
        break;
      }
      default:
        break;
    }

    setTimeout(() => {
      setIsFlyingJet(false);
      playEmoRobotSound('happy');
      setTimeout(() => {
        setShowSpeechBubble(false);
      }, 5000);
    }, 2000);
  };

  const startAutomaticTour = async () => {
    setIsTouring(true);
    setIsOpen(false);
    
    const steps = [
      { section: 'hero', speech: "👋 আসসালামু আলাইকুম! আমি জোরো। চলুন, স্টাইল এক্স-এর পুরো ওয়েবসাইট ঘুরে দেখাই! আমাদের প্রথম স্টপ: রাজকীয় হিরো ব্যানার! 🌟" },
      { section: 'countdown', speech: "⏳ ২য় স্টপ: লিমিটেড টাইম ফ্ল্যাশ সেল ইভেন্ট! বিশেষ ছাড়ের সময় শেষ হবার আগে এখনই কিনে নিন!" },
      { section: 'catalog', speech: "👔 ৩য় স্টপ: এক্সক্লুসিভ ক্লোথিং কালেকশন! চমৎকার ডিজাইন এবং নিখাদ সুতার প্রিমিয়াম পোশাক!" },
      { section: 'lottery', speech: "🎟️ ৪র্থ স্টপ: রয়্যাল লাক্সারি স্পিন লটারিতে আপনার ভাগ্য পরীক্ষা করে নিন!" },
      { section: 'reviews', speech: "✍️ ৫ম স্টপ: ভেরিফাইড কাস্টমার লেজার! বৈশ্বিক গ্রাহকদের চমৎকার সব রিভিউ এবং ফিডব্যাক বুক!" },
      { section: 'cart', speech: "🛒 শেষ স্টপ: চেকআউট কার্ট! এখানে আপনার নির্বাচিত রাজকীয় পোশাক ও নিরাপদ পেমেন্ট সম্পন্ন করতে পারবেন।" }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      playEmoRobotSound('think');
      setSpeechBubbleText(step.speech);
      setShowSpeechBubble(true);
      if (isSoundEnabled) {
        speakText(step.speech);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      switch (step.section) {
        case 'hero':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'countdown': {
          const banner = document.getElementById('global-countdown-banner');
          if (banner) banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
          else window.scrollTo({ top: 400, behavior: 'smooth' });
          break;
        }
        case 'catalog': {
          if (onSetCategory) onSetCategory('ALL');
          const cat = document.getElementById('exclusive-series-catalog');
          if (cat) cat.scrollIntoView({ behavior: 'smooth', block: 'center' });
          else window.scrollTo({ top: 900, behavior: 'smooth' });
          break;
        }
        case 'lottery':
          if (onToggleLottery) onToggleLottery(true);
          break;
        case 'reviews': {
          if (onToggleLottery) onToggleLottery(false);
          const rev = document.getElementById('customer-experiences-reviews');
          if (rev) rev.scrollIntoView({ behavior: 'smooth', block: 'center' });
          else window.scrollTo({ top: 1800, behavior: 'smooth' });
          break;
        }
        case 'cart':
          if (onToggleCart) onToggleCart(true);
          break;
        default:
          break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (step.section === 'cart' && onToggleCart) {
        onToggleCart(false);
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSpeechBubbleText("🎉 ওয়াও! স্টাইল এক্স-এর পুরো সফর সম্পন্ন হলো! আপনার কেনাকাটা দারুণ উপভোগ্য হোক। 😄");
    if (isSoundEnabled) {
      speakText("স্টাইল এক্স-এর পুরো সফর সম্পন্ন হলো! আপনার কেনাকাটা দারুণ উপভোগ্য হোক।");
    }
    playEmoRobotSound('happy');
    setIsTouring(false);
    
    setTimeout(() => {
      setShowSpeechBubble(false);
    }, 4000);
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    playEmoRobotSound('happy');
    if (isSoundEnabled) {
      speakText(`কুপন কোড ${code} কপি করা হয়েছে।`);
    }
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const triggerQuickAction = (action: 'recommend' | 'coupons' | 'fit' | 'track' | 'tips') => {
    const prompts: Record<string, string> = {
      recommend: "আমাদের ট্রেন্ডিং এবং জনপ্রিয় কালেকশনগুলো দেখান।",
      coupons: "চলমান ডিসকাউন্ট অফার এবং কুপন কোডগুলো কী কী?",
      fit: "পোশাকের সাইজ এবং সঠিক ফিটিং গাইড সম্পর্কে জানতে চাই।",
      track: "আমার অর্ডার কীভাবে ট্র্যাক করব?",
      tips: "আজকের বিশেষ ফ্যাশন এবং স্টাইলিং টিপস দিন।"
    };
    if (prompts[action]) {
      handleSendMessage(prompts[action]);
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!hasDismissedBubble && !isOpen) {
      setIsWaving(true);
      setShowSpeechBubble(true);
      const waveTimer = setTimeout(() => setIsWaving(false), 2500);

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
      setSpeechBubbleText("🛒 আসসালামু আলাইকুম! আপনার কার্টে পণ্য যুক্ত হয়েছে। অর্ডার সম্পন্ন করতে কোনো সাহায্য লাগবে?");
      setShowSpeechBubble(true);
    }
  }, [confirmedOrderId, isCartOpen, currentProduct, cart.length, hasDismissedBubble, isOpen]);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || settings?.isXoroVoiceAndAnswerDisabled) return;

    const trimmed = userText.trim();
    const userMsg: Message = {
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    playEmoRobotSound('think');

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    const lower = trimmed.toLowerCase();
    let replyText = "";
    let replyMeta: any = undefined;

    const orderIdMatch = trimmed.match(/(?:SX-?|order\s*#?)\s*(\d+)/i) || trimmed.match(/(\b\d{4,8}\b)/);
    
    if (orderIdMatch) {
      const matchedNum = orderIdMatch[1] || orderIdMatch[0];
      replyText = `📦 আসসালামু আলাইকুম! অর্ডার #${matchedNum} এর লাইভ ট্র্যাকিং তথ্য চেক করা হচ্ছে। অনুগ্রহ করে নিচে 'View full VIP tracking details' বাটনে চাপ দিয়ে সম্পূর্ণ স্ট্যাটাস দেখুন।`;
      replyMeta = {
        order: {
          id: matchedNum,
          customerName: "Valued VIP Client",
          totalAmount: 1850,
          status: "PACKED & IN TRANSIT",
          paymentMethod: "Cash on Delivery (COD)"
        }
      };
    } else if (lower.includes("coupon") || lower.includes("কুপন") || lower.includes("discount") || lower.includes("ছাড়") || lower.includes("offer")) {
      const activeCoupons = coupons.filter(c => !c.isEspecial);
      if (activeCoupons.length > 0) {
        const codesList = activeCoupons.map(c => `• Code: ${c.code} (${c.value}${c.type === 'PERCENTAGE' ? '%' : '৳'} OFF)`).join('\n');
        replyText = `🎟️ স্টাইল এক্স-এর সক্রিয় স্পেশাল প্রোমো কোডসমূহ:\n\n${codesList}\n\nআপনার পছন্দের কোডটি কপি করে চেকআউট পেজে ব্যবহার করুন!`;
      } else {
        replyText = `🎟️ বর্তমানে আমাদের বিশেষ ক্যাশব্যাক এবং ডেলিভারি অফার চলছে! যেকোনো পোশাক অর্ডারে দ্রুত ডেলিভারি উপভোগ করুন।`;
      }
    } else if (lower.includes("recommend") || lower.includes("পছন্দ") || lower.includes("কালেকশন") || lower.includes("পোশাক") || lower.includes("trending") || lower.includes("product") || lower.includes("দামে") || lower.includes("কিনব")) {
      const topProducts = products.slice(0, 3);
      if (topProducts.length > 0) {
        const prodList = topProducts.map(p => `✨ ${p.title} - ৳${getProductActivePrice(p)} (Code: ${p.code})`).join('\n');
        replyText = `👔 আমাদের সবচেয়ে ট্রেন্ডিং এবং জনপ্রিয় পোশাকসমূহ:\n\n${prodList}\n\nনিচে বিস্তারিত প্রিভিউ কার্ডে ক্লিক করে সরাসরি দেখতে পারেন।`;
      } else {
        replyText = `👔 স্টাইল এক্স কালেকশনে রয়েছে প্রিমিয়াম পাঞ্জাবি, শার্ট, এবং এক্সক্লুসিভ অ্যাটায়ার। ক্যাটালগ সেকশনটি ঘুরে দেখুন!`;
      }
    } else if (lower.includes("size") || lower.includes("সাইজ") || lower.includes("fit") || lower.includes("ফিটিং") || lower.includes("মাপ")) {
      replyText = `📏 স্টাইল এক্স সাইজ গাইড:\n\n• S (Chest: 38", Length: 38")\n• M (Chest: 40", Length: 40")\n• L (Chest: 42", Length: 42")\n• XL (Chest: 44", Length: 44")\n• XXL (Chest: 46", Length: 46")\n\nআমাদের সব পোশাক স্ট্যান্ডার্ড রেগুলার ও স্লিম কমফোর্ট ফিটে তৈরি।`;
    } else if (lower.includes("delivery") || lower.includes("ডেলিভারি") || lower.includes("কুরিয়ার") || lower.includes("শিপিং") || lower.includes("চার্জ")) {
      replyText = `🚚 ডেলিভারি তথ্য:\n\n• ঢাকা সিটির ভেতরে: ৬০-১০০ ৳ (২৪-৪৮ ঘণ্টার মধ্যে হোম ডেলিভারি)\n• ঢাকার বাইরে সমগ্র বাংলাদেশ: ১৩০-১৫০ ৳ (২-৩ কার্যদিবসে দ্রুত কুরিয়ার)\n• ক্যাশ অন ডেলিভারি (COD) সুবিধা সম্পূর্ণ সক্রিয়!`;
    } else if (lower.includes("payment") || lower.includes("টাকা") || lower.includes("পেমেন্ট") || lower.includes("bkash") || lower.includes("বিকাশ") || lower.includes("cod")) {
      replyText = `💳 আমাদের সহজ পেমেন্ট মাধ্যমসমূহ:\n\n• ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ)\n• বিকাশ (bKash), নগদ (Nagad), রকেট (Rocket)\n• ভিসা / মাস্টারকার্ড ও ডেবিট কার্ড সাপোর্ট।`;
    } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("সালাম") || lower.includes("assalamu") || lower.includes("কেমন আছেন")) {
      replyText = `👋 আসসালামু আলাইকুম! আমি জোরো (Xoro), স্টাইল এক্স-এর অফিশিয়াল ফ্যাশন ও শপিং অ্যাসিস্ট্যান্ট। আজ কীভাবে আপনাকে সহায়তা করতে পারি?`;
    } else {
      replyText = `✨ আসসালামু আলাইকুম! আপনার বার্তার জন্য ধন্যবাদ। স্টাইল এক্স-এর যে-কোনো পোশাক বাছাই, সাইজ গাইড, অথবা অর্ডার ট্র্যাকিং নিয়ে আমি সবসময় সহায়তায় প্রস্তুত আছি।`;
    }

    setTimeout(() => {
      setIsTyping(false);
      const assistantMsg: Message = {
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: replyMeta
      };
      setMessages(prev => [...prev, assistantMsg]);
      playEmoRobotSound('happy');

      if (isSoundEnabled) {
        speakText(replyText);
      }

      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 600);
  };

  const handleToggleOpen = () => {
    if (isDraggingRef.current) return;
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    setShowSpeechBubble(false);
    if (nextOpen && isSoundEnabled) {
      speakText("Assalamu Alaikum! Welcome to Style X. I am Xoro.");
    }
  };

  return (
    <>
      {/* 1. FLOATING MASCOT & SPEECH BUBBLE */}
      <motion.div 
        id="xoro-floating-assistant" 
        initial={{ opacity: 0, scale: 0, x: -30 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0, x: -30 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        drag
        onDragStart={() => { isDraggingRef.current = true; }}
        onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 150); }}
        dragMomentum={false}
        dragElastic={0.08}
        className="fixed left-3 md:left-5 top-1/2 -translate-y-1/2 z-[90] flex flex-col items-start select-none cursor-grab active:cursor-grabbing"
      >
        
        {/* SPEECH BUBBLE OUTLET */}
        <AnimatePresence>
          {showSpeechBubble && !isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: 'spring', damping: 15 }}
              className="mb-2.5 max-w-[230px] sm:max-w-[250px] bg-zinc-950 border-2 border-luxury-gold/50 shadow-[0_10px_30px_rgba(212,175,55,0.25)] rounded-2xl p-2.5 sm:p-3 text-left relative"
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
              <p className="text-[10.5px] sm:text-[11px] leading-relaxed text-zinc-100 font-sans pr-3">
                {speechBubbleText}
              </p>
              
              {/* DIRECT TEXT QUERY INPUT */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!bubbleInput.trim()) return;
                  const query = bubbleInput;
                  setBubbleInput('');
                  setIsOpen(true);
                  setShowSpeechBubble(false);
                  handleSendMessage(query);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                className="mt-2 flex items-center gap-1 border-t border-white/10 pt-1.5 pointer-events-auto"
              >
                <input 
                  type="text"
                  value={bubbleInput}
                  onChange={(e) => setBubbleInput(e.target.value)}
                  onFocus={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  disabled={Boolean(settings?.isXoroVoiceAndAnswerDisabled)}
                  placeholder={settings?.isXoroVoiceAndAnswerDisabled ? "নিষ্ক্রিয় রয়েছে" : "Xoro-কে প্রশ্ন করুন..."}
                  className="flex-1 min-w-0 bg-zinc-900/90 border border-white/15 hover:border-white/30 focus:border-luxury-gold focus:outline-none rounded-md text-[9px] sm:text-[9.5px] px-1.5 py-0.5 font-sans text-white transition-all disabled:opacity-50 shadow-inner pointer-events-auto select-text touch-auto cursor-text"
                />
                <button 
                  type="submit"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  disabled={Boolean(settings?.isXoroVoiceAndAnswerDisabled || !bubbleInput.trim())}
                  className="h-5 w-5 sm:h-5.5 sm:w-5.5 bg-luxury-gold hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:hover:brightness-100 text-luxury-black rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border-0 outline-none shadow-md pointer-events-auto"
                >
                  <Send size={9} />
                </button>
              </form>
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
              <div className="absolute inset-0 bg-yellow-400 blur-[4px] opacity-60 rounded-full animate-pulse"></div>
              <div 
                className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(212,175,55,1),rgba(212,175,55,1)_3px,rgba(163,117,14,1)_3px,rgba(163,117,14,1)_6px)] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)] border border-yellow-300/30"
              />
              <div className="absolute top-0 bottom-0 left-[2px] right-[2px] bg-gradient-to-b from-white/90 via-yellow-300/40 to-transparent rounded-full mix-blend-overlay"></div>
              
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] rounded-full shadow-[0_4px_10px_rgba(212,175,55,0.9)] border border-yellow-200">
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2 h-2.5 bg-[#aa7c11] rounded-b-full animate-bounce"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FLOATING MASCOT BUTTON */}
        <motion.button
          onClick={handleToggleOpen}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
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
          className={`relative h-14 w-14 flex items-center justify-center cursor-pointer overflow-visible transition-all duration-300 rounded-full text-luxury-gold p-1 ${
            isFlyingJet 
              ? 'bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border-2 border-luxury-gold shadow-[0_0_35px_rgba(212,175,55,0.85)]' 
              : 'bg-gradient-to-b from-zinc-950 via-zinc-900 to-black border-2 border-luxury-gold/50 shadow-[0_4px_24px_rgba(212,175,55,0.4)]'
          } hover:shadow-[0_4px_32px_rgba(212,175,55,0.6)] hover:border-luxury-gold`}
          title="Open Xoro Assistant"
        >
          {/* ROCKET BODY EXTRAS */}
          {isFlyingJet && (
            <>
              <motion.div 
                initial={{ opacity: 0, scale: 0.2, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-8 bg-gradient-to-b from-luxury-gold via-yellow-600 to-zinc-950 border border-luxury-gold/60 z-20 shadow-[0_0_15px_rgba(212,175,55,0.5)] pointer-events-none"
                style={{ borderRadius: '60% 60% 0 0' }}
              >
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse pointer-events-none" />
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-400 rounded-full animate-ping pointer-events-none" />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 10, rotate: -40 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                className="absolute -left-3.5 bottom-1.5 w-4 h-8 bg-gradient-to-br from-luxury-gold via-yellow-700 to-zinc-950 border border-luxury-gold/50 rounded-tl-[100%] rounded-bl-[20%] origin-bottom-right z-10 pointer-events-none"
              />

              <motion.div 
                initial={{ opacity: 0, x: -10, rotate: 40 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                className="absolute -right-3.5 bottom-1.5 w-4 h-8 bg-gradient-to-bl from-luxury-gold via-yellow-700 to-zinc-950 border border-luxury-gold/50 rounded-tr-[100%] rounded-br-[20%] origin-bottom-left z-10 pointer-events-none"
              />

              <div className="absolute inset-0 rounded-full border-2 border-luxury-gold bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-30" />
            </>
          )}

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
                <div className="w-5 h-3 bg-gradient-to-b from-zinc-800 via-zinc-950 to-zinc-900 border border-zinc-700/40 rounded-b-md shadow-lg flex items-center justify-center relative overflow-hidden z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                  <div className="absolute bottom-0 w-3 h-[2px] bg-gradient-to-r from-orange-500 via-yellow-300 to-orange-500 blur-[0.5px]"></div>
                </div>

                <div className="relative flex flex-col items-center mt-[-1px] w-full h-[60px] overflow-visible">
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

                  <motion.div 
                    animate={{ 
                      height: [35, 50, 35],
                      width: [14, 18, 14],
                      filter: ["blur(1px)", "blur(2px)", "blur(1px)"]
                    }}
                    transition={{ repeat: Infinity, duration: 0.12, ease: "linear" }}
                    className="absolute top-0 bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-600 rounded-b-full w-4 z-10 shadow-[0_0_20px_rgba(212,175,55,0.8)]"
                  />

                  <motion.div 
                    animate={{ 
                      height: [20, 32, 20],
                      scaleX: [0.85, 1.1, 0.85]
                    }}
                    transition={{ repeat: Infinity, duration: 0.08, ease: "linear" }}
                    className="absolute top-0 bg-gradient-to-b from-white via-cyan-200/90 to-transparent rounded-b-full w-2.5 z-20 shadow-[0_0_12px_#fff,0_0_25px_rgba(56,189,248,0.9)]"
                  >
                    <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rotate-45 rounded-[1px] shadow-[0_0_8px_#fff]"></div>
                    <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-300 rotate-45 rounded-[1px]"></div>
                  </motion.div>

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
      </motion.div>

      {/* 2. CHAT DRAWER PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-auto sm:bottom-6 z-[9999] w-auto sm:w-[360px] md:w-[390px] h-[550px] max-h-[calc(100dvh-2.5rem)] bg-zinc-950/98 backdrop-blur-2xl border border-luxury-gold/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95),0_10px_30px_rgba(212,175,55,0.25)] overflow-hidden flex flex-col select-text touch-auto"
          >
            {/* DRAWER HEADER */}
            <div className="p-3 bg-gradient-to-r from-luxury-black via-[#0d0d0d] to-luxury-black border-b border-white/5 flex items-center justify-between relative">
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
                  
                  {/* Voice Output Setting */}
                  <div className="p-3 bg-gradient-to-r from-purple-950/20 via-[#101014] to-zinc-900/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/30">
                        {isSoundEnabled ? (
                          <Volume2 size={14} className="text-purple-400 animate-pulse" />
                        ) : (
                          <VolumeX size={14} className="text-zinc-500" />
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-purple-300">Xoro Voice Output</span>
                        <span className="text-[7.5px] text-zinc-400 font-sans">
                          {isSoundEnabled ? "কথা বলবে (Speaking Mode Active)" : "কথা বন্ধ (Silent Chat Only)"}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        const nextSound = !isSoundEnabled;
                        setIsSoundEnabled(nextSound);
                        if (nextSound) {
                          setTimeout(() => {
                            speakText("আমি এখন কথা বলতে পারব।");
                          }, 50);
                        }
                      }}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isSoundEnabled ? 'bg-purple-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Brand introduction banner card */}
                  <div className="p-3 bg-gradient-to-br from-[#111112] via-[#09090a] to-black border border-white/5 rounded-xl flex flex-col items-center text-center space-y-2.5">
                    <span className="text-lg animate-bounce">🤖</span>
                    <p className="text-[8px] font-mono uppercase tracking-widest text-luxury-gold font-bold">Virtual Fashion Concierge</p>
                    <p className="text-[10px] text-zinc-400 leading-normal font-sans max-w-[210px]">
                      Hello, I am Xoro! Let us find your ultimate luxury ensemble.
                    </p>

                    {/* Voice Pitch Controls */}
                    <div className="w-full pt-2 border-t border-white/5 flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        <Sparkles size={8} className="text-luxury-gold animate-pulse" />
                        <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-400">Xoro Pitch Settings</span>
                      </div>
                      <div className="flex gap-1 bg-black p-0.5 rounded-lg border border-white/5 w-full max-w-[220px]">
                        {(['low', 'normal', 'high'] as const).map((pitch) => (
                          <button
                            key={pitch}
                            onClick={() => {
                              setVoicePitch(pitch);
                              const textMap = {
                                low: "আমার নতুন গম্ভীর কণ্ঠস্বর সেট করা হয়েছে।",
                                normal: "আমার স্বাভাবিক কণ্ঠস্বর সেট করা হয়েছে।",
                                high: "আমার মিষ্টি ও প্রিমিয়াম কণ্ঠস্বর সেট করা হয়েছে।"
                              };
                              setTimeout(() => {
                                speakText(textMap[pitch]);
                              }, 50);
                            }}
                            className={`flex-1 py-1 text-[8.5px] font-mono rounded uppercase tracking-wider transition-all cursor-pointer ${
                              voicePitch === pitch
                                ? 'bg-luxury-gold text-black font-bold shadow-sm shadow-luxury-gold/20'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                            }`}
                          >
                            {pitch}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Voice Selector Dropdown */}
                    <div className="w-full pt-2 border-t border-white/5 flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        <Sparkles size={8} className="text-luxury-gold animate-pulse" />
                        <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-400">Select Voice (কণ্ঠস্বর পরিবর্তন করুন)</span>
                      </div>
                      {systemVoices.length > 0 ? (
                        <select
                          value={selectedVoiceName || ''}
                          onChange={(e) => {
                            const vName = e.target.value;
                            setSelectedVoiceName(vName || null);
                            const voice = systemVoices.find(v => v.name === vName);
                            if (voice) {
                              const sampleText = voice.lang.toLowerCase().startsWith('bn') || voice.lang.toLowerCase().includes('bengali') || voice.lang.toLowerCase().includes('bangla')
                                ? `আমি ${voice.name}। এখন থেকে আমি আপনার সাথে কথা বলব।`
                                : `Hello! I am ${voice.name}. I will be speaking with you from now on.`;
                              setTimeout(() => {
                                speakText(sampleText);
                              }, 100);
                            } else {
                              setTimeout(() => {
                                speakText("কণ্ঠস্বর অটোমেটিক সেট করা হয়েছে।");
                              }, 100);
                            }
                          }}
                          className="w-full max-w-[220px] bg-zinc-950 text-zinc-300 text-[10px] font-mono rounded border border-white/10 px-1.5 py-1 focus:outline-none focus:border-luxury-gold/50 cursor-pointer text-center"
                        >
                          <option value="" className="bg-[#121212] text-white">-- Auto-Match Best Voice --</option>
                          {systemVoices.map((voice) => (
                            <option key={voice.name} value={voice.name} className="bg-[#121212] text-white">
                              {voice.name} ({voice.lang.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full max-w-[220px] bg-zinc-950 text-zinc-500 text-[9px] font-mono rounded border border-white/10 px-1.5 py-1 text-center italic">
                          Loading system voice profiles...
                        </div>
                      )}
                    </div>
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

                            {/* 1. COUPON SUGGESTIONS */}
                            {!isUser && (m.text.includes("Code:") || m.text.includes("coupon") || m.type === 'coupons') && coupons.filter(c => !c.isEspecial).length > 0 && (
                              <div className="mt-3.5 space-y-2 border-t border-white/5 pt-3">
                                <p className="text-[9px] font-mono uppercase text-luxury-gold tracking-widest font-bold">Active Promo Codes:</p>
                                {coupons.filter(c => !c.isEspecial).map((c, cIdx) => (
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
                                    <AssistantProductCard 
                                      key={pIdx} 
                                      product={p} 
                                      onSelectProduct={onSelectProduct} 
                                      setIsOpen={setIsOpen} 
                                    />
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

                {/* COMPACT LUXURY CHAT COMPOSER WITH RUNNING GLOW EFFECT */}
                <div className="p-3 bg-black/95 border-t border-white/10 shrink-0">
                  <div className="relative w-full rounded-[22px] p-[1.5px] overflow-hidden group shadow-[0_0_15px_rgba(255,215,0,0.25),0_0_30px_rgba(168,85,247,0.2)]">
                    <div className="absolute -inset-[150%] bg-[conic-gradient(from_0deg,#FFD700_0deg,#a855f7_120deg,#00ffff_240deg,#FFD700_360deg)] animate-[spin_3.5s_linear_infinite] opacity-85 group-hover:opacity-100 transition-opacity blur-[1px]" />
                    
                    <form 
                      id="xoro-chat-composer"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage(inputValue);
                      }}
                      className="relative w-full h-[56px] bg-[#090412]/95 backdrop-blur-xl rounded-[18px] pl-[16px] pr-[6px] flex items-center justify-between transition-all duration-300 ease-out z-10 overflow-hidden"
                    >
                      <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={settings?.isXoroVoiceAndAnswerDisabled}
                        placeholder={settings?.isXoroVoiceAndAnswerDisabled ? "জোরো অ্যাসিস্ট্যান্ট বর্তমানে নিষ্ক্রিয় রয়েছে" : "Ask Xoro styling tips, track order..."}
                        className="flex-1 min-w-0 h-[46px] leading-[46px] py-0 bg-transparent text-white text-[14px] border-0 outline-none focus:outline-none focus:ring-0 placeholder-white/50 caret-[#FFD700] font-sans disabled:opacity-50 select-text flex items-center my-auto"
                        style={{ display: 'flex', alignItems: 'center', paddingTop: 0, paddingBottom: 0, height: '46px', lineHeight: '46px' }}
                      />
                      <button 
                        type="submit"
                        disabled={settings?.isXoroVoiceAndAnswerDisabled || !inputValue.trim()}
                        className="h-[42px] w-[42px] bg-gradient-to-r from-[#FFD700] to-[#FFB700] hover:brightness-110 active:scale-95 disabled:opacity-30 text-black rounded-[13px] flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 outline-none border-0 shadow-[0_0_12px_rgba(255,215,0,0.3)] my-auto"
                        title="Send message"
                      >
                        <Send size={18} className="translate-x-[0.5px]" />
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              /* EXPLORE MAP BODY */
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col bg-zinc-950/90 text-left">
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
                      { id: 'reviews', name: '✍️ ভেরিফাইড রিভিউ', desc: 'গ্রাহকদের মতামত খাতা' }
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
    </>
  );
}

function AssistantProductCard({ 
  product, 
  onSelectProduct, 
  setIsOpen 
}: { 
  product: any; 
  onSelectProduct: (p: any) => void; 
  setIsOpen: (open: boolean) => void; 
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div 
      onClick={() => {
        onSelectProduct(product);
        setIsOpen(false);
      }}
      className="bg-black/40 border border-white/5 hover:border-luxury-gold/30 rounded-xl p-1.5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col group relative"
    >
      <div className="product-image-container aspect-square rounded-lg overflow-hidden bg-zinc-950 relative flex items-center justify-center p-1.5 border border-transparent transition-all duration-300">
        {!imageLoaded && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0c] via-[#121217] to-[#0a0a0c]">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-luxury-gold/10 border-t-luxury-gold/80 animate-spin"></div>
              <div className="absolute inset-0.5 rounded-full border border-luxury-purple-glowing/10 border-b-luxury-purple-glowing/60 animate-spin-slow"></div>
              <div className="w-1 h-1 rounded-full bg-luxury-gold animate-pulse"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
          </div>
        )}

        <img 
          src={product.imageUrl} 
          alt={product.title} 
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-contain object-center transition-all duration-1000 ease-out group-hover:scale-105 z-10 ${
            imageLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-md'
          }`} 
          referrerPolicy="no-referrer"
        />
        <span className="absolute top-1 left-1 text-[7px] bg-black/80 text-luxury-gold px-1 rounded font-mono uppercase tracking-widest z-20">
          {product.code}
        </span>
      </div>
      <p className="text-[9px] font-bold text-white truncate mt-1 leading-tight">{product.title}</p>
      <p className="text-[8px] text-luxury-gold font-mono font-black mt-0.5">৳{getProductActivePrice(product)}</p>
    </div>
  );
}
