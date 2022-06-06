import React, { ReactNode } from 'react'
import styled from 'styled-components'
import Cloud from '../../assets/cloud.gif'

const WrapperContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh);
  border-image-repeat: round;
  // background-image: url(${Cloud});
  background-repeat: repeat;
  background-size: 130px;
  opacity: 0.85;
`

interface WrapperProps {
  children: ReactNode
}

const Wrapper: React.FC<WrapperProps> = ({ children }) => (
  <WrapperContainer>{children}</WrapperContainer>
)

export default Wrapper
