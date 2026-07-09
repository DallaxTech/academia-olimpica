'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 2800); // Animation duration + small buffer

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: "easeInOut" }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
        >
          {/* Animated Background Glow */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.2, 1],
              opacity: [0, 0.15, 0.1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute w-[500px] h-[500px] bg-primary rounded-full blur-[120px] pointer-events-none"
          />

          <div className="relative flex flex-col items-center">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0 
              }}
              transition={{ 
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1] // Custom ease-out
              }}
              className="mb-8"
            >
              <div className="relative w-24 h-24 flex items-center justify-center rounded-2xl bg-primary shadow-[0_0_40px_rgba(var(--primary),0.3)]">
                <motion.div
                  initial={{ rotate: -45, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-primary-foreground font-black text-5-xl"
                >
                  <svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="m6.7 10.1 5.3 5.3 5.3-5.3" />
                    <path d="m6.7 5 5.3 5.3 5.3-5.3" />
                  </svg>
                </motion.div>
                
                {/* Orbital Rings */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-10px] border-2 border-primary/20 rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-20px] border border-primary/10 rounded-full"
                />
              </div>
            </motion.div>

            {/* Text Animation */}
            <div className="overflow-hidden flex flex-col items-center">
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl font-black tracking-tighter text-foreground mb-2 font-headline"
              >
                OLIMPO
              </motion.h1>
              
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 1, ease: "easeInOut" }}
                className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"
              />
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="mt-4 text-sm font-medium tracking-[0.3em] uppercase"
              >
                Academia Olímpica
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
