import React, { ReactNode } from 'react'
import styled from 'styled-components'

const StyledTitle = styled.h3`
  padding: 0 12px;
  text-align: center;
  color: #7ca5f3;
  margin: 0;
  font-weight: light;
`

interface TitleProps {
  children: ReactNode
}

const Title: React.FC<TitleProps> = ({ children }) => <StyledTitle>{children}</StyledTitle>

export default Title
