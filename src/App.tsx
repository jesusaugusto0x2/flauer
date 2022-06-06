import { Wrapper, Title, Image } from './components'
import Sunflower from './assets/sunflower.gif'

const App = () => {
  return (
    <Wrapper>
      <Title />
      <Image source={Sunflower} />
    </Wrapper>
  )
}

export default App
