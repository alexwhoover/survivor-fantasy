import { useMemo } from "react";

const EMBER_COUNT = 28;

interface Ember {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

function randomEmbers(count: number): Ember[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 5 + Math.random() * 6,
    delay: Math.random() * 8,
    drift: (Math.random() - 0.5) * 60,
    opacity: 0.5 + Math.random() * 0.4,
  }));
}

/** Rising-ember effect for the bottom 25% of the viewport — a low bed of embers, not an active flame. */
export function EmberBackground() {
  const embers = useMemo(() => randomEmbers(EMBER_COUNT), []);

  return (
    <div className="fixed inset-x-0 bottom-0 h-[25vh] overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      <div className="absolute inset-0 ember-ambient-glow" />
      {embers.map((ember, i) => (
        <span
          key={i}
          className="ember-particle"
          style={{
            left: `${ember.left}%`,
            width: ember.size,
            height: ember.size,
            animationDuration: `${ember.duration}s`,
            animationDelay: `-${ember.delay}s`,
            ["--drift" as string]: `${ember.drift}px`,
            ["--ember-opacity" as string]: ember.opacity,
          }}
        />
      ))}
    </div>
  );
}
