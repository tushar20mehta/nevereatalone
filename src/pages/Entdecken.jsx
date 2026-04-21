import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { Search, UtensilsCrossed, Plus, Map, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DinnerCard from '../components/DinnerCard'
import DinnerMap from '../components/DinnerMap'
import RecommendedDinners from '../components/RecommendedDinners'
import { isPastDinner } from '../utils/dinner'

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

const CUISINE_IMAGES = {
  italian: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop&q=80',
  asian: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&q=80',
  german: 'https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=400&h=300&fit=crop&q=80',
  mexican: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop&q=80',
  indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&q=80',
  mediterranean: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop&q=80',
  vegetarian: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=80',
}

const CUISINE_EMOJI = {
  italian: '🍝',
  asian: '🍜',
  german: '🥨',
  mexican: '🌮',
  indian: '🍛',
  mediterranean: '🥗',
  vegetarian: '🥬',
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
    if (isPastDinner(d)) return false
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

      <section className="cuisine-cards-section">
        <h2 className="cuisine-cards-title">{t('discover.cuisinesTitle', 'Entdecke Küchen')}</h2>
        <div className="cuisine-cards-grid">
          {CUISINE_KEYS.filter(k => k !== 'all').map((key) => (
            <button
              key={key}
              className={`cuisine-card ${activeCuisine === key ? 'active' : ''}`}
              onClick={() => setActiveCuisine(activeCuisine === key ? 'all' : key)}
            >
              <img
                src={CUISINE_IMAGES[key]}
                alt={t(`discover.cuisines.${key}`)}
                className="cuisine-card-img"
                loading="lazy"
              />
              <div className="cuisine-card-overlay">
                <span className="cuisine-card-emoji">{CUISINE_EMOJI[key]}</span>
                <span className="cuisine-card-label">{t(`discover.cuisines.${key}`)}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

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
