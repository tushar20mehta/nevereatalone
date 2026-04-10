import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { Search, UtensilsCrossed, Plus, Map, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DinnerCard from '../components/DinnerCard'
import DinnerMap from '../components/DinnerMap'
import RecommendedDinners from '../components/RecommendedDinners'

const CUISINE_KEYS = ['all', 'italian', 'asian', 'german', 'mexican', 'indian', 'mediterranean', 'vegetarian']
// Maps translation key to English internal value stored on dinners (we keep German values in DB for backwards compat)
const CUISINE_VALUES = {
  all: 'Alle',
  italian: 'Italienisch',
  asian: 'Asiatisch',
  german: 'Deutsch',
  mexican: 'Mexikanisch',
  indian: 'Indisch',
  mediterranean: 'Mediterran',
  vegetarian: 'Vegetarisch'
}

export default function Entdecken() {
  const { t } = useTranslation()
  const [dinners, setDinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCuisine, setActiveCuisine] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(collection(db, 'dinners'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDinners(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsubscribe
  }, [])

  const filtered = dinners.filter((d) => {
    const matchesCuisine = activeCuisine === 'all' || d.cuisine === CUISINE_VALUES[activeCuisine]
    const matchesSearch = !searchTerm ||
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCuisine && matchesSearch
  })

  return (
    <>
      <section className="hero">
        <h1>{t('discover.heroTitle')} <em>{t('discover.heroTitleItalic')}</em></h1>
        <p>{t('discover.heroSubtitle')}</p>
        <div className="hero-buttons">
          <button className="btn btn-primary" onClick={() => navigate('/create')}><Plus size={18}/>{t('discover.hostDinner')}</button>
          <button className="btn btn-outline" onClick={() => document.querySelector('.search-section')?.scrollIntoView({behavior:'smooth'})}><UtensilsCrossed size={18}/>{t('discover.discoverDinner')}</button>
        </div>
      </section>

      <RecommendedDinners dinners={dinners} />

      <section className="search-section">
        <div className="search-bar">
          <Search size={20} className="search-icon"/>
          <input type="text" placeholder={t('discover.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
        </div>
        <div className="filter-row">
          <div className="filter-chips">
            {CUISINE_KEYS.map((key) => (
              <button key={key} className={`chip ${activeCuisine === key ? 'active' : ''}`} onClick={() => setActiveCuisine(key)}>
                {key === 'all' ? t('discover.all') : t(`discover.cuisines.${key}`)}
              </button>
            ))}
          </div>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label={t('discover.listView')}
            >
              <List size={18} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              aria-label={t('discover.mapView')}
            >
              <Map size={18} />
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading"><div className="spinner"/></div>
      ) : filtered.length > 0 ? (
        viewMode === 'list' ? (
          <div className="dinners-grid">{filtered.map((dinner) => (<DinnerCard key={dinner.id} dinner={dinner}/>))}</div>
        ) : (
          <div className="map-view-container">
            <DinnerMap dinners={filtered} onDinnerClick={(dinner) => navigate(`/dinner/${dinner.id}`)} />
          </div>
        )
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><UtensilsCrossed size={32}/></div>
          <h3>{t('discover.empty')}</h3>
          <p>{t('discover.emptySubtitle')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/create')}><Plus size={18}/>{t('discover.createNow')}</button>
        </div>
      )}
    </>
  )
}
