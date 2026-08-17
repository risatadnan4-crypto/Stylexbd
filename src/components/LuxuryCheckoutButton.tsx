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
  const courierPersonRef = useRef<HTMLDivElement>(null);

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
    if (courierPersonRef.current) gsap.killTweensOf(courierPersonRef.current);

    gsap.set(btn, { rotateX: 0, rotateY: 0, scale: 1 });
    const defState = btn.querySelector('.state-default');
    const loadState = btn.querySelector('.state-loading');
    const succState = btn.querySelector('.state-success');
    const progTrack = btn.querySelector('.progress-track');

    if (defState) gsap.set(defState, { opacity: 1, y: 0 });
    if (loadState) gsap.set(loadState, { opacity: 0, y: 8 });
    if (succState) gsap.set(succState, { opacity: 0, scale: 0.92 });
    if (progTrack) gsap.set(progTrack, { width: '0%', opacity: 1 });

    if (vanRef.current) gsap.set(vanRef.current, { left: '-160px', opacity: 1 });
    if (courierPersonRef.current) gsap.set(courierPersonRef.current, { opacity: 0, scale: 0.8, x: 0, y: 0 });
    if (packageRef.current) gsap.set(packageRef.current, { opacity: 0, scale: 0.8, left: '0px', top: '0px' });
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
      '#D4AF37', // luxury gold
      '#F3E8FF', // purple pure highlight
      '#A855F7', // vivid royal purple
      '#EC4899', // rose sheen
      '#FDE047', // warm gold spark
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

    // 4. Animate Courier Vehicle & Courier Delivery Person loading product
    if (vanRef.current && wBackRef.current && wFrontRef.current) {
      // Setup elements initial positions
      gsap.set(vanRef.current, { left: '-160px', opacity: 1 });
      if (courierPersonRef.current) gsap.set(courierPersonRef.current, { opacity: 0, scale: 0.8, x: -10, y: 0 });
      if (packageRef.current) gsap.set(packageRef.current, { opacity: 0, scale: 0.7, left: '38%', top: '22px' });

      // Rapid wheel spin
      gsap.to([wBackRef.current, wFrontRef.current], {
        rotate: 1080,
        duration: 1.2,
        ease: 'power2.out'
      });

      // Van chassis vibration
      gsap.to(vanRef.current.querySelector('.van-body-svg'), {
        y: -1.5,
        repeat: 18,
        yoyo: true,
        duration: 0.1,
        ease: 'power1.inOut'
      });

      // Phase 1: Courier Car arrives and stops in the middle
      gsap.to(vanRef.current, {
        left: '42%',
        duration: 1.2,
        ease: 'power3.out',
        onComplete: () => {
          // Phase 2: Courier person appears holding product box
          if (courierPersonRef.current && packageRef.current) {
            gsap.to(courierPersonRef.current, {
              opacity: 1,
              scale: 1,
              x: 0,
              duration: 0.35,
              ease: 'back.out(1.5)'
            });

            gsap.to(packageRef.current, {
              opacity: 1,
              scale: 1,
              left: '37%',
              top: '18px',
              duration: 0.35,
              ease: 'power2.out'
            });

            // Person lifts and places product into courier van trunk/cargo
            setTimeout(() => {
              // Person animation: step forward and hands placing parcel
              gsap.to(courierPersonRef.current, {
                x: 12,
                y: -2,
                duration: 0.6,
                ease: 'power2.inOut'
              });

              // Parcel lifts up and moves into vehicle cargo area
              gsap.to(packageRef.current, {
                left: '46%',
                top: '8px',
                scale: 0.85,
                rotate: 20,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: () => {
                  // Parcel slides cleanly into van
                  gsap.to(packageRef.current, {
                    scale: 0.4,
                    opacity: 0,
                    left: '49%',
                    top: '14px',
                    duration: 0.35,
                    ease: 'power2.in'
                  });

                  // Person waves / steps back and fades smoothly
                  gsap.to(courierPersonRef.current, {
                    opacity: 0,
                    x: -4,
                    scale: 0.85,
                    duration: 0.4,
                    delay: 0.1,
                    ease: 'power2.in'
                  });

                  // Phase 3: Wheels spin again and Courier Car drives off quickly
                  setTimeout(() => {
                    gsap.to([wBackRef.current, wFrontRef.current], {
                      rotate: '+=1440',
                      duration: 1.2,
                      ease: 'power2.in'
                    });

                    gsap.to(vanRef.current, {
                      left: '120%',
                      duration: 1.1,
                      ease: 'power3.in'
                    });
                  }, 250);
                }
              });
            }, 450);
          }
        }
      });
    }

    // 5. Success State transition after 3.8s
    setTimeout(() => {
      triggerSuccessAnimation();
    }, 3800);
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
          height: 60px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(147, 51, 234, 0.45) 25%, rgba(88, 28, 135, 0.6) 50%, rgba(30, 10, 50, 0.88) 75%, rgba(6, 2, 12, 0.98) 100%);
          backdrop-filter: blur(28px) saturate(210%) brightness(110%);
          -webkit-backdrop-filter: blur(28px) saturate(210%) brightness(110%);
          border: 1.5px solid rgba(216, 180, 254, 0.65);
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
              0 16px 40px rgba(0, 0, 0, 0.92), 
              0 0 35px rgba(168, 85, 247, 0.5),
              0 0 16px rgba(192, 132, 252, 0.35),
              inset 0 2px 3px rgba(255, 255, 255, 0.88),
              inset 0 0 20px rgba(168, 85, 247, 0.3),
              inset 0 -2px 4px rgba(0, 0, 0, 0.85);
          
          transform-style: preserve-3d;
          backface-visibility: hidden;
          will-change: transform, box-shadow, border-color, background;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .luxury-btn:hover, .luxury-btn:focus-visible, .luxury-btn.selected {
          border-color: rgba(243, 232, 255, 0.9);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(168, 85, 247, 0.58) 25%, rgba(126, 34, 206, 0.72) 50%, rgba(46, 16, 80, 0.92) 75%, rgba(8, 2, 16, 1) 100%);
          backdrop-filter: blur(32px) saturate(230%) brightness(115%);
          -webkit-backdrop-filter: blur(32px) saturate(230%) brightness(115%);
          box-shadow: 
              0 22px 48px rgba(0, 0, 0, 0.95), 
              0 0 48px rgba(192, 132, 252, 0.75),
              0 0 24px rgba(233, 213, 255, 0.5),
              inset 0 2.5px 5px rgba(255, 255, 255, 0.95),
              inset 0 0 26px rgba(192, 132, 252, 0.45),
              inset 0 -2px 4px rgba(0, 0, 0, 0.9);
          transform: translateY(-2px) scale(1.015);
        }

        .luxury-btn:active {
          border-color: rgba(216, 180, 254, 0.8);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(126, 34, 206, 0.55) 30%, rgba(10, 3, 20, 0.95) 100%);
          box-shadow: 
              0 8px 22px rgba(0, 0, 0, 0.9), 
              0 0 28px rgba(168, 85, 247, 0.55),
              inset 0 1.5px 3px rgba(255, 255, 255, 0.75),
              inset 0 0 16px rgba(0, 0, 0, 0.85);
          transform: scale(0.985);
        }

        @media (max-width: 640px) {
          .viewport-3d {
            width: 100% !important;
            max-width: 100% !important;
            padding: 2px 0 !important;
          }
          .luxury-btn {
            height: 54px !important;
            border-radius: 9999px !important;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(147, 51, 234, 0.48) 25%, rgba(88, 28, 135, 0.62) 50%, rgba(30, 10, 50, 0.9) 75%, rgba(6, 2, 12, 0.98) 100%) !important;
            backdrop-filter: blur(24px) saturate(210%) brightness(110%) !important;
            -webkit-backdrop-filter: blur(24px) saturate(210%) brightness(110%) !important;
            border: 1.5px solid rgba(216, 180, 254, 0.65) !important;
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.92), 0 0 30px rgba(168, 85, 247, 0.5), inset 0 2px 3px rgba(255, 255, 255, 0.85), inset 0 0 18px rgba(168, 85, 247, 0.28) !important;
            touch-action: manipulation;
          }
          .label-text {
            font-size: 12.5px !important;
            font-weight: 800 !important;
            letter-spacing: 2px !important;
            color: #FFFFFF !important;
            -webkit-text-fill-color: #FFFFFF !important;
            background: none !important;
            text-shadow: 0 1px 6px rgba(0, 0, 0, 0.9) !important;
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
            width: 16px !important;
            height: 16px !important;
            stroke-width: 2.8 !important;
            stroke: #FAF5FF !important;
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
            font-size: 13px !important;
            letter-spacing: 2.2px !important;
            white-space: nowrap !important;
          }
          .subtext-success {
            font-size: 9.5px !important;
            letter-spacing: 1.2px !important;
            white-space: nowrap !important;
          }
          .vector-checkmark {
            width: 18px !important;
            height: 18px !important;
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
            box-shadow: 0 14px 36px rgba(0, 0, 0, 0.92), 0 0 25px rgba(168, 85, 247, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.8), inset 0 0 16px rgba(147, 51, 234, 0.2); 
            border-color: rgba(216, 180, 254, 0.55); 
          }
          50% { 
            transform: translateZ(6px) scale(1.008); 
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.95), 0 0 42px rgba(192, 132, 252, 0.65), 0 0 15px rgba(233, 213, 255, 0.4), inset 0 2.5px 4px rgba(255, 255, 255, 0.92), inset 0 0 22px rgba(168, 85, 247, 0.35); 
            border-color: rgba(243, 232, 255, 0.85); 
          }
        }

        .lens-sapphire {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(216, 180, 254, 0.15) 30%, rgba(88, 28, 135, 0.12) 60%, rgba(0, 0, 0, 0.45) 100%);
          border-radius: inherit;
          pointer-events: none;
          z-index: 2;
        }

        .raycast-glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at var(--ray-x, 50%) var(--ray-y, 50%), rgba(255, 255, 255, 0.45) 0%, rgba(192, 132, 252, 0.35) 30%, transparent 65%);
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
              rgba(255, 255, 255, 0.25) 30%, 
              rgba(255, 255, 255, 0.85) 50%, 
              rgba(216, 180, 254, 0.5) 65%, 
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
          background: linear-gradient(90deg, rgba(30, 10, 50, 0) 0%, rgba(168, 85, 247, 0.5) 100%);
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
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: #FFFFFF;
          -webkit-text-fill-color: #FFFFFF;
          background: none;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
        }
        .icon-arrow svg {
          width: 14px;
          height: 14px;
          stroke: #E9D5FF;
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
          top: -6px;
          width: 140px;
          height: 75px;
          transform: scale(0.55);
          transform-origin: bottom center;
          will-change: transform;
        }
        .wheel {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 7px;
          will-change: transform;
        }
        .wheel-back { left: 22px; }
        .wheel-front { left: 97px; }

        .cargo-package {
          position: absolute;
          left: 45px;
          top: 18px;
          width: 18px;
          height: 18px;
          opacity: 0;
          perspective: 1000px;
          z-index: 8;
          will-change: transform, opacity;
        }
        .cargo-geometry {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #180a29 0%, #2e1065 100%);
          border: 1px solid #E9D5FF;
          box-shadow: 
              0 8px 20px rgba(0, 0, 0, 0.95),
              0 0 15px rgba(192, 132, 252, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          transform: rotateX(25deg) rotateY(35deg);
        }
        .cargo-brand {
          font-size: 8px;
          font-weight: 900;
          color: #F5D0FE;
          text-shadow: 0 0 6px #C084FC;
          letter-spacing: 0.5px;
        }

        .courier-person {
          position: absolute;
          left: 24%;
          top: 4px;
          width: 32px;
          height: 48px;
          z-index: 7;
          opacity: 0;
          pointer-events: none;
          transform-origin: bottom center;
          will-change: transform, opacity;
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
            {/* High-Fidelity Yellow Delivery Van (from Reference Image) */}
            <svg className="van-body-svg w-full h-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)]" viewBox="0 0 160 80" fill="none">
              {/* Main Yellow Van Body */}
              <path 
                d="M 12 18 
                   C 12 14, 16 11, 24 11 
                   L 105 11 
                   C 114 11, 126 18, 134 27 
                   L 146 40 
                   C 152 46, 154 50, 152 56 
                   L 150 58 
                   L 12 58 
                   Z" 
                fill="#FFB81C" 
              />

              {/* Roof Shading / Highlight */}
              <path 
                d="M 22 11 L 105 11 C 113 11, 122 17, 130 25 L 128 27 C 121 19, 112 13, 104 13 L 22 13 Z" 
                fill="#FFD54F" 
                opacity="0.7" 
              />

              {/* Bottom Dark Trim / Rocker Panel */}
              <path 
                d="M 12 49 
                   L 20 49 
                   C 20 49, 21 40, 36 40 
                   C 51 40, 52 49, 52 49 
                   L 104 49 
                   C 104 49, 105 40, 120 40 
                   C 135 40, 136 49, 136 49 
                   L 151 49 
                   L 150 58 
                   L 12 58 
                   Z" 
                fill="#2B2B2B" 
              />

              {/* Yellow Wheel Arch Moldings */}
              <path 
                d="M 18 49 C 19 38, 53 38, 54 49" 
                stroke="#FFB81C" 
                strokeWidth="3.5" 
                fill="none" 
              />
              <path 
                d="M 102 49 C 103 38, 137 38, 138 49" 
                stroke="#FFB81C" 
                strokeWidth="3.5" 
                fill="none" 
              />

              {/* Cabin Window Frame & Glass */}
              <path 
                d="M 97 16 
                   L 124 16 
                   C 127 16, 130 19, 133 24 
                   L 137 34 
                   C 138 36, 137 38, 134 38 
                   L 97 38 
                   C 95 38, 94 36, 94 34 
                   L 94 19 
                   C 94 17, 95 16, 97 16 Z" 
                fill="#FFFFFF" 
                stroke="#E5A00D" 
                strokeWidth="1.2" 
              />

              {/* Inside Cabin: Driver Seat Headrest */}
              <rect x="96" y="24" width="4.5" height="10" rx="2" fill="#1F2937" />

              {/* Inside Cabin: Driver Character (Red cap, Red shirt, smiling) */}
              {/* Driver Red Shirt Body */}
              <path d="M 98 38 L 102 31 L 114 31 L 118 38 Z" fill="#DC2626" />
              {/* Driver Neck & Face */}
              <circle cx="109" cy="24" r="5" fill="#FED7AA" />
              {/* Smiling eyes & mouth */}
              <path d="M 109 25 Q 112 28 114 25" stroke="#9A3412" strokeWidth="0.8" fill="none" />
              <circle cx="111" cy="23" r="0.8" fill="#1F2937" />
              {/* Red Cap with visor */}
              <ellipse cx="109" cy="20" rx="5.5" ry="2.5" fill="#DC2626" />
              <path d="M 104 20 C 104 16, 114 16, 114 20 Z" fill="#B91C1C" />
              <path d="M 109 20 L 116 21 L 114 22 Z" fill="#991B1B" />
              {/* Driver Arm reaching to steering wheel */}
              <path d="M 108 34 L 119 32 L 123 30" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
              {/* Steering Wheel */}
              <line x1="123" y1="26" x2="120" y2="35" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="121.5" cy="30.5" rx="1.5" ry="4" fill="none" stroke="#111827" strokeWidth="1" />

              {/* Side Mirror */}
              <rect x="135" y="32" width="3.5" height="6" rx="1" fill="#FFA000" stroke="#CC8000" strokeWidth="0.5" />

              {/* Door Cut Line */}
              <path d="M 92 16 L 92 48" stroke="#E5A00D" strokeWidth="1" strokeDasharray="1 1" />
              <circle cx="95" cy="40" r="1" fill="#B45309" />

              {/* Bold White DELIVERY Text */}
              <text 
                x="40" 
                y="33" 
                fill="#FFFFFF" 
                fontSize="10.5" 
                fontWeight="900" 
                fontFamily="system-ui, -apple-system, sans-serif" 
                letterSpacing="1.2"
              >
                DELIVERY
              </text>

              {/* Front Headlight (Almond/Curved Yellow-White) */}
              <path 
                d="M 142 38 
                   C 148 42, 151 46, 149 50 
                   L 138 49 
                   Z" 
                fill="#FFFDE7" 
                stroke="#FFD54F" 
                strokeWidth="0.8" 
                className="drop-shadow-[0_0_6px_#FFF9C4]" 
              />

              {/* Rear Vertical Red Taillight */}
              <rect x="11" y="34" width="3.5" height="12" rx="1" fill="#DC2626" />
              <rect x="11" y="38" width="3.5" height="4" fill="#FCA5A5" opacity="0.6" />
            </svg>

            {/* Rear Alloy Wheel */}
            <div className="wheel wheel-back" ref={wBackRef}>
              <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {/* Black Rubber Tire */}
                <circle cx="12" cy="12" r="11" fill="#1C1917" stroke="#292524" strokeWidth="1" />
                {/* Silver Rim Edge */}
                <circle cx="12" cy="12" r="8" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1" />
                {/* Wheel Hub Center */}
                <circle cx="12" cy="12" r="3.5" fill="#4B5563" />
                <circle cx="12" cy="12" r="1.5" fill="#E5E7EB" />
                {/* 5 Silver Twin Spokes */}
                <line x1="12" y1="4" x2="12" y2="20" stroke="#9CA3AF" strokeWidth="1.5" />
                <line x1="4.4" y1="9.5" x2="19.6" y2="14.5" stroke="#9CA3AF" strokeWidth="1.5" />
                <line x1="4.4" y1="14.5" x2="19.6" y2="9.5" stroke="#9CA3AF" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Front Alloy Wheel */}
            <div className="wheel wheel-front" ref={wFrontRef}>
              <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {/* Black Rubber Tire */}
                <circle cx="12" cy="12" r="11" fill="#1C1917" stroke="#292524" strokeWidth="1" />
                {/* Silver Rim Edge */}
                <circle cx="12" cy="12" r="8" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1" />
                {/* Wheel Hub Center */}
                <circle cx="12" cy="12" r="3.5" fill="#4B5563" />
                <circle cx="12" cy="12" r="1.5" fill="#E5E7EB" />
                {/* 5 Silver Twin Spokes */}
                <line x1="12" y1="4" x2="12" y2="20" stroke="#9CA3AF" strokeWidth="1.5" />
                <line x1="4.4" y1="9.5" x2="19.6" y2="14.5" stroke="#9CA3AF" strokeWidth="1.5" />
                <line x1="4.4" y1="14.5" x2="19.6" y2="9.5" stroke="#9CA3AF" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Courier Person matching driver (Red uniform & Cap) loading the package */}
          <div className="courier-person" ref={courierPersonRef}>
            <svg viewBox="0 0 36 54" className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" fill="none">
              {/* Courier Cap */}
              <ellipse cx="18" cy="8" rx="7" ry="3" fill="#DC2626" stroke="#FECACA" strokeWidth="0.6" />
              <path d="M12 8 C12 4, 24 4, 24 8 Z" fill="#B91C1C" />
              <path d="M20 8 L29 10 L26 12 L19 10 Z" fill="#991B1B" />
              {/* Head / Face */}
              <circle cx="18" cy="14" r="5" fill="#FED7AA" />
              <circle cx="20" cy="13" r="0.8" fill="#1F2937" />
              <path d="M 18 16 Q 20 18 22 16" stroke="#9A3412" strokeWidth="0.7" fill="none" />
              {/* Uniform / Jacket (Red) */}
              <path d="M12 19 L24 19 L26 36 L10 36 Z" fill="#DC2626" stroke="#B91C1C" strokeWidth="0.75" />
              {/* White Collar / Badge */}
              <polygon points="18,19 16.5,23 18,25 19.5,23" fill="#FFFFFF" />
              {/* Arms reaching forward carrying product box */}
              <path d="M12 21 C8 24, 10 30, 24 29" stroke="#B91C1C" strokeWidth="3" strokeLinecap="round" />
              <circle cx="25" cy="29" r="2" fill="#FED7AA" />
              {/* Pants (Dark Gray/Navy) */}
              <rect x="12" y="36" width="5" height="13" rx="1.5" fill="#1F2937" />
              <rect x="19" y="36" width="5" height="13" rx="1.5" fill="#1F2937" />
              {/* Shoes */}
              <ellipse cx="14" cy="50" rx="3.5" ry="2" fill="#09090B" />
              <ellipse cx="22" cy="50" rx="3.5" ry="2" fill="#09090B" />
            </svg>
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
