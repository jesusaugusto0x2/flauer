import React from 'react'
import { Image } from '../index'
import styled from 'styled-components'
import BlueFlower from '../../assets/blue_flowers.gif'
import { setValue, getFullLetterState } from '../../reducers/letters'
import { useAppDispatch, useAppSelector } from '../../hooks/contexts'

const HiddenLetterContainer = styled.div<{ $isLoading: boolean }>`
  cursor: ${(props) => (props.$isLoading ? 'wait' : 'cursor')};
  margin: 0 5px;
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
  const { loading } = useAppSelector((state) => getFullLetterState(state))

  const dispatch = useAppDispatch()

  const handleClick = () => {
    if (loading) return

    dispatch(setValue({ value: letter, words, loading: true }))
  }

  return (
    <HiddenLetterContainer onClick={handleClick} $isLoading={loading}>
      <Image source={BlueFlower} />
    </HiddenLetterContainer>
  )
}

export default HiddenLetter
