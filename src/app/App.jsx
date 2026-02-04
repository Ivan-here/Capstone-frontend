import { useState } from 'react'
import Splash from "../pages/Splash/Splash";


function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Locally - Capstone Frontend</h1>
          <p>Frontend is running </p>
    </div>
  )
}
<Route path="/" element={<Splash />} />


export default App
