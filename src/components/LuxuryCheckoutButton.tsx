import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface LuxuryCheckoutButtonProps {
  isCheckingOut: boolean;
  disabled: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  vesselType?: 'CAR' | 'CART';
}

export default function LuxuryCheckoutButton({
  isCheckingOut,
  disabled,
  onClick,
  label = "Confirm Order",
  vesselType = 'CAR'
}: LuxuryCheckoutButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vanRef = useRef<HTMLDivElement>(null);
  const wBackRef = useRef<HTMLDivElement>(null);
  const wFrontRef = useRef<HTMLDivElement>(null);
  const packageRef = useRef<HTMLDivElement>(null);

  const [animState, setAnimState] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');

  // Sync internal state with external isCheckingOut prop
  useEffect(() => {
    if (isCheckingOut && animState === 'IDLE') {
      triggerLoadingAnimation();
    }
  }, [isCheckingOut]);

  // Particle System Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      decay: number;
    }> = [];

    const handleResize = () => {
      canvas.width = canvas.offsetWidth || 390;
      canvas.height = canvas.offsetHeight || 66;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const colors = [
      '#C084FC', // purple-royal
      '#E9D5FF', // purple-pure
      '#EAD080', // gold-mid
      '#FFF0D0', // gold-pure
    ];

    const createParticle = (x: number, y: number, count = 1) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2 - 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015,
        });
      }
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ambient sparks if idle and hovered
      if (animState === 'IDLE' && buttonRef.current && buttonRef.current.matches(':hover')) {
        const rect = buttonRef.current.getBoundingClientRect();
        // Emit a few ambient particles
        createParticle(Math.random() * canvas.width, canvas.height - 2, 1);
      }

      // Lots of sparks if loading
      if (animState === 'LOADING') {
        // Emit sparks along the progress or behind the van
        if (vanRef.current) {
          const vanRect = vanRef.current.getBoundingClientRect();
          const btnRect = canvas.getBoundingClientRect();
          const vanX = vanRect.left - btnRect.left + 24; // wheel position
          const vanY = vanRect.top - btnRect.top + 50;
          if (vanX > 0 && vanX < canvas.width) {
            createParticle(vanX, vanY, 2);
          }
        }
      }

      particles.forEach((p, idx) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animateParticles);
    };

    animateParticles();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [animState]);

  // 3D Parallax Event Listeners
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (animState !== 'IDLE' || !buttonRef.current || !containerRef.current) return;

    const btn = buttonRef.current;
    const rect = btn.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width) * 100;
    const ry = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--ray-x', `${rx}%`);
    btn.style.setProperty('--ray-y', `${ry}%`);

    const bounding = containerRef.current.getBoundingClientRect();
    const xc = (e.clientX - bounding.left - bounding.width / 2) / (bounding.width / 2);
    const yc = (e.clientY - bounding.top - bounding.height / 2) / (bounding.height / 2);

    gsap.to(btn, {
      rotateX: -yc * 9,
      rotateY: xc * 11,
      duration: 0.6,
      ease: 'power3.out'
    });
  };

  const handleMouseEnter = () => {
    if (animState !== 'IDLE' || !buttonRef.current) return;
    gsap.to(buttonRef.current, { scale: 1.015, duration: 0.5, ease: 'power4.out' });
    gsap.to(buttonRef.current.querySelector('.satin-sweep'), {
      left: '160%',
      duration: 1.25,
      ease: 'power3.inOut',
      overwrite: 'auto'
    });
  };

  const handleMouseLeave = () => {
    if (animState !== 'IDLE' || !buttonRef.current) return;
    gsap.to(buttonRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.8,
      ease: 'power3.out'
    });
    // Reset satin sweep position
    gsap.set(buttonRef.current.querySelector('.satin-sweep'), { left: '-160%' });
  };

  // Run the full cinematic pipeline
  const triggerLoadingAnimation = () => {
    setAnimState('LOADING');
    const btn = buttonRef.current;
    if (!btn) return;

    // Remove idle animation class
    btn.classList.remove('idle');

    // 1. Reset 3D transformation for action mode
    gsap.to(btn, { rotateX: 0, rotateY: 0, scale: 0.98, duration: 0.4, ease: 'power2.out' });

    // 2. Hide default content and show loading text
    gsap.to(btn.querySelector('.state-default'), { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' });
    gsap.to(btn.querySelector('.state-loading'), { opacity: 1, y: 0, duration: 0.3, delay: 0.1, ease: 'power2.out' });

    // 3. Animate progress bar track width
    gsap.to(btn.querySelector('.progress-track'), {
      width: '100%',
      duration: 3.5,
      ease: 'power1.inOut'
    });

    // 4. Animate Delivery Van Driving Across the Runway
    if (vanRef.current && wBackRef.current && wFrontRef.current) {
      // Rapid wheel spin
      gsap.to([wBackRef.current, wFrontRef.current], {
        rotate: 1440,
        duration: 3.2,
        ease: 'power1.inOut'
      });

      // Van chassis bounding rattle / micro-bounce
      gsap.to(vanRef.current.querySelector('.van-body-svg'), {
        y: -1.5,
        repeat: 14,
        yoyo: true,
        duration: 0.12,
        ease: 'power1.inOut'
      });

      // Drive across track
      gsap.to(vanRef.current, {
        left: '60%',
        duration: 2.2,
        ease: 'power2.inOut',
        onComplete: () => {
          // Release cargo package in the middle
          if (packageRef.current) {
            gsap.set(packageRef.current, {
              left: '60%',
              top: '12px',
              scale: 0.4,
              opacity: 0,
              rotate: 0
            });
            // Ejection trajectory
            gsap.to(packageRef.current, {
              opacity: 1,
              scale: 1,
              left: '72%',
              top: '4px',
              rotate: 360,
              duration: 0.8,
              ease: 'power2.out',
              onComplete: () => {
                // Fade package into background track
                gsap.to(packageRef.current, {
                  opacity: 0,
                  scale: 0.3,
                  y: 6,
                  duration: 0.4,
                  ease: 'power2.in'
                });
              }
            });
          }

          // Complete the van drive off
          gsap.to(vanRef.current, {
            left: '115%',
            duration: 1.2,
            delay: 0.2,
            ease: 'power2.in'
          });
        }
      });
    }

    // 5. Success State transition after 3.6s
    setTimeout(() => {
      triggerSuccessAnimation();
    }, 3600);
  };

  const triggerSuccessAnimation = () => {
    setAnimState('SUCCESS');
    const btn = buttonRef.current;
    if (!btn) return;

    // Fade out loading content and progress bar
    gsap.to(btn.querySelector('.state-loading'), { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' });
    gsap.to(btn.querySelector('.progress-track'), { opacity: 0, duration: 0.4 });

    // Transition in Success Plates
    gsap.to(btn.querySelector('.state-success'), {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'back.out(1.7)'
    });

    // SVG checkmark dash array animation
    const ring = btn.querySelector('.checkmark-ring');
    const path = btn.querySelector('.checkmark-path');
    if (ring && path) {
      gsap.to(ring, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' });
      gsap.to(path, { strokeDashoffset: 0, duration: 0.6, delay: 0.3, ease: 'power2.out' });
    }
  };

  return (
    <div 
      className="viewport-3d w-full select-none" 
      id="scene-3d-context" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Inline luxury styled properties scoped to this widget component */}
      <style>{`
        .viewport-3d {
          position: relative;
          padding: 4px 0;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
          perspective: 2000px;
          transform-style: preserve-3d;
          max-width: 440px;
          margin: 0 auto;
          width: 100%;
        }

        @media (max-height: 850px) {
          .viewport-3d {
            padding: 2px 0 !important;
          }
          .luxury-btn {
            height: 52px !important;
            border-radius: 26px !important;
          }
          .delivery-vessel {
            transform: scale(0.48) !important;
            height: 52px !important;
            top: -2px !important;
          }
          .label-text {
            font-size: 10.5px !important;
            letter-spacing: 2px !important;
          }
        }

        .luxury-btn {
          position: relative;
          width: 100%;
          height: 60px;
          background: #060408;
          border: 0.75px solid rgba(192, 132, 252, 0.3);
          border-radius: 30px;
          cursor: pointer;
          outline: none;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #FFFFFF;
          user-select: none;
          
          box-shadow: 
              0 12px 30px rgba(0, 0, 0, 0.95), 
              0 0 0 1px rgba(0, 0, 0, 1),
              inset 0 1.5px 2px rgba(233, 213, 255, 0.25),
              inset 0 -1.5px 3px rgba(0, 0, 0, 0.95);
          
          transform-style: preserve-3d;
          backface-visibility: hidden;
          will-change: transform, box-shadow, border-color;
          transition: border-color 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .luxury-btn:hover, .luxury-btn:focus-visible, .luxury-btn.selected {
          border-color: rgba(234, 208, 128, 0.85);
          box-shadow: 
              0 18px 36px rgba(0, 0, 0, 0.95), 
              0 0 25px rgba(234, 208, 128, 0.35),
              inset 0 1.5px 3px rgba(255, 240, 208, 0.35),
              inset 0 -1.5px 3px rgba(0, 0, 0, 0.95);
        }

        .luxury-btn:active {
          border-color: rgba(212, 175, 55, 1);
          box-shadow: 
              0 10px 20px rgba(0, 0, 0, 0.95), 
              0 0 30px rgba(212, 175, 55, 0.55),
              inset 0 1.5px 3px rgba(255, 240, 208, 0.5),
              inset 0 -1.5px 3px rgba(0, 0, 0, 0.95);
          transform: scale(0.985);
        }

        @media (max-width: 480px) {
          .luxury-btn {
            height: 52px;
            border-radius: 26px;
          }
          .label-text {
            font-size: 10px !important;
            letter-spacing: 2px !important;
          }
          .content-plate {
            padding: 0 12px !important;
          }
          .delivery-vessel {
            transform: scale(0.48);
            transform-origin: bottom center;
            height: 52px !important;
            top: -2px !important;
          }
          .success-row {
            gap: 6px !important;
          }
          .headline-success {
            font-size: 11px !important;
            letter-spacing: 2.5px !important;
          }
          .subtext-success {
            font-size: 8px !important;
            letter-spacing: 1px !important;
          }
          .vector-checkmark {
            width: 14px !important;
            height: 14px !important;
          }
        }

        @media (max-width: 360px) {
          .luxury-btn {
            height: 46px;
            border-radius: 23px;
          }
          .label-text {
            font-size: 9px !important;
            letter-spacing: 1.5px !important;
          }
          .delivery-vessel {
            transform: scale(0.42);
            transform-origin: bottom center;
            height: 46px !important;
            top: -4px !important;
          }
          .headline-success {
            font-size: 10px !important;
            letter-spacing: 1.5px !important;
          }
          .subtext-success {
            font-size: 7px !important;
            letter-spacing: 0.8px !important;
          }
        }

        .luxury-btn.idle {
          animation: absolute-luxury-cycle 5s infinite ease-in-out;
        }

        @keyframes absolute-luxury-cycle {
          0%, 100% { 
            transform: translateZ(0) scale(1); 
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.95), 0 0 30px rgba(192, 132, 252, 0.15); 
            border-color: rgba(192, 132, 252, 0.3); 
          }
          50% { 
            transform: translateZ(12px) scale(1.008); 
            box-shadow: 0 25px 55px rgba(0, 0, 0, 1), 0 0 55px rgba(234, 208, 128, 0.55); 
            border-color: rgba(234, 208, 128, 0.7); 
          }
        }

        .lens-sapphire {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(192, 132, 252, 0.04) 50%, rgba(0, 0, 0, 0.75) 100%);
          border-radius: inherit;
          pointer-events: none;
          z-index: 2;
        }

        .raycast-glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at var(--ray-x, 50%) var(--ray-y, 50%), rgba(233, 213, 255, 0.25) 0%, transparent 45%);
          opacity: 0;
          transition: opacity 0.4s cubic-bezier(0.1, 0.9, 0.1, 1);
          z-index: 1;
        }
        .luxury-btn:hover .raycast-glow { opacity: 1; }

        .satin-sweep {
          position: absolute;
          top: 0;
          left: -160%;
          width: 130%;
          height: 100%;
          background: linear-gradient(90deg, 
              transparent 15%, 
              rgba(192, 132, 252, 0.1) 35%, 
              rgba(255, 255, 255, 0.4) 50%, 
              rgba(234, 208, 128, 0.25) 65%, 
              transparent 85%);
          transform: skewX(-25deg);
          z-index: 3;
        }

        .progress-track {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, rgba(6, 4, 8, 0) 0%, rgba(192, 132, 252, 0.3) 100%);
          z-index: 1;
          pointer-events: none;
          will-change: width;
        }

        .canvas-particles {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 4;
        }

        .content-plate {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 0 40px;
          z-index: 5;
          pointer-events: none;
          will-change: opacity, transform;
        }

        .state-default { opacity: 1; gap: 14px; }
        .label-text {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 4px;
          background: linear-gradient(180deg, #FFFFFF 0%, #FFF0D0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
        }
        .icon-arrow svg {
          width: 14px;
          height: 14px;
          stroke: #C084FC;
          stroke-width: 2.5;
          transition: transform 0.5s cubic-bezier(0.1, 0.9, 0.1, 1);
        }
        .luxury-btn:hover .icon-arrow svg {
          transform: translateX(8px);
          stroke: #EAD080;
        }

        .state-loading { opacity: 0; transform: translateY(8px); }
        .state-loading .label-text {
          background: linear-gradient(180deg, #FFFFFF 0%, rgba(233, 213, 255, 0.45) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .theater-runway {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 6;
          overflow: hidden;
          pointer-events: none;
        }

        .delivery-vessel {
          position: absolute;
          left: -160px;
          top: -5px;
          width: 135px;
          height: 78px;
          transform: scale(0.55);
          transform-origin: bottom center;
          will-change: transform;
        }
        .wheel {
          position: absolute;
          width: 16px;
          height: 16px;
          bottom: 5px;
          will-change: transform;
        }
        .wheel-back { left: 24px; }
        .wheel-front { left: 93px; }

        .cargo-package {
          position: absolute;
          left: 45px;
          top: 18px;
          width: 16px;
          height: 16px;
          opacity: 0;
          perspective: 1000px;
          z-index: 5;
          will-change: transform, opacity;
        }
        .cargo-geometry {
          width: 100%;
          height: 100%;
          background: #0b0711;
          border: 0.85px solid #C084FC;
          box-shadow: 
              0 15px 35px rgba(0, 0, 0, 0.95),
              0 0 20px rgba(192, 132, 252, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          transform: rotateX(35deg) rotateY(42deg);
        }
        .cargo-brand {
          font-size: 8.5px;
          font-weight: 800;
          color: #FFF0D0;
          text-shadow: 0 0 8px #C084FC;
        }

        .state-success {
          opacity: 0;
          flex-direction: column;
          gap: 4px;
          transform: scale(0.92);
        }
        .success-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .headline-success {
          font-size: 14.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 5px;
          background: linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 20%, #C084FC 65%, #701A75 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 4px 15px rgba(192, 132, 252, 0.65));
        }
        .subtext-success {
          font-size: 9px;
          color: rgba(233, 213, 255, 0.6);
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .vector-checkmark {
          width: 19px;
          height: 19px;
          stroke: #C084FC;
          stroke-width: 4.5;
        }
        .checkmark-ring {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 4.5;
          stroke: #C084FC;
          fill: none;
        }
        .checkmark-path {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
        }
      `}</style>

      <button 
        ref={buttonRef}
        type="submit"
        disabled={disabled || animState !== 'IDLE'}
        onClick={onClick}
        className="luxury-btn idle" 
        aria-label={label}
      >
        <div className="raycast-glow"></div>
        <div className="lens-sapphire"></div>
        <div className="satin-sweep"></div>
        <div className="progress-track"></div>

        {/* Active Default Interface State */}
        <div className="content-plate state-default">
          <span className="label-text flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-luxury-gold shrink-0 drop-shadow-[0_0_8px_rgba(212,175,55,0.8)] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" fill="#d4af37" />
              <circle cx="18.5" cy="18.5" r="2.5" fill="#d4af37" />
            </svg>
            <span>{label}</span>
          </span>
          <span className="icon-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>

        {/* Optimized Hyper-Fast Processing State */}
        <div className="content-plate state-loading" aria-hidden="true">
          <span className="label-text">Preparing your order...</span>
        </div>

        {/* Cinema Runway Theater Properties */}
        <div className="theater-runway" aria-hidden="true">
          <div className="delivery-vessel" id="van-model" ref={vanRef}>
            <svg className="van-body-svg" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="70" cy="63" rx="48" ry="2" fill="rgba(0,0,0,0.95)"/>
              
              {vesselType === 'CAR' ? (
                <>
                  {/* Chameleon Liquid Titanium Dynamic Coating Chassis */}
                  <path d="M12 16H95V55H12V16Z" fill="#050308" stroke="url(#liquid-metallic-chameleon)" strokeWidth="0.95"/>
                  <path d="M95 23H110L124 37V55H95V23Z" fill="#08050D" stroke="url(#liquid-metallic-chameleon)" strokeWidth="0.95"/>
                  <path d="M106 26H114L119 34H106V26Z" fill="#020104" stroke="rgba(233,213,255,0.2)" strokeWidth="0.5"/>
                  
                  <line x1="12" y1="45" x2="95" y2="45" stroke="rgba(192, 132, 252, 0.45)" strokeWidth="0.5"/>
                  
                  {/* Laser Engraved Core Logo Matrix */}
                  <text x="32" y="36" fill="url(#gold-mirror-matrix)" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700" fontSize="11" letterSpacing="1">Style X</text>
                  
                  <g id="van-door">
                    <rect x="5" y="18" width="2.5" height="35" fill="#030105" stroke="rgba(233, 213, 255, 0.4)" strokeWidth="0.5"/>
                  </g>
                </>
              ) : (
                <>
                  {/* Premium Luxury Shopping Cart Wireframe Basket */}
                  {/* Main Outer Rim & Frame */}
                  <path d="M25 20 H98 L85 48 H35 Z" fill="#050308" stroke="url(#liquid-metallic-chameleon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  
                  {/* Slanted Handle */}
                  <path d="M25 20 L15 14 H8" stroke="url(#liquid-metallic-chameleon)" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="14" r="2.5" fill="url(#gold-mirror-matrix)"/>
                  
                  {/* Sleek Under-chassis Base Bar */}
                  <path d="M24 55 H93" stroke="url(#liquid-metallic-chameleon)" strokeWidth="1.5" strokeLinecap="round"/>
                  
                  {/* Struts connecting basket to base */}
                  <path d="M35 48 L24 55" stroke="url(#liquid-metallic-chameleon)" strokeWidth="1.5"/>
                  <path d="M85 48 L93 55" stroke="url(#liquid-metallic-chameleon)" strokeWidth="1.5"/>
                  <path d="M55 48 L24 55" stroke="rgba(192, 132, 252, 0.3)" strokeWidth="1"/>
                  <path d="M70 48 L93 55" stroke="rgba(192, 132, 252, 0.3)" strokeWidth="1"/>
                  
                  {/* Elegant Basket Grid Lines for Swiss/Modern Tech feel */}
                  {/* Horizontals */}
                  <line x1="28" y1="28" x2="94" y2="28" stroke="rgba(192, 132, 252, 0.4)" strokeWidth="0.8" />
                  <line x1="31" y1="38" x2="89" y2="38" stroke="rgba(192, 132, 252, 0.4)" strokeWidth="0.8" />
                  
                  {/* Verticals */}
                  <line x1="43" y1="20" x2="43" y2="48" stroke="rgba(192, 132, 252, 0.4)" strokeWidth="0.8" />
                  <line x1="61" y1="20" x2="61" y2="48" stroke="rgba(192, 132, 252, 0.4)" strokeWidth="0.8" />
                  <line x1="79" y1="20" x2="79" y2="48" stroke="rgba(192, 132, 252, 0.4)" strokeWidth="0.8" />
                  
                  {/* Laser Engraved Style X Logo on a gold-rimmed center plate */}
                  <rect x="38" y="24" width="46" height="18" rx="3" fill="#08050D" stroke="url(#gold-mirror-matrix)" strokeWidth="0.75" />
                  <text x="43" y="37" fill="url(#gold-mirror-matrix)" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontWeight="900" fontSize="8" letterSpacing="0.8">STYLE X</text>
                  
                  {/* Glowing Luxury Cargo Items inside the cart */}
                  <path d="M48 20 L58 12 L68 20 Z" fill="#08050D" stroke="#EAD080" strokeWidth="0.75"/>
                  <path d="M68 20 L74 15 L80 20 Z" fill="#08050D" stroke="#C084FC" strokeWidth="0.75"/>
                </>
              )}
              
              <defs>
                <linearGradient id="liquid-metallic-chameleon" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#C084FC"/>
                  <stop offset="35%" stopColor="#E9D5FF"/>
                  <stop offset="70%" stopColor="#EAD080"/>
                  <stop offset="100%" stopColor="#701A75"/>
                </linearGradient>
                <linearGradient id="gold-mirror-matrix" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="50%" stopColor="#FFF0D0"/>
                  <stop offset="100%" stopColor="#EAD080"/>
                </linearGradient>
              </defs>
            </svg>
            {/* Engineering Wheel Matrix */}
            <div className="wheel wheel-back" id="w-back" ref={wBackRef}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="#030205" stroke="#C084FC" strokeWidth="1.35"/><circle cx="12" cy="12" r="4.5" fill="#09060F" stroke="#EAD080" strokeWidth="0.5"/><circle cx="12" cy="12" r="1" fill="#FFFFFF"/></svg>
            </div>
            <div className="wheel wheel-front" id="w-front" ref={wFrontRef}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="#030205" stroke="#C084FC" strokeWidth="1.35"/><circle cx="12" cy="12" r="4.5" fill="#09060F" stroke="#EAD080" strokeWidth="0.5"/><circle cx="12" cy="12" r="1" fill="#FFFFFF"/></svg>
            </div>
          </div>

          {/* 3D Kinetic Spin Ejection Object */}
          <div className="cargo-package" id="package-model" ref={packageRef}>
            <div className="cargo-geometry">
              <span className="cargo-brand">X</span>
            </div>
          </div>
        </div>

        {/* Complete Confirmed Order State (Amethyst Imperial Luxury) */}
        <div className="content-plate state-success" aria-hidden="true">
          <div className="success-row">
            <svg className="vector-checkmark" viewBox="0 0 52 52">
              <circle className="checkmark-ring" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <span className="headline-success">Order Confirmed</span>
          </div>
          <span className="subtext-success">Thank you for shopping with Style X</span>
        </div>

        <canvas id="fx-canvas" ref={canvasRef} className="canvas-particles"></canvas>
      </button>
    </div>
  );
}
