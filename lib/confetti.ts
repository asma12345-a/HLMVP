import confetti from 'canvas-confetti';

export function triggerLessonCelebrationConfetti() {
  if (typeof window === 'undefined') return;

  // Immediate central big burst
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#1890FF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6'],
  });

  // Left cannon
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#1890FF', '#10B981', '#FBBF24', '#60A5FA'],
    });
  }, 250);

  // Right cannon
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#10B981', '#F59E0B', '#8B5CF6', '#34D399'],
    });
  }, 400);

  // Star and circle celebration rain
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 100,
      origin: { y: 0.4 },
      shapes: ['star', 'circle'],
      colors: ['#FFD700', '#FFA500', '#1890FF', '#10B981'],
    });
  }, 650);
}

export function triggerQuickSuccessConfetti(x = 0.5, y = 0.5) {
  if (typeof window === 'undefined') return;

  confetti({
    particleCount: 30,
    spread: 50,
    origin: { x, y },
    colors: ['#10B981', '#34D399', '#6EE7B7', '#1890FF'],
    disableForReducedMotion: true,
  });
}
