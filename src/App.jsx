
import './App.css'
import Loading from './components/Loading';
import Home from './pages/Home'
import { useEffect, useState } from 'react'
import { Analytics } from "@vercel/analytics/react";

function App() { 
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    setTimeout(()=>{
      setLoading(false);
    }, 2500);
  }, []);
  return (
    <>  
      {loading? <Loading /> : <Home />}
      <Analytics />
    </>
  )
}

export default App
