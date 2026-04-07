import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, onRate, size = 20, readOnly = false }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hover || rating) ? 'star-filled' : ''}`}
          onClick={() => !readOnly && onRate && onRate(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          disabled={readOnly}
          aria-label={`${star} Stern${star > 1 ? 'e' : ''}`}
        >
          <Star size={size} fill={star <= (hover || rating) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}
