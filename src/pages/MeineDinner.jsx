import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Plus, UtensilsCrossed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DinnerCard from '../components/DinnerCard'
import LoginModal from '../components/LoginModal'

export default function MeineDinner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('hosted')
  const [hostedDinners, setHostedDinners] = useState([])
  const [joinedDinners, setJoinedDinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const unsubHosted = onSnapshot(query(collection(db,'dinners'),where('hostId','==',user.uid),orderBy('createdAt','desc')), (snap) => { setHostedDinners(snap.docs.map((d) => ({id:d.id,...d.data()}))); setLoading(false) })
    const unsubJoined = onSnapshot(query(collection(db,'dinners'),where('guests','array-contains',user.uid),orderBy('createdAt','desc')), (snap) => { setJoinedDinners(snap.docs.map((d) => ({id:d.id,...d.data()}))) })
    return () => { unsubHosted(); unsubJoined() }
  }, [user])

  if (!user) {
    return (
      <div className="empty-state" style={{paddingTop:120}}>
        <div className="empty-state-icon"><UtensilsCrossed size={32}/></div>
        <h3>Anmeldung erforderlich</h3>
        <p>Melde dich an, um deine Dinner zu sehen.</p>
        <button className="btn btn-primary" onClick={() => setShowLogin(true)}>Anmelden</button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)}/>}
      </div>
    )
  }

  const currentDinners = tab === 'hosted' ? hostedDinners : joinedDinners

  return (
    <div className="my-dinners-page">
      <h1>Meine Dinner</h1>
      <p>Verwalte deine gehosteten und gebuchten Dinner.</p>
      <div className="my-dinners-tabs">
        <button className={`my-dinners-tab ${tab==='hosted'?'active':''}`} onClick={() => setTab('hosted')}>Gehostet ({hostedDinners.length})</button>
        <button className={`my-dinners-tab ${tab==='joined'?'active':''}`} onClick={() => setTab('joined')}>Teilgenommen ({joinedDinners.length})</button>
      </div>
      {loading ? (
        <div className="loading"><div className="spinner"/></div>
      ) : currentDinners.length > 0 ? (
        <div className="dinners-grid">{currentDinners.map((dinner) => (<DinnerCard key={dinner.id} dinner={dinner}/>))}</div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><UtensilsCrossed size={32}/></div>
          <h3>{tab==='hosted' ? 'Noch keine Dinner gehostet' : 'Noch an keinem Dinner teilgenommen'}</h3>
          <p>{tab==='hosted' ? 'Erstelle dein erstes Dinner!' : 'Entdecke Dinner in deiner Nähe!'}</p>
          <button className="btn btn-primary" onClick={() => navigate(tab==='hosted'?'/create':'/')}><Plus size={18}/>{tab==='hosted'?'Dinner erstellen':'Dinner entdecken'}</button>
        </div>
      )}
    </div>
  )
}
