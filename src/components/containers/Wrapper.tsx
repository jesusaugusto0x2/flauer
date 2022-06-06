import React, { ReactNode } from 'react'
import styled from 'styled-components'
import FlowerMark from '../../assets/flowermark.png'
import Petals from '../../assets/falling_petals.gif'

const WrapperContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 50px);
  border: 25px solid pink;
  -moz-border-image: url(${FlowerMark});
  -webkit-border-image: url(${FlowerMark});
  -o-border-image: url(${FlowerMark});
  border-image: url(${FlowerMark});
  border-image-slice: 180;
  border-image-repeat: round;
  background-color: #fcfaff;
  background-image: url(${Petals});
  background-repeat: repeat;
  background-size: 100 100;
`

interface WrapperProps {
  children: ReactNode
}

const Wrapper: React.FC<WrapperProps> = ({ children }) => (
  <WrapperContainer>{children}</WrapperContainer>
)

export default Wrapper
