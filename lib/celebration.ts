// HuluLearn Celebration & Confetti Engine
import confetti from 'canvas-confetti';

export function fireCorrectConfetti() {
  if (typeof window === 'undefined') return;

  // Gentle quick burst for correct answers
  confetti({
    particleCount: 45,
    spread: 60,
    origin: { y: 0.8 },
    colors: ['#10B981', '#F59E0B', '#1890FF', '#3B82F6', '#EC4899'],
    ticks: 200,
    gravity: 1.2,
    scalar: 0.9,
    shapes: ['circle', 'square'],
  });
}

export function fireLessonCompleteConfetti() {
  if (typeof window === 'undefined') return;

  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#1890FF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'],
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Multi-stage burst simulating high-energy cannon
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    shapes: ['star'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });

  // Left & right edge cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#1890FF', '#10B981', '#F59E0B'],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#1890FF', '#10B981', '#F59E0B'],
    });
  }, 250);
}

export function fireDiagnosticCompleteConfetti() {
  if (typeof window === 'undefined') return;

  confetti({
    particleCount: 70,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#1890FF', '#3B82F6', '#60A5FA', '#F59E0B', '#10B981'],
    ticks: 250,
    gravity: 1,
  });
}

export function fireGrandUnitComplete() {
  if (typeof window === 'undefined') return;

  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  const interval: NodeJS.Timeout = setInterval(function () {
    if (Date.now() > end) {
      return clearInterval(interval);
    }

    confetti({
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2,
      },
      colors: ['#1890FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    });
  }, 200);
}
