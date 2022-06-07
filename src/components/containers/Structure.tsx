import React from 'react'
import styled from 'styled-components'
import { Title, PuzzleWord, CloudSelector } from '../index'
import { FLOWER_WORD } from '../../constants'

const StructureContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: space-between;
  padding: 10px 0;
  width: 100%;
`

const Structure: React.FC = () => (
  <StructureContainer>
    <CloudSelector />
    <Title>Every set of flowers might have a meaning!</Title>
    <PuzzleWord word={FLOWER_WORD} />
  </StructureContainer>
)

export default Structure
