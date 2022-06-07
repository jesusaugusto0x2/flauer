import { configureStore } from '@reduxjs/toolkit'
import letterReducer from '../reducers/letters'

export const store = configureStore({
  reducer: {
    letter: letterReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
