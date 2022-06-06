import React from 'react'
import styled from 'styled-components'
import { Image } from '../index'
import BlueFlower from '../../assets/blue_flowers.gif'

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
      <Image key={letterItem} source={BlueFlower} width={75} height={75} />
    ))}
  </PuzzleWordContainer>
)

export default PuzzleWord
