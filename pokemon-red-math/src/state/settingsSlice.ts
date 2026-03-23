import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface SettingsState {
  gameSpeed: number; // 1-5, affects animation durations
  timedMode: boolean; // true = timer on math problems, false = untimed
  difficultyOverride: number | null; // null = adaptive, 1-10 = fixed difficulty
  showVisualAids: boolean;
  soundEnabled: boolean;
  parentPin: string | null; // 4-digit PIN to access parent dashboard
}

const initialState: SettingsState = {
  gameSpeed: 1,
  timedMode: true,
  difficultyOverride: null,
  showVisualAids: true,
  soundEnabled: true,
  parentPin: null,
};

const SETTINGS_STORAGE_KEY = "mathquest-settings";

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setGameSpeed: (state, action: PayloadAction<number>) => {
      state.gameSpeed = Math.min(5, Math.max(1, action.payload));
    },
    toggleTimedMode: (state) => {
      state.timedMode = !state.timedMode;
    },
    setDifficultyOverride: (state, action: PayloadAction<number | null>) => {
      state.difficultyOverride = action.payload;
    },
    toggleVisualAids: (state) => {
      state.showVisualAids = !state.showVisualAids;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    setParentPin: (state, action: PayloadAction<string>) => {
      state.parentPin = action.payload;
    },
    saveSettings: (state) => {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
      } catch {
        // localStorage not available
      }
    },
    loadSettings: (state) => {
      try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<SettingsState>;
          if (parsed.gameSpeed !== undefined) state.gameSpeed = parsed.gameSpeed;
          if (parsed.timedMode !== undefined) state.timedMode = parsed.timedMode;
          if (parsed.difficultyOverride !== undefined)
            state.difficultyOverride = parsed.difficultyOverride;
          if (parsed.showVisualAids !== undefined)
            state.showVisualAids = parsed.showVisualAids;
          if (parsed.soundEnabled !== undefined)
            state.soundEnabled = parsed.soundEnabled;
          if (parsed.parentPin !== undefined)
            state.parentPin = parsed.parentPin;
        }
      } catch {
        // localStorage not available or invalid JSON
      }
    },
  },
});

export const {
  setGameSpeed,
  toggleTimedMode,
  setDifficultyOverride,
  toggleVisualAids,
  toggleSound,
  setParentPin,
  saveSettings,
  loadSettings,
} = settingsSlice.actions;

// Selectors
export const selectGameSpeed = (state: RootState) => state.settings.gameSpeed;
export const selectTimedMode = (state: RootState) => state.settings.timedMode;
export const selectDifficultyOverride = (state: RootState) =>
  state.settings.difficultyOverride;
export const selectShowVisualAids = (state: RootState) =>
  state.settings.showVisualAids;
export const selectSoundEnabled = (state: RootState) =>
  state.settings.soundEnabled;
export const selectParentPin = (state: RootState) => state.settings.parentPin;

export default settingsSlice.reducer;
