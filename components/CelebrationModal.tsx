"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, Flame, Check, ArrowRight, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { soundManager } from '@/lib/audio';
import { fireLessonCompleteConfetti } from '@/lib/celebration';

interface CelebrationModalProps {
  isOpen: boolean;
  topicTitle: string;
  unitTitle?: string;
  isPerfectQuiz: boolean;
  xpEarned?: number;
  streakDays?: number;
  onContinue: () => void;
  onReview: () => void;
}

export function CelebrationModal({
  isOpen,
  topicTitle,
  unitTitle = "Sequences & Series",
  isPerfectQuiz,
  xpEarned = 25,
  streakDays = 1,
  onContinue,
  onReview,
}: CelebrationModalProps) {
  const [animatedXp, setAnimatedXp] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    // Trigger fanfare and confetti explosion
    soundManager.playCelebrationFanfare();
    fireLessonCompleteConfetti();

    // Animate XP count up after a brief moment with streak chime
    const timer = setTimeout(() => {
      soundManager.playStreakChime();
      let current = 0;
      const step = Math.max(Math.ceil(xpEarned / 10), 1);
      const interval = setInterval(() => {
        current += step;
        if (current >= xpEarned) {
          setAnimatedXp(xpEarned);
          clearInterval(interval);
        } else {
          setAnimatedXp(current);
        }
      }, 40);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, xpEarned]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="celebration-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          id="celebration-card"
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-4 border-amber-300 text-center relative overflow-hidden"
        >
          {/* Background glowing radiant aura */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

          {/* Floating animated sparkles */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute top-4 right-4 text-amber-400 opacity-75 pointer-events-none"
          >
            <Sparkles className="w-7 h-7" />
          </motion.div>

          {/* Trophy & Badge Hero Animation */}
          <div className="relative inline-block my-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
              className="w-24 h-24 bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 rounded-3xl flex items-center justify-center shadow-lg mx-auto border-4 border-white"
            >
              <Trophy className="w-12 h-12 text-amber-900 drop-shadow-sm" />
            </motion.div>

            {/* Perfect Badge Pip */}
            {isPerfectQuiz && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: "spring" }}
                className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-md"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </motion.div>
            )}
          </div>

          {/* Congratulatory Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-3 mb-5"
          >
            <span className="text-[11px] font-extrabold tracking-widest uppercase bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
              {unitTitle}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-2 mb-1 tracking-tight">
              Lesson Complete!
            </h2>
            <p className="text-sm font-semibold text-gray-600 truncate px-2">
              You mastered <span className="text-primary font-bold">{topicTitle}</span>
            </p>
          </motion.div>

          {/* Gamified Reward Badges Grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {/* XP Earned Card */}
            <div className="bg-amber-50/80 border-2 border-amber-200/80 rounded-2xl p-3.5 flex flex-col items-center justify-center shadow-xs">
              <div className="flex items-center gap-1.5 text-amber-600 font-extrabold text-xs uppercase mb-1">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> XP Earned
              </div>
              <span className="text-2xl font-black text-amber-900 tracking-tight">
                +{animatedXp} XP
              </span>
            </div>

            {/* Streak Card */}
            <div className="bg-orange-50/80 border-2 border-orange-200/80 rounded-2xl p-3.5 flex flex-col items-center justify-center shadow-xs">
              <div className="flex items-center gap-1.5 text-orange-600 font-extrabold text-xs uppercase mb-1">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" /> Streak
              </div>
              <span className="text-2xl font-black text-orange-900 tracking-tight">
                {streakDays} {streakDays === 1 ? 'Day' : 'Days'}!
              </span>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <Button
              id="btn-celebration-continue"
              variant="primary"
              onClick={() => {
                soundManager.playPop();
                onContinue();
              }}
              className="text-base font-extrabold py-4 shadow-[0_4px_0_#0070cc] flex items-center justify-center gap-2"
            >
              Continue Learning <ArrowRight className="w-5 h-5" />
            </Button>

            <Button
              id="btn-celebration-review"
              variant="ghost"
              onClick={() => {
                soundManager.playPop();
                onReview();
              }}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 py-2.5 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Review this Micro-Lesson
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
