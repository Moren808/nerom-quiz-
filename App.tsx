import React, { useState, useEffect, useRef } from 'react';
import { QUESTIONS, RESULT_MESSAGES, ROASTS } from './constants';
import { AppState } from './types';
import { ThemeToggle } from './components/ThemeToggle';
import { ProgressBar } from './components/ProgressBar';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useAnimation } from 'framer-motion';
import { ChevronRight, Share2, RefreshCw, Sparkles, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- AUDIO ENGINE ---
// Simple procedural audio using Web Audio API to avoid loading external assets
const useAudio = () => {
  const [enabled, setEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTone = (freq: number, type: 'sine' | 'square' | 'triangle', duration: number, startTime: number = 0) => {
    if (!enabled || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime + startTime;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.start(now);
    osc.stop(now + duration);
  };

  const playSound = (type: 'click' | 'correct' | 'wrong' | 'win' | 'start') => {
    if (!enabled) return;
    initAudio();
    
    switch (type) {
      case 'click':
        playTone(800, 'sine', 0.1);
        break;
      case 'correct':
        playTone(600, 'sine', 0.1);
        playTone(1200, 'sine', 0.3, 0.1);
        break;
      case 'wrong':
        playTone(150, 'square', 0.3); // Lower, funnier wrong sound
        playTone(100, 'square', 0.4, 0.1);
        break;
      case 'start':
        playTone(400, 'sine', 0.2);
        playTone(600, 'sine', 0.4, 0.1);
        playTone(800, 'sine', 0.8, 0.2);
        break;
      case 'win':
        [0, 0.1, 0.2, 0.3].forEach((delay, i) => {
          playTone(400 + (i * 100), 'sine', 0.3, delay);
        });
        break;
    }
  };

  return { playSound, isSoundEnabled: enabled, toggleSound: () => setEnabled(!enabled) };
};

// --- HAPTICS ---
const triggerHaptic = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// --- 3D TILT COMPONENT ---
const TiltCard = ({ children, className }: { children?: React.ReactNode, className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;
    x.set(mouseXFromCenter / width);
    y.set(mouseYFromCenter / height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`perspective-1000 ${className}`}
    >
      {children}
    </motion.div>
  );
};

// --- ANIMATED COUNTER ---
const AnimatedCounter = ({ value }: { value: number }) => {
  const count = useSpring(0, { duration: 2000, bounce: 0 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    count.set(value);
    const unsubscribe = count.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return () => unsubscribe();
  }, [value, count]);

  return <span>{displayValue}</span>;
};

// --- ANIMATION VARIANTS ---
const resultContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.15
    }
  }
};

const resultItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 12, stiffness: 100 }
  }
};


function App() {
  const [appState, setAppState] = useState<AppState>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [roast, setRoast] = useState<string | null>(null);
  
  const { playSound, isSoundEnabled, toggleSound } = useAudio();
  const shakeControls = useAnimation();
  const currentQuestion = QUESTIONS[currentQuestionIndex];

  const handleStart = () => {
    playSound('start');
    triggerHaptic(20);
    setAppState('quiz');
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOptionId(null);
    setIsAnswerRevealed(false);
    setRoast(null);
  };

  const handleOptionSelect = (optionId: string) => {
    if (isAnswerRevealed) return;

    setSelectedOptionId(optionId);
    setIsAnswerRevealed(true);

    const isCorrect = currentQuestion.options.find(opt => opt.id === optionId)?.isCorrect;
    
    if (isCorrect) {
      playSound('correct');
      triggerHaptic([10, 30, 10]); // Success pattern
      setScore(prev => prev + 1);
      setRoast(null);
    } else {
      playSound('wrong');
      triggerHaptic(50); // Error bump
      
      // Trigger shake animation
      shakeControls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { type: "spring", stiffness: 500, damping: 15 }
      });

      // Set random roast
      const randomRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
      setRoast(randomRoast);
    }
  };

  const handleNext = () => {
    playSound('click');
    triggerHaptic(10);
    
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setIsAnswerRevealed(false);
      setSelectedOptionId(null);
      setRoast(null);
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppState('loading');
      setTimeout(() => {
        setAppState('result');
        if (score > 7) {
          playSound('win');
          
          const duration = 3000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

          const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            confetti({
              ...defaults, 
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
              ...defaults, 
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
          }, 250);
        }
      }, 2000);
    }
  };

  const getResultMessage = (finalScore: number) => {
    if (finalScore >= 8) return RESULT_MESSAGES.high;
    if (finalScore >= 5) return RESULT_MESSAGES.mid;
    return RESULT_MESSAGES.low;
  };

  const handleShare = async () => {
    playSound('click');
    const text = `I scored ${score}/${QUESTIONS.length} on "How Well Do You Know Nerom?". Can you beat me?`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'How Well Do You Know Nerom?',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      alert("Score copied to clipboard!");
    }
  };

  const getOptionClass = (optionId: string, isCorrect: boolean) => {
    const baseClass = "relative p-6 text-lg font-semibold rounded-2xl transition-all duration-300 border-2 text-center h-full flex items-center justify-center w-full backdrop-blur-sm shadow-sm group preserve-3d";
    
    if (isAnswerRevealed) {
      if (isCorrect) {
        // Correct answer (Greenish/Teal)
        return `${baseClass} border-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)] scale-[1.02]`;
      } 
      if (selectedOptionId === optionId && !isCorrect) {
        // Wrong selection (Red/Rose)
        return `${baseClass} border-rose-400 bg-rose-50/80 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300`;
      }
      // Dimmed
      return `${baseClass} border-transparent bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 opacity-50 blur-[1px] scale-95`;
    }

    // Default / Hover State
    if (selectedOptionId === optionId) {
      return `${baseClass} border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-md scale-[1.02]`;
    }
    
    return `${baseClass} border-white/60 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-white/90 dark:hover:bg-slate-800/80 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-1 hover:scale-[1.01] text-slate-700 dark:text-slate-200`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-300 dark:bg-primary-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-20 w-96 h-96 bg-indigo-300 dark:bg-indigo-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-96 h-96 bg-pink-300 dark:bg-fuchsia-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header / Nav */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle soundEnabled={isSoundEnabled} toggleSound={toggleSound} />
      </div>

      <div className="w-full max-w-2xl relative z-10 perspective-1000">
        <AnimatePresence mode="wait">
          
          {/* START SCREEN */}
          {appState === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              className="text-center space-y-10 py-10"
            >
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 dark:from-primary-400 dark:via-purple-400 dark:to-pink-400 drop-shadow-sm">
                    How Well<br />Do You Know
                  </span>
                  <br />
                  <span className="text-slate-900 dark:text-white drop-shadow-lg">Nerom?</span>
                </h1>
                <p className="text-xl font-medium text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                  Are you a true friend or just a fan? Prove your knowledge in the ultimate Nerom quiz.
                </p>
              </div>
              
              <button
                onClick={handleStart}
                onMouseEnter={() => triggerHaptic(5)}
                className="group relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white transition-all duration-300 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full shadow-xl hover:shadow-primary-500/40 hover:-translate-y-1 hover:scale-105 focus:outline-none ring-offset-2 ring-primary-500"
              >
                Start Quiz
                <Zap className="ml-2 w-6 h-6 group-hover:rotate-12 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* QUIZ SCREEN */}
          {appState === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full"
            >
              <ProgressBar current={currentQuestionIndex} total={QUESTIONS.length} />
              
              <motion.div animate={shakeControls}>
                <TiltCard className="glass-panel rounded-[2.5rem] shadow-2xl p-8 sm:p-12 min-h-[500px] flex flex-col justify-between relative overflow-hidden transform-gpu">
                  {/* Decorative corner gradient */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  {/* ROAST OVERLAY */}
                  <AnimatePresence>
                    {roast && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                        animate={{ opacity: 1, scale: 1.1, rotate: -5 }}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                        className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none"
                      >
                        <span className="bg-rose-500 text-white font-black text-xl sm:text-2xl px-6 py-2 rounded-xl shadow-xl border-4 border-white dark:border-slate-800 transform -rotate-2">
                          {roast}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="preserve-3d">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-slate-800 dark:text-white leading-tight drop-shadow-sm transform translate-z-10">
                      {currentQuestion.text}
                    </h2>
                    
                    <div className="grid gap-6 sm:grid-cols-2 transform translate-z-20">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleOptionSelect(option.id)}
                          disabled={isAnswerRevealed}
                          onMouseEnter={() => !isAnswerRevealed && triggerHaptic(5)}
                          className={getOptionClass(option.id, option.isCorrect)}
                        >
                          <span className="z-10">{option.text}</span>
                        </button>
                      ))}
                    </div>

                    {/* Comment / Feedback Section */}
                    <div className="min-h-[5rem] mt-8 flex items-center justify-center px-4 text-center transform translate-z-30">
                      <AnimatePresence mode="wait">
                        {isAnswerRevealed && currentQuestion.comment && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95, rotateX: -20 }}
                            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", bounce: 0.4 }}
                            className="px-6 py-3 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm"
                          >
                            <p className="text-slate-700 dark:text-slate-200 font-medium text-lg">
                              <span className="text-primary-500 text-xl mr-2">💡</span>
                              {currentQuestion.comment}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="h-16 flex justify-end items-center mt-4 transform translate-z-40">
                    <AnimatePresence>
                      {isAnswerRevealed && (
                        <motion.button
                          initial={{ opacity: 0, x: 20, scale: 0.8 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleNext}
                          className="flex items-center px-8 py-4 text-white bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 dark:text-slate-900 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                          Next
                          <ChevronRight size={24} className="ml-1" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </TiltCard>
              </motion.div>
            </motion.div>
          )}

          {/* LOADING SCREEN */}
          {appState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-8 text-center py-20"
            >
              <div className="relative w-32 h-32">
                <motion.div
                  className="absolute inset-0 border-8 border-primary-100 dark:border-slate-800 rounded-full"
                />
                <motion.div
                  className="absolute inset-0 border-8 border-primary-500 rounded-full border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600">
                Analyzing your knowledge...
              </h2>
            </motion.div>
          )}

          {/* RESULT SCREEN */}
          {appState === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-lg mx-auto relative"
            >
              <TiltCard className="glass-panel rounded-[2.5rem] shadow-2xl p-8 sm:p-14 text-center border border-white/40 dark:border-white/10 relative overflow-hidden">
                
                {/* Spotlight effect */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>

                <motion.div 
                  variants={resultContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative z-10"
                >
                  <motion.div variants={resultItemVariants} className="inline-block px-4 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold tracking-widest uppercase mb-4">
                    Final Score
                  </motion.div>
                  
                  <motion.div variants={resultItemVariants} className="relative mb-6">
                    <h1 className="text-8xl font-black text-slate-900 dark:text-white tracking-tighter flex justify-center items-start">
                      <AnimatedCounter value={score} />
                      <span className="text-4xl text-slate-400 dark:text-slate-600 mt-2 ml-1">/{QUESTIONS.length}</span>
                    </h1>
                  </motion.div>
                  
                  <motion.h2 variants={resultItemVariants} className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 dark:from-primary-400 dark:via-purple-400 dark:to-pink-400 mb-10 leading-tight">
                    {getResultMessage(score)}
                  </motion.h2>

                  <motion.div variants={resultItemVariants} className="space-y-3">
                    <div className="flex gap-3">
                      <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center px-6 py-4 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl font-bold text-base transition-all hover:-translate-y-1 active:scale-95"
                      >
                        <Share2 size={18} className="mr-2" />
                        Share Text
                      </button>
                      
                      <button
                        onClick={handleStart}
                        className="flex-1 flex items-center justify-center px-6 py-4 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl font-bold text-base transition-all hover:-translate-y-1 active:scale-95"
                      >
                        <RefreshCw size={18} className="mr-2" />
                        Retry
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              </TiltCard>
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;