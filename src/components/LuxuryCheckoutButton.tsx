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
    } else if (!isCheckingOut && animState !== 'IDLE') {
      resetAnimation();
    }
  }, [isCheckingOut]);

  const resetAnimation = () => {
    setAnimState('IDLE');
    const btn = buttonRef.current;
    if (!btn) return;

    btn.classList.add('idle');

    gsap.killTweensOf(btn);
    if (vanRef.current) gsap.killTweensOf(vanRef.current);
    if (wBackRef.current) gsap.killTweensOf(wBackRef.current);
    if (wFrontRef.current) gsap.killTweensOf(wFrontRef.current);
    if (packageRef.current) gsap.killTweensOf(packageRef.current);

    gsap.set(btn, { rotateX: 0, rotateY: 0, scale: 1 });
    const defState = btn.querySelector('.state-default');
    const loadState = btn.querySelector('.state-loading');
    const succState = btn.querySelector('.state-success');
    const progTrack = btn.querySelector('.progress-track');

    if (defState) gsap.set(defState, { opacity: 1, y: 0 });
    if (loadState) gsap.set(loadState, { opacity: 0, y: 8 });
    if (succState) gsap.set(succState, { opacity: 0, scale: 0.92 });
    if (progTrack) gsap.set(progTrack, { width: '0%', opacity: 1 });

    if (vanRef.current) {
      gsap.set(vanRef.current, { left: '-160px' });
    }
    if (packageRef.current) {
      gsap.set(packageRef.current, { opacity: 0, scale: 0.4 });
    }
  };

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
      '#A855F7', // bright purple
      '#F472B6', // pink-purple highlight
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
          max-width: 480px;
          margin: 0 auto;
          width: 100%;
        }

        .luxury-btn {
          position: relative;
          width: 100%;
          height: 58px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(147, 51, 234, 0.28) 45%, rgba(212, 175, 55, 0.2) 80%, rgba(255, 255, 255, 0.08) 100%);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1.5px solid rgba(233, 213, 255, 0.55);
          border-radius: 9999px;
          cursor: pointer;
          outline: none;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #FFFFFF;
          user-select: none;
          
          box-shadow: 
              0 14px 35px rgba(0, 0, 0, 0.75), 
              0 0 30px rgba(168, 85, 247, 0.35),
              0 0 15px rgba(212, 175, 55, 0.2),
              inset 0 2px 4px rgba(255, 255, 255, 0.7),
              inset 0 -2px 6px rgba(0, 0, 0, 0.5);
          
          transform-style: preserve-3d;
          backface-visibility: hidden;
          will-change: transform, box-shadow, border-color;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .luxury-btn:hover, .luxury-btn:focus-visible, .luxury-btn.selected {
          border-color: rgba(255, 255, 255, 0.85);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(168, 85, 247, 0.38) 45%, rgba(212, 175, 55, 0.28) 80%, rgba(255, 255, 255, 0.12) 100%);
          box-shadow: 
              0 20px 45px rgba(0, 0, 0, 0.85), 
              0 0 40px rgba(192, 132, 252, 0.6),
              0 0 20px rgba(212, 175, 55, 0.35),
              inset 0 2px 5px rgba(255, 255, 255, 0.85),
              inset 0 -2px 6px rgba(0, 0, 0, 0.5);
          transform: translateY(-1px) scale(1.01);
        }

        .luxury-btn:active {
          border-color: rgba(233, 213, 255, 0.95);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(168, 85, 247, 0.45) 50%, rgba(20, 6, 38, 0.3) 100%);
          box-shadow: 
              0 8px 25px rgba(0, 0, 0, 0.8), 
              0 0 35px rgba(192, 132, 252, 0.5),
              inset 0 1.5px 3px rgba(255, 255, 255, 0.6),
              inset 0 -1.5px 3px rgba(0, 0, 0, 0.5);
          transform: scale(0.98);
        }

        @media (max-width: 640px) {
          .viewport-3d {
            width: 100% !important;
            max-width: 100% !important;
            padding: 2px 0 !important;
          }
          .luxury-btn {
            height: 52px !important;
            border-radius: 9999px !important;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(147, 51, 234, 0.32) 45%, rgba(212, 175, 55, 0.22) 80%, rgba(255, 255, 255, 0.1) 100%) !important;
            backdrop-filter: blur(20px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
            border: 1.5px solid rgba(233, 213, 255, 0.65) !important;
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.75), 0 0 25px rgba(168, 85, 247, 0.35), inset 0 1.5px 3px rgba(255, 255, 255, 0.65) !important;
            touch-action: manipulation;
          }
          .label-text {
            font-size: 11.5px !important;
            font-weight: 800 !important;
            letter-spacing: 1.5px !important;
            color: #FFFFFF !important;
            background: linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 50%, #E9D5FF 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9) !important;
            white-space: normal !important;
            text-align: center !important;
            line-height: 1.2 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            max-width: 88% !important;
          }
          .content-plate {
            padding: 0 14px !important;
            left: 0 !important;
            top: 0 !important;
            box-sizing: border-box !important;
          }
          .icon-arrow svg {
            width: 15px !important;
            height: 15px !important;
            stroke-width: 2.8 !important;
            stroke: #F3E8FF !important;
          }
          .delivery-vessel {
            transform: scale(0.48);
            transform-origin: bottom center;
            height: 48px !important;
            top: -2px !important;
          }
          .success-row {
            gap: 8px !important;
          }
          .headline-success {
            font-size: 12.5px !important;
            letter-spacing: 2px !important;
            white-space: nowrap !important;
          }
          .subtext-success {
            font-size: 9px !important;
            letter-spacing: 1px !important;
            white-space: nowrap !important;
          }
          .vector-checkmark {
            width: 17px !important;
            height: 17px !important;
          }
        }

        @media (max-width: 380px) {
          .luxury-btn {
            height: 48px !important;
            border-radius: 9999px !important;
            border: 1.5px solid rgba(233, 213, 255, 0.7) !important;
          }
          .label-text {
            font-size: 10.5px !important;
            letter-spacing: 0.8px !important;
            max-width: 84% !important;
          }
          .delivery-vessel {
            transform: scale(0.42);
            transform-origin: bottom center;
            height: 44px !important;
            top: -3px !important;
          }
        }

        .luxury-btn.idle {
          animation: absolute-luxury-cycle 3.5s infinite ease-in-out;
        }

        @keyframes absolute-luxury-cycle {
          0%, 100% { 
            transform: translateZ(0) scale(1); 
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.75), 0 0 25px rgba(168, 85, 247, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.7); 
            border-color: rgba(233, 213, 255, 0.6); 
          }
          50% { 
            transform: translateZ(6px) scale(1.008); 
            box-shadow: 0 18px 45px rgba(0, 0, 0, 0.85), 0 0 38px rgba(192, 132, 252, 0.65), 0 0 15px rgba(212, 175, 55, 0.3), inset 0 2px 5px rgba(255, 255, 255, 0.85); 
            border-color: rgba(255, 255, 255, 0.85); 
          }
        }

        .lens-sapphire {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(192, 132, 252, 0.08) 40%, rgba(0, 0, 0, 0.3) 100%);
          border-radius: inherit;
          pointer-events: none;
          z-index: 2;
        }

        .raycast-glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at var(--ray-x, 50%) var(--ray-y, 50%), rgba(255, 255, 255, 0.35) 0%, rgba(192, 132, 252, 0.2) 35%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.1, 0.9, 0.1, 1);
          z-index: 1;
        }
        .luxury-btn:hover .raycast-glow { opacity: 1; }

        .satin-sweep {
          position: absolute;
          top: 0;
          left: -160%;
          width: 140%;
          height: 100%;
          background: linear-gradient(90deg, 
              transparent 10%, 
              rgba(192, 132, 252, 0.15) 30%, 
              rgba(255, 255, 255, 0.55) 50%, 
              rgba(212, 175, 55, 0.3) 65%, 
              transparent 90%);
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
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 0 40px;
          box-sizing: border-box;
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
          background: linear-gradient(180deg, #FFFFFF 0%, #E9D5FF 100%);
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
          stroke: #E9D5FF;
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
          color: #E9D5FF;
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

        {/* Delivery Vehicle Runway Animation (Style X Express Vessel) */}
        <div className="theater-runway" aria-hidden="true">
          <div className="delivery-vessel" ref={vanRef}>
            {vesselType === 'CART' ? (
              /* Sleek Aerodynamic Style X Gold Hypercar / Coupe (Step 1 VIP Speed Machine) */
              <svg className="van-body-svg w-full h-full drop-shadow-[0_4px_16px_rgba(192,132,252,0.65)]" viewBox="0 0 160 80" fill="none">
                {/* Hypercar aerodynamic silhouette */}
                <path d="M5 52 C18 52, 28 46, 48 34 C68 22, 100 20, 118 26 C134 31, 150 42, 156 48 C159 51, 159 55, 152 55 L5 55 Z" fill="url(#hypercarGrad)" stroke="#C084FC" strokeWidth="1.75" />
                {/* Glass canopy roof */}
                <path d="M54 31 C70 19, 96 17, 112 25 C102 25, 68 28, 54 31 Z" fill="#0c051a" stroke="#C084FC" strokeWidth="1.2" />
                {/* Side window tint */}
                <path d="M60 30 C72 22, 92 21, 104 25 C90 25, 70 27, 60 30 Z" fill="#24103e" opacity="0.9" />
                {/* Gold body side accent / racing line */}
                <path d="M22 47 Q72 41 146 47" stroke="#C084FC" strokeWidth="1.2" strokeDasharray="4 1.5" />
                {/* Rear spoiler wing */}
                <path d="M6 38 L22 36 L24 42 L8 42 Z" fill="#7c3aed" stroke="#C084FC" strokeWidth="0.8" />
                {/* Branding text */}
                <text x="48" y="47" fill="#FFFFFF" fontSize="9" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.5">STYLE X</text>
                <text x="96" y="47" fill="#C084FC" fontSize="7.5" fontWeight="800" fontFamily="sans-serif" letterSpacing="0.8">VIP</text>
                {/* Hyper Xenon Headlight Beam */}
                <circle cx="154" cy="49" r="3" fill="#E9D5FF" className="drop-shadow-[0_0_12px_#E9D5FF]" />
                {/* Red LED Taillight Bar */}
                <rect x="5" y="47" width="8" height="3" rx="1.5" fill="#EF4444" className="drop-shadow-[0_0_8px_#EF4444]" />
                <defs>
                  <linearGradient id="hypercarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0c0617" />
                    <stop offset="35%" stopColor="#2a1444" />
                    <stop offset="70%" stopColor="#130826" />
                    <stop offset="100%" stopColor="#080310" />
                  </linearGradient>
                </defs>
              </svg>
            ) : (
              /* Style X Express Heavy Freight Delivery Vessel (Step 2 Final Order) */
              <svg className="van-body-svg w-full h-full drop-shadow-[0_4px_12px_rgba(192,132,252,0.4)]" viewBox="0 0 160 80" fill="none">
                <path d="M10 50 L25 25 L65 20 L110 20 L145 38 L155 50 L155 60 L10 60 Z" fill="url(#vanGrad)" stroke="#C084FC" strokeWidth="1.5" />
                <path d="M70 24 L105 24 L132 38 L70 38 Z" fill="#120c1f" stroke="#C084FC" strokeWidth="1" />
                <text x="32" y="48" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">STYLE X</text>
                <text x="80" y="48" fill="#C084FC" fontSize="8" fontWeight="800" fontFamily="sans-serif" letterSpacing="0.5">EXPRESS</text>
                <circle cx="150" cy="46" r="3" fill="#E9D5FF" className="drop-shadow-[0_0_8px_#E9D5FF]" />
                <rect x="12" y="44" width="10" height="3" rx="1.5" fill="#EF4444" />
                <defs>
                  <linearGradient id="vanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0c0617" />
                    <stop offset="50%" stopColor="#1a0f2e" />
                    <stop offset="100%" stopColor="#080310" />
                  </linearGradient>
                </defs>
              </svg>
            )}
            <div className="wheel wheel-back" ref={wBackRef}>
              <svg viewBox="0 0 20 20" className="w-full h-full text-luxury-gold drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]">
                <circle cx="10" cy="10" r="9" fill="#080310" stroke="#C084FC" strokeWidth="2" />
                <circle cx="10" cy="10" r="4" fill="#C084FC" />
                <line x1="10" y1="1" x2="10" y2="19" stroke="#C084FC" strokeWidth="1.5" />
                <line x1="1" y1="10" x2="19" y2="10" stroke="#C084FC" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="wheel wheel-front" ref={wFrontRef}>
              <svg viewBox="0 0 20 20" className="w-full h-full text-luxury-gold drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]">
                <circle cx="10" cy="10" r="9" fill="#080310" stroke="#C084FC" strokeWidth="2" />
                <circle cx="10" cy="10" r="4" fill="#C084FC" />
                <line x1="10" y1="1" x2="10" y2="19" stroke="#C084FC" strokeWidth="1.5" />
                <line x1="1" y1="10" x2="19" y2="10" stroke="#C084FC" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          <div className="cargo-package" ref={packageRef}>
            <div className="cargo-geometry">
              <span className="cargo-brand">SX</span>
            </div>
          </div>
        </div>

        <canvas id="fx-canvas" ref={canvasRef} className="canvas-particles"></canvas>
      </button>
    </div>
  );
}
