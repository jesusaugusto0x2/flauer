import React from 'react'
import { Wrapper, Structure } from './components'
import { store } from './store'
import { Provider } from 'react-redux'

const App: React.FC = () => (
  <Provider store={store}>
    <Wrapper>
      <Structure />
    </Wrapper>
  </Provider>
)

export default App
