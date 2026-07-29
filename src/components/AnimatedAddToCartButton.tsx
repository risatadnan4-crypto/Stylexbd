import React, { useState, useId } from 'react';
import styled from 'styled-components';

interface AnimatedAddToCartButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  addedLabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export default function AnimatedAddToCartButton({
  onClick,
  label = "Add To Cart",
  addedLabel = "Added!",
  className = "",
  size = "md",
  type = "button",
  disabled = false,
}: AnimatedAddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const shadowId = useId().replace(/:/g, '');

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    setIsAdded(true);
    onClick(e);

    // Reset after animation sequence completes
    setTimeout(() => {
      setIsAdded(false);
    }, 2200);
  };

  const defaultText = label;
  const sentText = addedLabel;

  return (
    <StyledWrapper className={className} $size={size}>
      <button
        type={type}
        disabled={disabled}
        onClick={handleClick}
        className={`button ${isAdded ? 'is-added' : ''}`}
      >
        <div className="outline" />
        
        {/* Default state */}
        <div className="state state--default">
          <div className="icon">
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g style={{ filter: `url(#shadow-${shadowId})` }}>
                <path d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z" fill="currentColor" />
                <path d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z" fill="currentColor" />
              </g>
              <defs>
                <filter id={`shadow-${shadowId}`}>
                  <feDropShadow dx={0} dy={1} stdDeviation="0.6" floodOpacity="0.5" />
                </filter>
              </defs>
            </svg>
          </div>
          <p>
            {defaultText.split('').map((char, index) => (
              <span key={index} style={{ '--i': index } as React.CSSProperties}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </p>
        </div>

        {/* Sent / Added state */}
        <div className="state state--sent">
          <div className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="1em" width="1em" strokeWidth="0.5px" stroke="currentColor">
              <g style={{ filter: `url(#shadow-${shadowId})` }}>
                <path fill="currentColor" d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z" />
                <path fill="currentColor" d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z" />
              </g>
            </svg>
          </div>
          <p>
            {sentText.split('').map((char, index) => (
              <span key={index} style={{ '--i': index + 4 } as React.CSSProperties}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </p>
        </div>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $size?: 'sm' | 'md' | 'lg' }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .button {
    --primary: #d4af37;
    --primary-accent: #ff2d55;
    --neutral-1: #1e0a35;
    --neutral-2: #0b0318;
    --radius: 12px;

    cursor: pointer;
    border-radius: var(--radius);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
    border: none;
    box-shadow: 0 0.5px 0.5px 1px rgba(212, 175, 55, 0.25),
      0 10px 20px rgba(0, 0, 0, 0.4), 0 4px 5px 0px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.3s ease;
    width: 100%;
    color: #ffffff;
    height: ${props => props.$size === 'sm' ? '38px' : props.$size === 'lg' ? '50px' : '42px'};
    padding: ${props => props.$size === 'sm' ? '0 10px' : props.$size === 'lg' ? '0 24px' : '0 16px'};
    font-family: inherit;
    font-style: normal;
    font-size: ${props => props.$size === 'sm' ? '10px' : props.$size === 'lg' ? '15px' : '12px'};
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: transparent;
    overflow: hidden;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 0 1px 2px rgba(212, 175, 55, 0.4),
      0 15px 30px rgba(0, 0, 0, 0.5), 0 10px 3px -3px rgba(0, 0, 0, 0.2);
  }

  .button:active:not(:disabled) {
    transform: scale(0.97);
    box-shadow: 0 0 1px 2px rgba(212, 175, 55, 0.3),
      0 10px 3px -3px rgba(0, 0, 0, 0.3);
  }

  .button:after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--radius);
    border: 2px solid transparent;
    background: linear-gradient(135deg, var(--neutral-1), var(--neutral-2)) padding-box,
      linear-gradient(to bottom, rgba(212, 175, 55, 0.6), rgba(154, 77, 255, 0.4)) border-box;
    z-index: 0;
    transition: all 0.4s ease;
  }

  .button:hover:not(:disabled)::after {
    transform: scale(1.03, 1.05);
    box-shadow: inset 0 -1px 5px 0 rgba(212, 175, 55, 0.6);
  }

  .button::before {
    content: "";
    inset: 3px 3px 3px 3px;
    position: absolute;
    background: linear-gradient(135deg, #230d40 0%, #0d031c 100%);
    border-radius: 10px;
    filter: blur(0.5px);
    z-index: 2;
  }

  .state p {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
  }

  .state .icon {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    transform: scale(1.2);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
  }

  .state .icon svg {
    overflow: visible;
  }

  /* Outline */
  .outline {
    position: absolute;
    border-radius: inherit;
    overflow: hidden;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.4s ease;
    inset: -2px -3.5px;
  }

  .outline::before {
    content: "";
    position: absolute;
    inset: -100%;
    background: conic-gradient(
      from 180deg,
      transparent 60%,
      #d4af37 80%,
      transparent 100%
    );
    animation: spin 2s linear infinite;
    animation-play-state: paused;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .button:hover:not(:disabled) .outline {
    opacity: 1;
  }

  .button:hover:not(:disabled) .outline::before {
    animation-play-state: running;
  }

  /* Letters */
  .state p span {
    display: inline-block;
    opacity: 0;
    animation: slideDown 0.8s ease forwards calc(var(--i) * 0.03s);
  }

  .button:hover:not(:disabled) p span {
    opacity: 1;
    animation: wave 0.5s ease forwards calc(var(--i) * 0.02s);
  }

  .button:focus p span,
  .button.is-added p span {
    opacity: 1;
    animation: disapear 0.6s ease forwards calc(var(--i) * 0.03s);
  }

  @keyframes wave {
    30% {
      opacity: 1;
      transform: translateY(3px) translateX(0) rotate(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-3px) translateX(0) rotate(0);
      color: var(--primary);
    }
    100% {
      opacity: 1;
      transform: translateY(0) translateX(0) rotate(0);
    }
  }

  @keyframes slideDown {
    0% {
      opacity: 0;
      transform: translateY(-16px) translateX(4px) rotate(-60deg);
      color: var(--primary);
      filter: blur(4px);
    }
    30% {
      opacity: 1;
      transform: translateY(3px) translateX(0) rotate(0);
      filter: blur(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-2px) translateX(0) rotate(0);
    }
    100% {
      opacity: 1;
      transform: translateY(0) translateX(0) rotate(0);
    }
  }

  @keyframes disapear {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
      transform: translateX(5px) translateY(16px);
      color: var(--primary-accent);
      filter: blur(4px);
    }
  }

  /* Plane */
  .state--default .icon svg {
    animation: land 0.6s ease forwards;
  }

  .button:hover:not(:disabled) .state--default .icon {
    transform: rotate(45deg) scale(1.2);
  }

  .button:focus .state--default svg,
  .button.is-added .state--default svg {
    animation: takeOff 0.8s linear forwards;
  }

  .button:focus .state--default .icon,
  .button.is-added .state--default .icon {
    transform: rotate(0) scale(1.2);
  }

  @keyframes takeOff {
    0% {
      opacity: 1;
    }
    60% {
      opacity: 1;
      transform: translateX(60px) rotate(45deg) scale(1.8);
    }
    100% {
      opacity: 0;
      transform: translateX(140px) rotate(45deg) scale(0);
    }
  }

  @keyframes land {
    0% {
      transform: translateX(-50px) translateY(25px) rotate(-50deg) scale(1.8);
      opacity: 0;
      filter: blur(3px);
    }
    100% {
      transform: translateX(0) translateY(0) rotate(0);
      opacity: 1;
      filter: blur(0);
    }
  }

  /* Contrail */
  .state--default .icon:before {
    content: "";
    position: absolute;
    top: 50%;
    height: 2px;
    width: 0;
    left: -5px;
    background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.6));
  }

  .button:focus .state--default .icon:before,
  .button.is-added .state--default .icon:before {
    animation: contrail 0.8s linear forwards;
  }

  @keyframes contrail {
    0% {
      width: 0;
      opacity: 1;
    }
    8% {
      width: 12px;
    }
    60% {
      opacity: 0.7;
      width: 60px;
    }
    100% {
      opacity: 0;
      width: 140px;
    }
  }

  /* States */
  .state {
    padding-left: 24px;
    z-index: 3;
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
  }

  .state--sent {
    display: none;
    color: #4ade80;
  }

  .state--sent svg {
    transform: scale(1.2);
    margin-right: 6px;
    color: #4ade80;
  }

  .button:focus .state--default,
  .button.is-added .state--default {
    position: absolute;
  }

  .button:focus .state--sent,
  .button.is-added .state--sent {
    display: flex;
  }

  .button:focus .state--sent span,
  .button.is-added .state--sent span {
    opacity: 0;
    animation: slideDown 0.8s ease forwards calc(var(--i) * 0.15s);
  }

  .button:focus .state--sent .icon svg,
  .button.is-added .state--sent .icon svg {
    opacity: 0;
    animation: appear 1s ease forwards 0.6s;
  }

  @keyframes appear {
    0% {
      opacity: 0;
      transform: scale(3) rotate(-40deg);
      color: #4ade80;
      filter: blur(4px);
    }
    30% {
      opacity: 1;
      transform: scale(0.7);
      filter: blur(1px);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;
