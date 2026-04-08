import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Entdecken from './pages/Entdecken'
import Hosten from './pages/Hosten'
import MeineDinner from './pages/MeineDinner'
import Profil from './pages/Profil'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Entdecken />} />
          <Route path="/create" element={<Hosten />} />
          <Route path="/my-dinners" element={<MeineDinner />} />
          <Route path="/profile" element={<Profil />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
