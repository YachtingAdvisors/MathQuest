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
  streakShield: boolean;
  dailyChallengeActive: boolean;
  dailyChallengeProblems: number;
  dailyChallengeCorrect: number;
  dailyChallengeStartTime: number;
  mathLabActive: boolean;
  showMathPokedex: boolean;
  showParentDashboard: boolean;
  showDailyChallenge: boolean;
  showMathLab: boolean;
  showMathBadges: boolean;
  rareCounter: number; // 0-30, resets when rare pokemon appears
  rareEncounterReady: boolean; // true when counter hits 30
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
  streakShield: false,
  dailyChallengeActive: false,
  dailyChallengeProblems: 0,
  dailyChallengeCorrect: 0,
  dailyChallengeStartTime: 0,
  mathLabActive: false,
  showMathPokedex: false,
  showParentDashboard: false,
  showDailyChallenge: false,
  showMathLab: false,
  showMathBadges: false,
  rareCounter: 0,
  rareEncounterReady: false,
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
    activateStreakShield: (state) => {
      state.streakShield = true;
    },
    consumeStreakShield: (state) => {
      state.streakShield = false;
    },
    startDailyChallenge: (state) => {
      state.dailyChallengeActive = true;
      state.dailyChallengeProblems = 0;
      state.dailyChallengeCorrect = 0;
      state.dailyChallengeStartTime = Date.now();
    },
    endDailyChallenge: (state) => {
      state.dailyChallengeActive = false;
    },
    recordDailyChallengeAnswer: (state, action: PayloadAction<boolean>) => {
      state.dailyChallengeProblems += 1;
      if (action.payload) {
        state.dailyChallengeCorrect += 1;
      }
    },
    startMathLab: (state) => {
      state.mathLabActive = true;
    },
    endMathLab: (state) => {
      state.mathLabActive = false;
    },
    showMathPokedex: (state) => {
      state.showMathPokedex = true;
    },
    hideMathPokedex: (state) => {
      state.showMathPokedex = false;
    },
    showParentDashboard: (state) => {
      state.showParentDashboard = true;
    },
    hideParentDashboard: (state) => {
      state.showParentDashboard = false;
    },
    showDailyChallenge: (state) => {
      state.showDailyChallenge = true;
    },
    hideDailyChallenge: (state) => {
      state.showDailyChallenge = false;
    },
    showMathLab: (state) => {
      state.showMathLab = true;
    },
    hideMathLab: (state) => {
      state.showMathLab = false;
    },
    showMathBadges: (state) => {
      state.showMathBadges = true;
    },
    hideMathBadges: (state) => {
      state.showMathBadges = false;
    },
    incrementRareCounter: (state) => {
      state.rareCounter = Math.min(30, state.rareCounter + 1);
      if (state.rareCounter >= 30) {
        state.rareEncounterReady = true;
      }
    },
    resetRareCounter: (state) => {
      state.rareCounter = 0;
      state.rareEncounterReady = false;
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
  activateStreakShield,
  consumeStreakShield,
  startDailyChallenge,
  endDailyChallenge,
  recordDailyChallengeAnswer,
  startMathLab,
  endMathLab,
  showMathPokedex,
  hideMathPokedex,
  showParentDashboard,
  hideParentDashboard,
  showDailyChallenge,
  hideDailyChallenge,
  showMathLab,
  hideMathLab,
  showMathBadges,
  hideMathBadges,
  incrementRareCounter,
  resetRareCounter,
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
export const selectStreakShield = (state: RootState) =>
  state.math.streakShield;
export const selectDailyChallengeActive = (state: RootState) =>
  state.math.dailyChallengeActive;
export const selectDailyChallengeProblems = (state: RootState) =>
  state.math.dailyChallengeProblems;
export const selectDailyChallengeCorrect = (state: RootState) =>
  state.math.dailyChallengeCorrect;
export const selectDailyChallengeStartTime = (state: RootState) =>
  state.math.dailyChallengeStartTime;
export const selectMathLabActive = (state: RootState) =>
  state.math.mathLabActive;
export const selectShowMathPokedex = (state: RootState) =>
  state.math.showMathPokedex;
export const selectShowParentDashboard = (state: RootState) =>
  state.math.showParentDashboard;
export const selectShowDailyChallenge = (state: RootState) =>
  state.math.showDailyChallenge;
export const selectShowMathLab = (state: RootState) =>
  state.math.showMathLab;
export const selectShowMathBadges = (state: RootState) =>
  state.math.showMathBadges;

export const selectRareCounter = (state: RootState) =>
  state.math.rareCounter;
export const selectRareEncounterReady = (state: RootState) =>
  state.math.rareEncounterReady;

export default mathSlice.reducer;
