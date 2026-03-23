import { useSelector } from "react-redux";
import { RootState } from "../state/store";

/**
 * Hook that provides speed-adjusted timing values.
 * All animation durations and delays should go through this hook.
 * At 1x speed, returns original values. At 5x, returns 1/5th.
 *
 * Usage:
 *   const { adjust, speed } = useGameSpeed();
 *   setTimeout(callback, adjust(1000)); // 1000ms at 1x, 200ms at 5x
 */
export function useGameSpeed() {
  const speed = useSelector(
    (state: RootState) => (state as any).settings?.gameSpeed ?? 1
  );

  const adjust = (ms: number): number => {
    return Math.max(Math.round(ms / speed), 16); // Min 16ms (1 frame)
  };

  return { speed, adjust };
}

/**
 * Non-hook version for use outside React components.
 * Reads speed from a global variable set by the SpeedControl component.
 */
let _globalSpeed = 1;

export function setGlobalSpeed(speed: number) {
  _globalSpeed = Math.max(1, Math.min(5, speed));
}

export function getGlobalSpeed(): number {
  return _globalSpeed;
}

export function adjustTiming(ms: number): number {
  return Math.max(Math.round(ms / _globalSpeed), 16);
}
