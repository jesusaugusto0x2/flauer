import React, { useState } from 'react'
import { Image } from '../index'
import styled from 'styled-components'
import BlueFlower from '../../assets/blue_flowers.gif'

const HiddenLetterContainer = styled.div`
  cursor: pointer;
  margin: 0 5px;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    height: 100%;
  }
`

const Letter = styled.span`
  font-size: 28px;
  fontweight: vold;
`

interface LetterProps {
  letter: string
  words: string[]
}

const HiddenLetter: React.FC<LetterProps> = ({ letter, words }) => {
  const [isInside, setIsInside] = useState<boolean>(false)

  return (
    <HiddenLetterContainer
      onMouseEnter={() => setIsInside(true)}
      onMouseLeave={() => setIsInside(false)}
    >
      {!isInside ? <Image source={BlueFlower} /> : <Letter>{letter}</Letter>}
    </HiddenLetterContainer>
  )
}

export default HiddenLetter
