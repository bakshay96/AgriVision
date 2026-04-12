'use client';

import { motion } from 'framer-motion';

// ============================================
// WEATHER BACKGROUND GRADIENTS
// Returns gradient classes based on weather condition
// ============================================
export function getWeatherBackground(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  
  // Sunny/Clear - Warm golden to orange
  if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
    return 'from-amber-400 via-orange-400 to-rose-400';
  }
  
  // Partly Cloudy - Soft blue to light gray
  if (lowerCondition.includes('partly') || lowerCondition.includes('scattered')) {
    return 'from-sky-300 via-blue-300 to-slate-300';
  }
  
  // Cloudy/Overcast - Gray tones
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return 'from-slate-400 via-gray-400 to-zinc-500';
  }
  
  // Rain/Drizzle - Blue to indigo
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return 'from-blue-500 via-indigo-500 to-slate-600';
  }
  
  // Thunderstorm - Dark purple to slate
  if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
    return 'from-slate-700 via-purple-800 to-indigo-900';
  }
  
  // Snow - Light blue to white
  if (lowerCondition.includes('snow') || lowerCondition.includes('sleet') || lowerCondition.includes('ice')) {
    return 'from-blue-100 via-cyan-200 to-slate-300';
  }
  
  // Fog/Mist - Gray to slate
  if (lowerCondition.includes('fog') || lowerCondition.includes('mist') || lowerCondition.includes('haze')) {
    return 'from-slate-300 via-gray-400 to-zinc-400';
  }
  
  // Wind - Teal to cyan
  if (lowerCondition.includes('wind')) {
    return 'from-teal-400 via-cyan-400 to-sky-500';
  }
  
  // Default - Blue gradient
  return 'from-blue-400 via-sky-400 to-cyan-400';
}

// Get glass card gradient based on weather
export function getWeatherCardGradient(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
    return 'from-amber-500/80 to-orange-600/80';
  }
  if (lowerCondition.includes('partly') || lowerCondition.includes('scattered')) {
    return 'from-sky-500/80 to-blue-600/80';
  }
  if (lowerCondition.includes('cloud')) {
    return 'from-slate-500/80 to-gray-600/80';
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return 'from-blue-600/80 to-indigo-700/80';
  }
  if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
    return 'from-slate-700/90 to-purple-900/90';
  }
  if (lowerCondition.includes('snow')) {
    return 'from-blue-300/80 to-cyan-400/80';
  }
  if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
    return 'from-slate-400/80 to-gray-500/80';
  }
  return 'from-blue-500/80 to-indigo-600/80';
}

// ============================================
// ANIMATED COMPONENTS
// ============================================

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

// Animated Partly Cloudy (Sun + Cloud)
export function AnimatedPartlyCloudy({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sun in background */}
      <motion.circle
        cx="70"
        cy="30"
        r="15"
        fill="url(#sunGradient)"
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Sun rays */}
      {[...Array(6)].map((_, i) => {
        const angle = (i * 60 + 30) * (Math.PI / 180);
        const x1 = 70 + Math.cos(angle) * 20;
        const y1 = 30 + Math.sin(angle) * 20;
        const x2 = 70 + Math.cos(angle) * 28;
        const y2 = 30 + Math.sin(angle) * 28;
        
        return (
          <motion.line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#FDB813"
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          />
        );
      })}
      
      {/* Cloud in foreground */}
      <motion.path
        d="M15 55C8.9 55 4 50.1 4 44C4 37.9 8.9 33 15 33C16.2 33 17.4 33.15 18.5 33.45C20.4 26.4 26.8 21 34.6 21C43.4 21 50.9 27.6 52.6 36.3C53.6 36.15 54.7 36.15 55.8 36.15C65.5 36.15 73.4 44.05 73.4 53.75C73.4 63.45 65.5 71.35 55.8 71.35H15C3.5 71.35 -5.5 61.35 -5.5 49.85C-5.5 38.35 3.5 28.35 15 28.35"
        fill="url(#partlyCloudGradient)"
        initial={{ x: -3 }}
        animate={{ x: [0, 4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <defs>
        <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDB813" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="partlyCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Animated Thunderstorm
export function AnimatedThunderstorm({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dark cloud */}
      <motion.path
        d="M20 45C12 45 5 38 5 30C5 22 12 15 20 15C21.5 15 23 15.2 24.5 15.5C27 6 35.5 0 46 0C57.5 0 67.5 8.5 69.5 20C70.8 19.8 72.2 19.8 73.5 19.8C85.5 19.8 95 29.3 95 41.3C95 53.3 85.5 62.8 73.5 62.8H20C7 62.8 -5 50.8 -5 37.8C-5 24.8 7 12.8 20 12.8"
        fill="url(#stormCloudGradient)"
        initial={{ x: -2 }}
        animate={{ x: [0, 3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Lightning bolt */}
      <motion.path
        d="M45 65 L38 80 L48 80 L42 95"
        stroke="#FCD34D"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{ 
          opacity: [0, 1, 0, 1, 0],
          pathLength: [0, 1, 1, 1, 1]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          times: [0, 0.1, 0.2, 0.3, 1],
          ease: 'easeInOut'
        }}
      />
      
      {/* Rain drops */}
      {[...Array(4)].map((_, i) => (
        <motion.line
          key={i}
          x1={25 + i * 15}
          y1="65"
          x2={22 + i * 15}
          y2="78"
          stroke="#64748B"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: [0, 1, 0], y: [0, 12, 20] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.25,
            ease: 'easeIn',
          }}
        />
      ))}
      
      <defs>
        <linearGradient id="stormCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Animated Snow
export function AnimatedSnow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cloud */}
      <motion.path
        d="M25 40C16.7 40 10 33.3 10 25C10 16.7 16.7 10 25 10C26.5 10 28 10.2 29.3 10.6C31.6 1.8 39.6 -5 49.5 -5C60.8 -5 70.3 3.2 72.3 14.2C73.5 14 74.8 14 76 14C87.6 14 97 23.4 97 35C97 46.6 87.6 56 76 56H25C11.2 56 0 44.8 0 31C0 17.2 11.2 6 25 6"
        fill="url(#snowCloudGradient)"
        initial={{ x: -3 }}
        animate={{ x: [0, 3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Snowflakes */}
      {[...Array(5)].map((_, i) => (
        <motion.g key={i}>
          <motion.circle
            cx={20 + i * 15}
            cy="60"
            r="3"
            fill="#E0F2FE"
            initial={{ opacity: 0, y: -10 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              y: [0, 25, 35, 45],
              x: [0, (i % 2 === 0 ? 5 : -5), 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        </motion.g>
      ))}
      
      <defs>
        <linearGradient id="snowCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Animated Fog/Mist
export function AnimatedFog({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fog lines */}
      {[...Array(5)].map((_, i) => (
        <motion.rect
          key={i}
          x="5"
          y={20 + i * 12}
          width="90"
          height="6"
          rx="3"
          fill="url(#fogGradient)"
          initial={{ opacity: 0.3, x: -10 }}
          animate={{ 
            opacity: [0.3, 0.7, 0.3],
            x: [-10, 10, -10]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Partial sun/moon behind fog */}
      <motion.circle
        cx="75"
        cy="25"
        r="12"
        fill="#FCD34D"
        opacity="0.5"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      <defs>
        <linearGradient id="fogGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0" />
          <stop offset="30%" stopColor="#94A3B8" />
          <stop offset="70%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Weather icon mapper
export function getWeatherAnimation(condition: string, className = '') {
  const lowerCondition = condition.toLowerCase();
  
  // Thunderstorm - highest priority
  if (lowerCondition.includes('thunder') || lowerCondition.includes('storm') || lowerCondition.includes('lightning')) {
    return <AnimatedThunderstorm className={className} />;
  }
  
  // Snow
  if (lowerCondition.includes('snow') || lowerCondition.includes('sleet') || lowerCondition.includes('ice') || lowerCondition.includes('blizzard')) {
    return <AnimatedSnow className={className} />;
  }
  
  // Rain
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
    return <AnimatedRainCloud className={className} />;
  }
  
  // Fog/Mist
  if (lowerCondition.includes('fog') || lowerCondition.includes('mist') || lowerCondition.includes('haze')) {
    return <AnimatedFog className={className} />;
  }
  
  // Partly Cloudy
  if (lowerCondition.includes('partly') || lowerCondition.includes('scattered') || lowerCondition.includes('broken')) {
    return <AnimatedPartlyCloudy className={className} />;
  }
  
  // Cloudy/Overcast
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <AnimatedCloud className={className} />;
  }
  
  // Wind
  if (lowerCondition.includes('wind') || lowerCondition.includes('breeze') || lowerCondition.includes('gale')) {
    return <AnimatedWind className={className} />;
  }
  
  // Default to sun (clear/sunny)
  return <AnimatedSun className={className} />;
}
