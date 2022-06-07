import React from 'react'
import styled from 'styled-components'
import { HiddenLetter } from '../index'

const PuzzleWordContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

interface PuzzleWordContainerProps {
  word: Record<string, string[]>
}

const PuzzleWord: React.FC<PuzzleWordContainerProps> = ({ word }) => (
  <PuzzleWordContainer>
    {Object.keys(word).map((letterItem: string) => (
      <HiddenLetter key={letterItem} letter={letterItem} words={word[letterItem]} />
    ))}
  </PuzzleWordContainer>
)

export default PuzzleWord
