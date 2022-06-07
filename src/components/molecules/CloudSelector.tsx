import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useAppSelector, useAppDispatch } from '../../hooks/contexts'
import { getFullLetterState, setLoading } from '../../reducers/letters'
import Cloud from '../../assets/cloud.gif'

const CloudSelectorContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
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
  flex-direction: column;
  color: white;

  h3 {
    margin: 0;
  }
`

const LetterValue = styled.span`
  text-align: center;
  font-size: 5em;
  font-weight: 900;
`

const SelectionContainer = styled.div`
  display: flex;
  flex-direction: column;

  h2,
  h3 {
    margin: 0;
  }
`

const AttributeDisplay = styled.h2`
  color: #fb7b7b;
  margin-top: 10px !important;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 2.5rem;
`

const CloudSelector: React.FC = () => {
  const [count, setCount] = useState<number>(0)
  const { value, words, loading } = useAppSelector((state) => getFullLetterState(state))
  const dispatch = useAppDispatch()

  useEffect(() => {
    const countingTimer = setTimeout(() => {
      if (words.length && count < words.length && loading) {
        setCount((prevState) => prevState + 1)
      } else {
        setCount(0)
      }
    }, 100)

    return () => {
      clearTimeout(countingTimer)
    }
  }, [count, words, loading])

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      dispatch(setLoading(false))
    }, 5000)

    return () => {
      clearTimeout(loadingTimer)
    }
  }, [loading, dispatch, setLoading])

  return (
    <CloudSelectorContainer>
      <PureCloudContainer>
        {value && (
          <>
            <LetterValue>{value}</LetterValue>
            <h3>stands for:</h3>
          </>
        )}
      </PureCloudContainer>
      <SelectionContainer>
        <AttributeDisplay>{value ? words[count] : <>&nbsp;</>}</AttributeDisplay>
      </SelectionContainer>
    </CloudSelectorContainer>
  )
}

export default CloudSelector
