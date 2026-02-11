import { useEffect, useRef } from 'react';

export function useGameLoop(onTick: (dt: number) => void, isRunning: boolean) {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!isRunning) return;

    let lastTime = performance.now();
    let rafId: number;

    function loop(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms
      lastTime = now;
      onTickRef.current(dt);
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning]);
}
