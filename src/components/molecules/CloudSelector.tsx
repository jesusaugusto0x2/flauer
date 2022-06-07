import React from 'react'
import styled from 'styled-components'
import { useAppSelector } from '../../hooks/contexts'
import { getFullLetterState } from '../../reducers/letters'
import Cloud from '../../assets/cloud.gif'

const CloudSelectorContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`

const PureCloudContainer = styled.div`
  width: 100%;
  max-width: 400px;
  height: 200px;
  background-image: url(${Cloud});
  background-repeat: no-repeat;
  background-size: 100% 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`

const LetterValue = styled.span`
  text-align: center;
  font-size: 5em;
  color: white;
`

const CloudSelector: React.FC = () => {
  const letterState = useAppSelector((state) => getFullLetterState(state))

  return (
    <CloudSelectorContainer>
      <PureCloudContainer>
        <LetterValue>{letterState.value}</LetterValue>
      </PureCloudContainer>
    </CloudSelectorContainer>
  )
}

export default CloudSelector
