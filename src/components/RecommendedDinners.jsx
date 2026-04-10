import { useState, useEffect } from 'react'
import { collection, query, getDocs, doc, getDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Calendar, MapPin, Users, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function RecommendedDinners({ dinners }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const computeRecommendations = async () => {
      try {
        // Fetch user profile
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        if (!userSnap.exists()) { setLoading(false); return }

        const profile = userSnap.data()
        const preferences = (profile.cuisinePreferences || []).map(s => s.toLowerCase())
        const allergies = (profile.allergies || []).map(s => s.toLowerCase())
        const userLocation = (profile.city || profile.address || profile.location || '').toLowerCase()

        // If no preferences set, don't show recommendations
        if (preferences.length === 0 && allergies.length === 0 && !userLocation) {
          setLoading(false)
          return
        }

        // Filter future dinners only
        const today = new Date().toISOString().split('T')[0]
        const futureDinners = dinners.filter(d => d.date >= today && d.hostId !== user.uid)

        // Fetch host ratings in bulk
        const hostIds = [...new Set(futureDinners.map(d => d.hostId))]
        const hostRatings = {}

        for (const hostId of hostIds) {
          const hostedSnap = await getDocs(
            query(collection(db, 'dinners'), where('hostId', '==', hostId))
          )
          let allStars = []
          for (const dinnerDoc of hostedSnap.docs) {
            try {
              const ratingsSnap = await getDocs(collection(db, 'dinners', dinnerDoc.id, 'ratings'))
              ratingsSnap.docs.forEach(r => allStars.push(r.data().stars))
            } catch { /* no ratings */ }
          }
          if (allStars.length > 0) {
            hostRatings[hostId] = allStars.reduce((a, b) => a + b, 0) / allStars.length
          }
        }

        // Score each dinner
        const scored = futureDinners.map(dinner => {
          let score = 0

          // Cuisine match (+30)
          if (dinner.cuisine && preferences.includes(dinner.cuisine.toLowerCase())) {
            score += 30
          }

          // Allergy conflict (-100)
          if (allergies.length > 0 && dinner.description) {
            const desc = dinner.description.toLowerCase()
            for (const allergy of allergies) {
              if (desc.includes(allergy)) {
                score -= 100
                break
              }
            }
          }

          // Location match (+25)
          if (userLocation && dinner.location) {
            const dinnerLoc = dinner.location.toLowerCase()
            if (dinnerLoc.includes(userLocation) || userLocation.includes(dinnerLoc)) {
              score += 25
            }
          }

          // Host rating (+15 for 4+ stars)
          if (hostRatings[dinner.hostId] && hostRatings[dinner.hostId] >= 4) {
            score += 15
          }

          return { ...dinner, score }
        })

        // Sort by score descending, take top 5 with positive score
        const top = scored
          .filter(d => d.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)

        setRecommendations(top)
      } catch (err) {
        console.error('Recommendations error:', err)
      }
      setLoading(false)
    }

    if (dinners.length > 0) {
      computeRecommendations()
    } else {
      setLoading(false)
    }
  }, [user, dinners])

  if (!user || loading || recommendations.length === 0) return null

  return (
    <section className="recommended-section">
      <div className="recommended-header">
        <Sparkles size={20} />
        <h2>{t('discover.recommendedTitle')}</h2>
      </div>
      <div className="recommended-scroll">
        {recommendations.map(dinner => (
          <div
            key={dinner.id}
            className="recommended-card"
            onClick={() => navigate(`/dinner/${dinner.id}`)}
          >
            {dinner.imageUrl && (
              <img src={dinner.imageUrl} alt={dinner.title} className="recommended-card-image" />
            )}
            <div className="recommended-card-body">
              <span className="dinner-card-cuisine">{dinner.cuisine}</span>
              <h3>{dinner.title}</h3>
              {dinner.date && (
                <p className="recommended-card-meta"><Calendar size={13} /> {dinner.date}</p>
              )}
              {dinner.location && (
                <p className="recommended-card-meta"><MapPin size={13} /> {dinner.location}</p>
              )}
              {dinner.hostName && (
                <p className="recommended-card-host">{t('dinner.from')} {dinner.hostName}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
