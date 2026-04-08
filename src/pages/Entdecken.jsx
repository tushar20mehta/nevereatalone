import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { Search, UtensilsCrossed, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DinnerCard from '../components/DinnerCard'

const CUISINES = [
  'Alle', 'Italienisch', 'Asiatisch', 'Deutsch',
  'Mexikanisch', 'Indisch', 'Mediterran', 'Vegetarisch'
]

export default function Entdecken() {
  const [dinners, setDinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCuisine, setActiveCuisine] = useState('Alle')
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(collection(db, 'dinners'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setDinners(data)
      setLoading(false)
    }, (error) => {
      console.error('Fehler beim Laden der Dinner:', error)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const filtered = dinners.filter((d) => {
    const matchesCuisine = activeCuisine === 'Alle' || d.cuisine === activeCuisine
    const matchesSearch =
      !searchTerm ||
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCuisine && matchesSearch
  })

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <h1>
          Gemeinsam essen, <em>gemeinsam leben.</em>
        </h1>
        <p>
          Finde Abendessen in deiner Nähe oder lade andere zu dir ein.
          Niemand sollte alleine essen müssen.
        </p>
        <div className="hero-buttons">
          <button className="btn btn-primary" onClick={() => navigate('/create')}>
            <Plus size={18} />
            Dinner hosten
          </button>
          <button className="btn btn-outline" onClick={() => {
            document.querySelector('.search-section')?.scrollIntoView({ behavior: 'smooth' })
          }}>
            <UtensilsCrossed size={18} />
            Dinner entdecken
          </button>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="search-section">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Suche nach Dinner, Ort..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {CUISINES.map((c) => (
            <button
              key={c}
              className={`chip ${activeCuisine === c ? 'active' : ''}`}
              onClick={() => setActiveCuisine(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Dinner List */}
      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="dinners-grid">
          {filtered.map((dinner) => (
            <DinnerCard key={dinner.id} dinner={dinner} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <UtensilsCrossed size={32} />
          </div>
          <h3>Noch keine Dinner</h3>
          <p>Sei die erste Person, die ein Dinner hostet!</p>
          <button className="btn btn-primary" onClick={() => navigate('/create')}>
            <Plus size={18} />
            Jetzt Dinner erstellen
          </button>
        </div>
      )}
    </>
  )
}
