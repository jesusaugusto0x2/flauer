import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

// Define a type for the slice state
interface LetterState {
  value: string
  words: string[]
  loading: boolean
}

// Define the initial state using that type
const initialState: LetterState = {
  value: '',
  words: [],
  loading: false,
}

export const letterSlice = createSlice({
  name: 'letter',
  initialState,
  reducers: {
    setValue: (state, action: PayloadAction<LetterState>) => {
      state.value = action.payload.value
      state.words = action.payload.words
      state.loading = action.payload.loading
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { setValue, setLoading } = letterSlice.actions

export const getFullLetterState = (state: RootState) => state.letter

export default letterSlice.reducer
