import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import gameReducer from "./gameSlice";
import uiReducer from "./uiSlice";
import mathReducer from "./mathSlice";
import settingsReducer from "./settingsSlice";

export const store = configureStore({
  reducer: {
    game: gameReducer,
    ui: uiReducer,
    math: mathReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
