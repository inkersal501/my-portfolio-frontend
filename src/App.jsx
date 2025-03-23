
import './App.css'
import Loading from './components/Loading';
import Home from './pages/Home'
import { useEffect, useState } from 'react'

function App() { 
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    setTimeout(()=>{
      setLoading(false);
    }, 800);
  }, [])
  return (
    <>  
      {loading? <Loading /> : <Home />}
    </>
  )
}

export default App
