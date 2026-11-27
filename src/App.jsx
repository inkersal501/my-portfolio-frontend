
import './App.css'
import { lazy, Suspense } from 'react'
import Home from './pages/Home'
import { Analytics } from "@vercel/analytics/react";
const Drive = lazy(() => import('./pages/Drive'));

function App() {
  const isDriveRoute = window.location.pathname === '/drive' || window.location.pathname === '/drive/';
  return (
    <>
      {isDriveRoute ? <Suspense fallback={<div className="drive-loading">BUILDING THE WORLD...</div>}><Drive /></Suspense> : <Home />}
      <Analytics />
    </>
  )
}

export default App
