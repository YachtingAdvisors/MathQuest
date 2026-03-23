import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { MathProblem, MathResult, MathEngineState, PendingBattleAction } from "../math/types";

interface MathSliceState {
  grade: number; // 0=K ... 8=8th
  gradeSelected: boolean;
  engineState: MathEngineState | null;
  currentProblem: MathProblem | null;
  problemStartTime: number;
  lastResult: MathResult | null;
  showingMathOverlay: boolean;
  showingResult: boolean;
  pendingAction: PendingBattleAction | null;
}

const initialState: MathSliceState = {
  grade: -1,
  gradeSelected: false,
  engineState: null,
  currentProblem: null,
  problemStartTime: 0,
  lastResult: null,
  showingMathOverlay: false,
  showingResult: false,
  pendingAction: null,
};

export const mathSlice = createSlice({
  name: "math",
  initialState,
  reducers: {
    selectGrade: (state, action: PayloadAction<number>) => {
      state.grade = action.payload;
      state.gradeSelected = true;
    },
    setEngineState: (state, action: PayloadAction<MathEngineState>) => {
      state.engineState = action.payload;
    },
    showMathChallenge: (
      state,
      action: PayloadAction<{
        problem: MathProblem;
        pendingAction: PendingBattleAction;
      }>
    ) => {
      state.currentProblem = action.payload.problem;
      state.pendingAction = action.payload.pendingAction;
      state.problemStartTime = Date.now();
      state.showingMathOverlay = true;
      state.showingResult = false;
      state.lastResult = null;
    },
    submitMathAnswer: (state, action: PayloadAction<MathResult>) => {
      state.lastResult = action.payload;
      state.showingResult = true;
    },
    dismissMathOverlay: (state) => {
      state.showingMathOverlay = false;
      state.showingResult = false;
      state.currentProblem = null;
    },
    resetMathState: () => initialState,
  },
});

export const {
  selectGrade,
  setEngineState,
  showMathChallenge,
  submitMathAnswer,
  dismissMathOverlay,
  resetMathState,
} = mathSlice.actions;

export const selectMathGrade = (state: RootState) => state.math.grade;
export const selectGradeSelected = (state: RootState) =>
  state.math.gradeSelected;
export const selectCurrentProblem = (state: RootState) =>
  state.math.currentProblem;
export const selectProblemStartTime = (state: RootState) =>
  state.math.problemStartTime;
export const selectLastMathResult = (state: RootState) =>
  state.math.lastResult;
export const selectShowingMathOverlay = (state: RootState) =>
  state.math.showingMathOverlay;
export const selectShowingResult = (state: RootState) =>
  state.math.showingResult;
export const selectPendingAction = (state: RootState) =>
  state.math.pendingAction;
export const selectMathEngineState = (state: RootState) =>
  state.math.engineState;

export default mathSlice.reducer;
