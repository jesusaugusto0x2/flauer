import React, { ReactNode } from 'react'
import styled from 'styled-components'
import Mark from '../../assets/flowermark.png'

const WrapperContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 50px);
  border: 25px solid pink;
  -moz-border-image: url(${Mark});
  -webkit-border-image: url(${Mark});
  -o-border-image: url(${Mark});
  border-image: url(${Mark});
  border-image-slice: 180;
  border-image-repeat: round;
`

interface WrapperProps {
  children: ReactNode
}

const Wrapper: React.FC<WrapperProps> = ({ children }) => (
  <WrapperContainer>{children}</WrapperContainer>
)

export default Wrapper
