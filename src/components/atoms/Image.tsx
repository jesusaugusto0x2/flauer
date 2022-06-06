import React from 'react'
import styled from 'styled-components'

const StyledImage = styled.img<{ width: number; height: number }>`
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
`

interface ImageProps {
  width?: number
  height?: number
  source: string
}

const DEFAULT_IMAGE_SIZE = 100

const Image: React.FC<ImageProps> = ({
  width = DEFAULT_IMAGE_SIZE,
  height = DEFAULT_IMAGE_SIZE,
  source,
}) => <StyledImage width={width} height={height} src={source} />

export default Image
