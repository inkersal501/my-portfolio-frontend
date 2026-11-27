
import './App.css'
import Home from './pages/Home'
import Drive from './pages/Drive'
import { Analytics } from "@vercel/analytics/react";

function App() {
  const isDriveRoute = window.location.pathname === '/drive' || window.location.pathname === '/drive/';
  return (
    <>
      {isDriveRoute ? <Drive /> : <Home />}
      <Analytics />
    </>
  )
}

export default App
