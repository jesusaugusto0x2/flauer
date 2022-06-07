import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

// Define a type for the slice state
interface LetterState {
  value: string
  words: string[]
}

// Define the initial state using that type
const initialState: LetterState = {
  value: '',
  words: []
}

export const letterSlice = createSlice({
  name: 'letter',
  initialState,
  reducers: {
    setValue: (state, action: PayloadAction<LetterState>) => {
      state.value = action.payload.value
      state.words = action.payload.words
    },
  },
})

export const { setValue } = letterSlice.actions

export const getFullLetterState = (state: RootState) => state.letter

export default letterSlice.reducer