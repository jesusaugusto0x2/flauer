import React from 'react'
import styled from 'styled-components'
import { Image, Title, PuzzleWord } from '../index'
import Cloud from '../../assets/cloud.gif'
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

const ImageContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;

  & > img {
    width: 100%;
    max-width: 400px;
    height: 200px;
  }
`

const Structure: React.FC = () => (
  <StructureContainer>
    <ImageContainer>
      <Image source={Cloud} />
    </ImageContainer>
    <Title>Every set of flowers might have a meaning!</Title>
    <PuzzleWord word={FLOWER_WORD} />
  </StructureContainer>
)

export default Structure
