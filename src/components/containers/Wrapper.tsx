import React, { ReactNode } from "react"
import styled from 'styled-components';

const WrapperContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
`

interface WrapperProps  {
  children: ReactNode
}

const Wrapper: React.FC<WrapperProps> = ({ children }) => (
  <WrapperContainer>{children}</WrapperContainer>
)

export default Wrapper
