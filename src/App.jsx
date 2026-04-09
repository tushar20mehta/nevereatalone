import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Entdecken from './pages/Entdecken'
import Hosten from './pages/Hosten'
import MeineDinner from './pages/MeineDinner'
import DinnerDetail from './pages/DinnerDetail'
import ProfilePage from './pages/ProfilePage'
import StoebernPage from './pages/StoebernPage'
import RunningDinnerPage from './pages/RunningDinnerPage'
import RunningDinnerDetail from './pages/RunningDinnerDetail'
import ImpressumPage from './pages/ImpressumPage'
import DatenschutzPage from './pages/DatenschutzPage'
import CookieBanner from './components/CookieBanner'

function App() {
  return (
    <ToastProvider>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Entdecken />} />
            <Route path="/create" element={<Hosten />} />
            <Route path="/my-dinners" element={<MeineDinner />} />
            <Route path="/dinner/:id" element={<DinnerDetail />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:uid" element={<ProfilePage />} />
            <Route path="/stöbern" element={<StoebernPage />} />
            <Route path="/running-dinner" element={<RunningDinnerPage />} />
            <Route path="/running-dinner/:id" element={<RunningDinnerDetail />} />
            <Route path="/impressum" element={<ImpressumPage />} />
            <Route path="/datenschutz" element={<DatenschutzPage />} />
          </Routes>
        </main>
        <CookieBanner />
        <Footer />
      </div>
    </ToastProvider>
  )
}

export default App
