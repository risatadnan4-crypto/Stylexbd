import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Headset, CheckCheck } from 'lucide-react';
import { ChatRoom, ChatMessage } from '../types';

interface LiveChatProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export default function LiveChat({
  isOpen: propIsOpen,
  onOpenChange,
  showTrigger = true
}: LiveChatProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;

  const setIsOpen = (val: boolean) => {
    if (onOpenChange) {
      onOpenChange(val);
    } else {
      setInternalIsOpen(val);
    }
  };
  const [roomId, setRoomId] = useState('');
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate unique room ID on load if not existing
  useEffect(() => {
    let storedId = sessionStorage.getItem('stylex_chat_room');
    if (!storedId) {
      storedId = 'room-' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('stylex_chat_room', storedId);
    }
    setRoomId(storedId);
    fetchRoom(storedId);
  }, []);

  // Poll chat room every 4 seconds when popup is open
  useEffect(() => {
    if (!isOpen || !roomId) return;

    const interval = setInterval(() => {
      fetchRoom(roomId);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, roomId]);

  // Scroll to bottom when message list expands
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [room?.messages, isOpen, room?.typingAdmin]);

  const fetchRoom = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data);
      }
    } catch (err) {
      console.error("Error loading chat logs:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !roomId) return;

    const textToSend = newMsg.trim();
    setNewMsg('');

    try {
      // Optimistic client display
      if (room) {
        const clientOptMessage: ChatMessage = {
          id: `opt-${Date.now()}`,
          sender: 'customer',
          text: textToSend,
          date: new Date().toISOString()
        };
        setRoom({
          ...room,
          messages: [...room.messages, clientOptMessage]
        });
      }

      // API request
      const res = await fetch(`/api/chat/${roomId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'customer', text: textToSend })
      });

      if (res.ok) {
        const updatedRoom = await res.json();
        setRoom(updatedRoom);
      }
    } catch (err) {
      console.error("Chat sync error:", err);
    }
  };

  if (!showTrigger && !isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      
      {/* Floating launcher Button with luxury pulse circles */}
       {showTrigger && !isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            if (roomId) fetchRoom(roomId);
          }}
          className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer group"
          title="Digital Concierge Help"
        >
          {/* Animated multi-layered running glow border (Gold + Purple + Blue + Green) around the button */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            {/* Soft splash backdrop glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[4px] opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
            {/* Sharp crisp running line */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-[conic-gradient(from_0deg,#D4AF37,#9A4DFF,#3b82f6,#22c55e,#D4AF37)] animate-luxury-glow-spin blur-[0.5px] opacity-90 group-hover:scale-105 transition-all duration-300" />
            <div className="absolute inset-[1.5px] rounded-full bg-[#0a0412]" />
          </div>

          {/* Pulsing visual halo rings */}
          <span className="absolute inset-0 rounded-full border border-luxury-gold/45 opacity-35 scale-125 animate-ping pointer-events-none z-0"></span>
          <MessageSquare className="relative z-10 w-4.5 h-4.5 sm:w-[22px] sm:h-[22px] stroke-[1.8] text-white group-hover:text-luxury-gold transition-colors" />
        </button>
      )}

      {/* Chat Popup Box Panel */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-[#080808] border border-luxury-gold/25 rounded-lg shadow-2xl flex flex-col justify-between overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div className="bg-[#0f0f0f] border-b border-luxury-gold/15 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 rounded-full bg-luxury-charcoal flex items-center justify-center border border-luxury-gold/30">
                <Headset size={14} className="text-luxury-gold" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full ring-2 ring-black"></span>
              </div>
              <div>
                <p className="text-xs text-white font-serif font-bold uppercase tracking-wider">Style X Assistant</p>
                <p className="text-[9px] text-green-400 font-mono flex items-center gap-1 uppercase">
                  <span>●</span> active concierge
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-[#d4af37] hover:rotate-90 transition-all duration-300 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-luxury-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] active:scale-90 cursor-pointer"
              title="Close Concierge"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages content area */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#050505]/50"
          >
            {room?.messages.map((m) => {
              const isAdminMsg = m.sender === 'admin';
              
              return (
                <div 
                  key={m.id}
                  className={`flex ${isAdminMsg ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[75%] rounded p-2.5 text-xs ${
                    isAdminMsg 
                      ? 'bg-luxury-charcoal text-white font-light border border-white/5' 
                      : 'bg-luxury-gold/10 text-white border border-luxury-gold/20'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    
                    {/* Footnote status checkmarks */}
                    <div className="flex justify-end items-center gap-1 text-[8px] text-white/40 mt-1 select-none">
                      <span>{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!isAdminMsg && <CheckCheck size={11} className="text-luxury-gold/70" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Simulated live feedback typings */}
            {room?.typingAdmin && (
              <div className="flex justify-start">
                <div className="bg-luxury-charcoal border border-white/5 rounded p-2.5 max-w-[70%]">
                  <div className="flex gap-1.5 items-center justify-center py-1">
                    <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form write input */}
          <form 
            onSubmit={handleSendMessage}
            className="bg-[#0c0c0c] border-t border-white/5 p-3 flex gap-2"
          >
            <input 
              type="text" 
              placeholder="ASK ABOUT OUR CUSTOM PIECES..."
              value={newMsg}
              onChange={(e) => {
                setNewMsg(e.target.value);
              }}
              className="flex-1 bg-luxury-charcoal text-white text-xs border border-white/5 rounded py-2 px-3 focus:outline-none focus:border-luxury-gold/50 placeholder-white/20 uppercase font-mono tracking-wider"
            />
            <button
              type="submit"
              className="bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-black p-2 rounded flex items-center justify-center transition-colors cursor-pointer"
            >
              <Send size={13} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
