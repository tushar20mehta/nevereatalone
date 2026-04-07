import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Send, MessageCircle } from 'lucide-react'

export default function DinnerChat({ dinnerId, dinner }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const isParticipant = user && dinner && (
    dinner.hostId === user.uid ||
    (dinner.guests && dinner.guests.some(g => g.uid === user.uid))
  )

  useEffect(() => {
    if (!dinnerId) return

    const messagesRef = collection(db, 'dinners', dinnerId, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMessages(msgs)
    })

    return unsubscribe
  }, [dinnerId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || sending) return

    setSending(true)
    try {
      const messagesRef = collection(db, 'dinners', dinnerId, 'messages')
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        userId: user.uid,
        userName: user.displayName || 'Anonym',
        userPhoto: user.photoURL || null,
        createdAt: serverTimestamp()
      })
      setNewMessage('')
    } catch (error) {
      console.error('Nachricht senden fehlgeschlagen:', error)
    }
    setSending(false)
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate()
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate()
    const today = new Date()
    const msgDate = new Date(date)
    if (today.toDateString() === msgDate.toDateString()) return 'Heute'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (yesterday.toDateString() === msgDate.toDateString()) return 'Gestern'
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = msg.createdAt ? formatDate(msg.createdAt) : 'Heute'
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(msg)
    return groups
  }, {})

  if (!isParticipant) return null

  return (
    <div className="chat-section">
      <div className="chat-header">
        <MessageCircle size={20} />
        <h3>Gruppenchat</h3>
        <span className="chat-count">{messages.length} Nachrichten</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <MessageCircle size={32} />
            <p>Noch keine Nachrichten. Schreib die erste!</p>
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="chat-date-divider">
              <span>{date}</span>
            </div>
            {msgs.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.userId === user.uid ? 'chat-message-own' : ''}`}
              >
                {msg.userId !== user.uid && (
                  <div className="chat-message-avatar">
                    {msg.userPhoto ? (
                      <img src={msg.userPhoto} alt={msg.userName} />
                    ) : (
                      <span>{msg.userName?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                )}
                <div className="chat-message-content">
                  {msg.userId !== user.uid && (
                    <span className="chat-message-name">
                      {msg.userName}
                      {dinner.hostId === msg.userId && <span className="chat-host-badge">Host</span>}
                    </span>
                  )}
                  <div className="chat-bubble">
                    <p>{msg.text}</p>
                    <span className="chat-time">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="chat-input"
          maxLength={500}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!newMessage.trim() || sending}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
