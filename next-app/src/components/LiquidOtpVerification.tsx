'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Droplets,
  ShieldCheck,
  ArrowRight,
  Waves,
} from 'lucide-react';
import './liquid-otp.css';

export interface LiquidOtpProps {
  length?: number;
  title?: string;
  subtitle?: string;
  targetEmailOrPhone?: string;
  theme?: 'ocean' | 'emerald' | 'violet';
  onVerify?: (otp: string) => Promise<{ success: boolean; error?: string }> | void;
  onResend?: () => Promise<void> | void;
  cooldownSeconds?: number;
  autoFocus?: boolean;
}

export default function LiquidOtpVerification({
  length = 6,
  title = 'Security Verification',
  subtitle = 'Enter the 6-digit verification code sent to your authorized contact.',
  targetEmailOrPhone = 'user@example.com',
  theme = 'ocean',
  onVerify,
  onResend,
  cooldownSeconds = 45,
  autoFocus = true,
}: LiquidOtpProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(cooldownSeconds);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Calculate liquid fill percentage
  const filledCount = digits.filter((d) => d !== '').length;
  const liquidPercent = Math.round((filledCount / length) * 100);

  // Resend cooldown timer
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Initial focus
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  // Add click ripple effect
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev.slice(-4), newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  // Perform Verification
  const executeVerification = useCallback(
    async (codeToVerify: string) => {
      setStatus('verifying');
      setErrorMessage(null);

      try {
        if (onVerify) {
          const res = await onVerify(codeToVerify);
          if (res && !res.success) {
            setStatus('error');
            setErrorMessage(res.error || 'Invalid verification code. Please check and try again.');
            return;
          }
        } else {
          // Default demo simulation
          await new Promise((r) => setTimeout(r, 1200));
          if (codeToVerify === '000000') {
            setStatus('error');
            setErrorMessage('Demo simulation: 000000 triggers an intentional error.');
            return;
          }
        }

        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.message || 'Verification failed. Please retry.');
      }
    },
    [onVerify]
  );

  // Handle single digit changes
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric inputs
    const cleanVal = value.replace(/[^0-9]/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...digits];

    if (cleanVal.length > 1) {
      // User pasted multiple characters into a single box
      const pastedChars = cleanVal.slice(0, length).split('');
      pastedChars.forEach((char, i) => {
        if (index + i < length) {
          newDigits[index + i] = char;
        }
      });
      setDigits(newDigits);
      const nextIdx = Math.min(index + pastedChars.length, length - 1);
      setActiveIndex(nextIdx);
      inputRefs.current[nextIdx]?.focus();

      if (newDigits.every((d) => d !== '')) {
        executeVerification(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = cleanVal;
    setDigits(newDigits);
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage(null);
    }

    if (cleanVal && index < length - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify if full
    if (newDigits.every((d) => d !== '')) {
      executeVerification(newDigits.join(''));
    }
  };

  // Handle key events (backspace, arrows)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Clipboard Paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (!pasteData) return;

    const newDigits = [...digits];
    pasteData.slice(0, length).split('').forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);

    const nextIdx = Math.min(pasteData.length, length - 1);
    setActiveIndex(nextIdx);
    inputRefs.current[nextIdx]?.focus();

    if (newDigits.every((d) => d !== '')) {
      executeVerification(newDigits.join(''));
    }
  };

  // Handle Resend Trigger
  const handleResendClick = async () => {
    if (!canResend || status === 'verifying') return;
    setTimer(cooldownSeconds);
    setCanResend(false);
    setErrorMessage(null);
    setStatus('idle');
    setDigits(Array(length).fill(''));
    setActiveIndex(0);
    inputRefs.current[0]?.focus();

    if (onResend) {
      await onResend();
    }
  };

  // Reset form
  const handleReset = () => {
    setDigits(Array(length).fill(''));
    setActiveIndex(0);
    setStatus('idle');
    setErrorMessage(null);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className={`lotp-container lotp-theme-${theme}`}>
      <motion.div
        className="lotp-card"
        onClick={handleCardClick}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          x: status === 'error' ? [-6, 6, -4, 4, -2, 2, 0] : 0,
        }}
        transition={{
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {/* Top glowing shimmer line */}
        <div className="lotp-top-glow" />

        {/* Dynamic Water Ripples on Click */}
        {ripples.map((r) => (
          <span
            key={r.id}
            className="lotp-ripple-wave"
            style={{
              left: `${r.x}px`,
              top: `${r.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Liquid Chamber Indicator */}
        <div
          className={`lotp-liquid-chamber ${
            status === 'success' ? 'is-success' : status === 'error' ? 'is-error' : ''
          }`}
        >
          {/* Liquid Water Container */}
          <div
            className={`lotp-water-body ${
              status === 'success' ? 'water-success' : status === 'error' ? 'water-error' : ''
            }`}
            style={{ height: `${status === 'success' ? 100 : Math.max(liquidPercent, 12)}%` }}
          >
            {/* Wave 1 SVG */}
            <svg
              className="lotp-wave-svg"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,-20 1200,40 L1200,120 L0,120 Z" />
            </svg>

            {/* Wave 2 SVG (Back layer with delay) */}
            <svg
              className="lotp-wave-svg lotp-wave-svg-back"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0,20 C200,100 450,-20 700,60 C950,140 1050,0 1200,30 L1200,120 L0,120 Z" />
            </svg>

            {/* Rising Bubbles */}
            <span className="lotp-bubble" style={{ left: '20%', width: 5, height: 5 }} />
            <span className="lotp-bubble" style={{ left: '55%', width: 7, height: 7, animationDelay: '1.1s' }} />
            <span className="lotp-bubble" style={{ left: '80%', width: 4, height: 4, animationDelay: '0.6s' }} />
          </div>

          {/* Chamber Center Content */}
          <div className="lotp-chamber-content">
            {status === 'success' ? (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 className="w-9 h-9 text-white drop-shadow-md" />
              </motion.div>
            ) : status === 'verifying' ? (
              <RotateCw className="w-7 h-7 text-white animate-spin" />
            ) : (
              <>
                <span className="lotp-percentage-text">{liquidPercent}%</span>
                <span className="lotp-percentage-sub">Liquid</span>
              </>
            )}
          </div>
        </div>

        {/* Card Header */}
        <div className="lotp-header">
          <h2 className="lotp-title">{title}</h2>
          <p className="lotp-subtitle">{subtitle}</p>
          {targetEmailOrPhone && (
            <div className="lotp-target-badge">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{targetEmailOrPhone}</span>
            </div>
          )}
        </div>

        {/* OTP Input Row */}
        <div className="lotp-inputs-row" onPaste={handlePaste}>
          {digits.map((digit, index) => {
            const isActive = activeIndex === index;
            const isInvalid = status === 'error';
            const isValid = status === 'success';

            return (
              <div key={index} className="lotp-box-wrapper">
                {isActive && status === 'idle' && (
                  <motion.div
                    className="lotp-droplet-indicator"
                    layoutId="droplet"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  disabled={status === 'verifying' || status === 'success'}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={() => setActiveIndex(index)}
                  className={`lotp-input-box ${digit ? 'has-value' : ''} ${
                    isInvalid ? 'is-invalid' : ''
                  } ${isValid ? 'is-valid' : ''}`}
                  aria-label={`Digit ${index + 1} of ${length}`}
                  autoComplete="one-time-code"
                />
              </div>
            );
          })}
        </div>

        {/* Fluid Progress Track Underline */}
        <div className="lotp-track-container" aria-hidden="true">
          <div
            className="lotp-track-fill"
            style={{
              width: `${status === 'success' ? 100 : liquidPercent}%`,
              backgroundColor: status === 'error' ? '#f43f5e' : undefined,
            }}
          />
        </div>

        {/* Feedback Alert Banners */}
        <AnimatePresence mode="wait">
          {status === 'error' && errorMessage && (
            <motion.div
              key="error-banner"
              className="lotp-feedback-banner feedback-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success-banner"
              className="lotp-feedback-banner feedback-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Verification complete! Credentials successfully authorized.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        {status !== 'success' ? (
          <button
            type="button"
            onClick={() => executeVerification(digits.join(''))}
            disabled={status === 'verifying' || digits.some((d) => d === '')}
            className="lotp-verify-btn"
          >
            {status === 'verifying' ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Validating Liquid Key...</span>
              </>
            ) : status === 'error' ? (
              <>
                <span>Retry Verification</span>
                <RotateCw className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Confirm Verification</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="lotp-verify-btn"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Authenticated • Reset Test</span>
          </button>
        )}

        {/* Card Footer: Resend & Timers */}
        <div className="lotp-footer">
          <div className="lotp-resend-row">
            <span>Didn&apos;t receive a code?</span>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendClick}
                className="lotp-resend-btn"
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Resend New OTP</span>
              </button>
            ) : (
              <div className="lotp-timer-pill">
                Resend in {timer}s
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
