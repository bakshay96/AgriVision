'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, animate } from 'framer-motion';

interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1.2,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  
  const stringValue = String(value);
  const hasDigits = /\d/.test(stringValue);
  
  let prefix = '';
  let suffix = '';
  let targetVal = 0;
  let decimals = 0;
  
  if (hasDigits) {
    const cleanStr = stringValue.replace(/,/g, '');
    const prefixMatch = cleanStr.match(/^[^\d.-]+/);
    prefix = prefixMatch ? prefixMatch[0] : '';
    
    const suffixMatch = cleanStr.match(/[^\d.]+$/);
    suffix = suffixMatch ? suffixMatch[0] : '';
    
    const numStr = cleanStr.replace(/^[^\d.-]+|[^\d.]+$/g, '');
    targetVal = parseFloat(numStr);
    if (isNaN(targetVal)) targetVal = 0;
    
    const dotIndex = numStr.indexOf('.');
    if (dotIndex !== -1) {
      decimals = numStr.length - dotIndex - 1;
    }
  }

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 25,
    stiffness: 90,
  });

  useEffect(() => {
    if (!hasDigits) return;
    const controls = animate(motionValue, targetVal, {
      duration: duration,
      ease: 'easeOut',
    });
    return () => controls.stop();
  }, [targetVal, duration, motionValue, hasDigits]);

  useEffect(() => {
    if (!hasDigits) {
      if (ref.current) ref.current.textContent = stringValue;
      return;
    }
    
    return springValue.on('change', (latest) => {
      if (ref.current) {
        let formattedNum = '';
        if (decimals > 0) {
          formattedNum = latest.toFixed(decimals);
        } else {
          formattedNum = Math.floor(latest).toLocaleString('en-IN');
        }
        ref.current.textContent = `${prefix}${formattedNum}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix, decimals, hasDigits, stringValue]);

  return (
    <span ref={ref} className={className}>
      {hasDigits ? `${prefix}0${suffix}` : stringValue}
    </span>
  );
}
