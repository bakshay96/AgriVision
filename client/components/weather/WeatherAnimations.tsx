'use client';

import { motion } from 'framer-motion';

// Animated Sun with rays
export function AnimatedSun({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sun center */}
      <motion.circle
        cx="50"
        cy="50"
        r="20"
        fill="url(#sunGradient)"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Animated rays */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const x1 = 50 + Math.cos(angle) * 28;
        const y1 = 50 + Math.sin(angle) * 28;
        const x2 = 50 + Math.cos(angle) * 42;
        const y2 = 50 + Math.sin(angle) * 42;
        
        return (
          <motion.line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#sunGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ opacity: 0.5, pathLength: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5], pathLength: [0.5, 1, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        );
      })}
      
      <defs>
        <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDB813" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Animated Cloud
export function AnimatedCloud({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M25 45C16.7157 45 10 38.2843 10 30C10 21.7157 16.7157 15 25 15C26.5 15 28 15.2 29.3 15.6C31.6 6.8 39.6 0 49.5 0C60.8 0 70.3 8.2 72.3 19.2C73.5 19 74.8 19 76 19C87.6 19 97 28.4 97 40C97 51.6 87.6 61 76 61H25C11.2 61 0 49.8 0 36C0 22.2 11.2 11 25 11"
        fill="url(#cloudGradient)"
        initial={{ x: -5 }}
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <defs>
        <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Animated Rain Cloud
export function AnimatedRainCloud({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cloud */}
      <motion.path
        d="M25 40C16.7 40 10 33.3 10 25C10 16.7 16.7 10 25 10C26.5 10 28 10.2 29.3 10.6C31.6 1.8 39.6 -5 49.5 -5C60.8 -5 70.3 3.2 72.3 14.2C73.5 14 74.8 14 76 14C87.6 14 97 23.4 97 35C97 46.6 87.6 56 76 56H25C11.2 56 0 44.8 0 31C0 17.2 11.2 6 25 6"
        fill="url(#rainCloudGradient)"
        initial={{ x: -3 }}
        animate={{ x: [0, 3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Rain drops */}
      {[...Array(5)].map((_, i) => (
        <motion.line
          key={i}
          x1={25 + i * 12}
          y1="58"
          x2={22 + i * 12}
          y2="68"
          stroke="#60A5FA"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: [0, 1, 0], y: [0, 15, 25] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeIn',
          }}
        />
      ))}
      
      <defs>
        <linearGradient id="rainCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Animated Wind with swaying trees
export function AnimatedWind({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wind lines */}
      {[...Array(3)].map((_, i) => (
        <motion.path
          key={i}
          d={`M10 ${25 + i * 15} Q30 ${20 + i * 15}, 50 ${25 + i * 15} T90 ${25 + i * 15}`}
          stroke="url(#windGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Swaying tree */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '70px 70px' }}
      >
        {/* Tree trunk */}
        <rect x="68" y="50" width="4" height="20" fill="#8B4513" rx="2" />
        {/* Tree foliage */}
        <circle cx="70" cy="45" r="12" fill="#22C55E" />
        <circle cx="62" cy="50" r="8" fill="#16A34A" />
        <circle cx="78" cy="50" r="8" fill="#16A34A" />
      </motion.g>
      
      <defs>
        <linearGradient id="windGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A5F3FC" stopOpacity="0" />
          <stop offset="50%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Weather icon mapper
export function getWeatherAnimation(condition: string, className = '') {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return <AnimatedRainCloud className={className} />;
  }
  if (lowerCondition.includes('cloud')) {
    return <AnimatedCloud className={className} />;
  }
  if (lowerCondition.includes('wind') || lowerCondition.includes('storm')) {
    return <AnimatedWind className={className} />;
  }
  
  // Default to sun
  return <AnimatedSun className={className} />;
}
