import { useEffect, useState } from "react";

/**
 * A seconds counter that only advances while `running` is true.
 *
 * Pausing holds the count rather than resetting it, so resuming continues
 * from where the user left off. Returned as a [value, setValue] pair so it
 * drops in where a plain useState counter was.
 */
export function useElapsedSeconds(running: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  return [seconds, setSeconds] as const;
}
