import React from 'react'
import { Image } from '../index'
import styled from 'styled-components'
import BlueFlower from '../../assets/blue_flowers.gif'
import { setValue } from '../../reducers/letters'
import { useAppDispatch } from '../../hooks/contexts'

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

interface LetterProps {
  letter: string
  words: string[]
}

const HiddenLetter: React.FC<LetterProps> = ({ letter, words }) => {
  const dispatch = useAppDispatch()

  const handleClick = () => {
    dispatch(setValue({ value: letter, words }))
  }

  return (
    <HiddenLetterContainer onClick={handleClick}>
      <Image source={BlueFlower} />
    </HiddenLetterContainer>
  )
}

export default HiddenLetter
