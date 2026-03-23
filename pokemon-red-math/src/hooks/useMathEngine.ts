import { useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MathEngine } from "../math/mathEngine";
import { MathContext, PendingBattleAction } from "../math/types";
import {
  selectMathGrade,
  selectMathEngineState,
  selectCurrentProblem,
  selectProblemStartTime,
  setEngineState,
  showMathChallenge,
  submitMathAnswer,
  dismissMathOverlay,
  incrementRareCounter,
  resetRareCounter,
} from "../state/mathSlice";

export function useMathEngine() {
  const dispatch = useDispatch();
  const grade = useSelector(selectMathGrade);
  const savedState = useSelector(selectMathEngineState);
  const currentProblem = useSelector(selectCurrentProblem);
  const problemStartTime = useSelector(selectProblemStartTime);

  // Keep engine instance in a ref so it persists across renders
  const engineRef = useRef<MathEngine | null>(null);

  const getEngine = useCallback((): MathEngine => {
    if (!engineRef.current) {
      engineRef.current = new MathEngine(
        grade >= 0 ? grade : 3,
        savedState || undefined
      );
    }
    return engineRef.current;
  }, [grade, savedState]);

  const startChallenge = useCallback(
    (context: MathContext, pendingAction: PendingBattleAction) => {
      const engine = getEngine();
      const problem = engine.generateProblem(context);
      dispatch(
        showMathChallenge({
          problem,
          pendingAction,
        })
      );
    },
    [dispatch, getEngine]
  );

  const handleAnswer = useCallback(
    (choiceIndex: number) => {
      if (!currentProblem) return null;
      const engine = getEngine();
      const timeMs = Date.now() - problemStartTime;
      const selectedAnswer = currentProblem.choices[choiceIndex];
      const result = engine.recordAnswer(
        currentProblem.id,
        selectedAnswer,
        timeMs
      );

      // Save engine state to Redux
      dispatch(setEngineState(engine.getState()));
      dispatch(submitMathAnswer(result));

      // Update rare encounter counter
      if (result.correct) {
        dispatch(incrementRareCounter());
      } else {
        dispatch(resetRareCounter());
      }

      return result;
    },
    [currentProblem, problemStartTime, dispatch, getEngine]
  );

  const handleTimeout = useCallback(() => {
    if (!currentProblem) return;
    const engine = getEngine();
    // Record as wrong with max time
    const result = engine.recordAnswer(
      currentProblem.id,
      -1, // Definitely wrong
      currentProblem.timeLimit * 1000
    );
    dispatch(setEngineState(engine.getState()));
    dispatch(submitMathAnswer(result));
    dispatch(resetRareCounter());
  }, [currentProblem, dispatch, getEngine]);

  const handleHint = useCallback((): string => {
    if (!currentProblem) return "No problem active.";
    const engine = getEngine();
    return engine.getHint(currentProblem.id);
  }, [currentProblem, getEngine]);

  const dismiss = useCallback(() => {
    dispatch(dismissMathOverlay());
  }, [dispatch]);

  const getStreak = useCallback((): number => {
    const engine = getEngine();
    return engine.getStreak();
  }, [getEngine]);

  return {
    startChallenge,
    handleAnswer,
    handleTimeout,
    handleHint,
    dismiss,
    getStreak,
    getEngine,
  };
}
