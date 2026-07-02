'use client'
import { useState } from 'react'

export default function ReviewGateScreen({ token, onComplete }) {
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewReady, setReviewReady] = useState(false)

  const MIN_WORDS = 11
  const MAX_WORDS = 19
  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  const countWords = (str) => str.trim() === '' ? 0 : str.trim().split(/\s+/).filter(w => w.length > 0).length

  const handleReviewText = (e) => {
    const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0)
    let val = e.target.value
    if (words.length > MAX_WORDS) val = words.slice(0, MAX_WORDS).join(' ')
    setReviewText(val)
    setReviewReady(reviewRating > 0 && countWords(val) >= MIN_WORDS)
  }

  const handleReviewRating = (n) => {
    setReviewRating(n)
    setReviewReady(n > 0 && countWords(reviewText) >= MIN_WORDS)
  }

  const handleReview = async () => {
    if (!reviewReady) return
    setReviewSubmitting(true)
    setReviewError('')
    try {
      const res = await fetch(`/api/checkout/${token}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, review_text: reviewText }),
      })
      const data = await res.json()
      if (res.ok) { onComplete() }
      else { setReviewError(data.error || 'Something went wrong.') }
    } catch (e) { setReviewError('Network error. Please try again.') }
    finally { setReviewSubmitting(false) }
  }

  const wc = countWords(reviewText)

  return (
    <div style={cardStyle}>
      <p style={{ fontSize: '13px', color: '#E8DDD2', lineHeight: 1.7, marginBottom: '16px' }}>Please share your honest experience before your next order unlocks.</p>

      <span style={labelStyle}>Your Rating</span>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s} onClick={() => handleReviewRating(s)} style={{ fontSize: '32px', cursor: 'pointer', color: s <= reviewRating ? '#FFD700' : 'rgba(255,215,0,0.2)', transition: 'color 0.2s', userSelect: 'none' }}>★</span>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: reviewRating > 0 ? '#C8A88A' : 'rgba(200,168,138,0.5)', marginBottom: '14px', minHeight: '16px' }}>
        {reviewRating > 0 ? `${ratingLabels[reviewRating]} — ${reviewRating} star${reviewRating === 1 ? '' : 's'} selected` : 'Select your rating to continue.'}
      </p>

      <span style={labelStyle}>Your Review <span style={{ color: 'rgba(200,168,138,0.4)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(11–19 words)</span></span>
      <textarea
        value={reviewText}
        onChange={handleReviewText}
        onKeyDown={e => {
          if (wc >= MAX_WORDS) {
            const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
            if (!allowed.includes(e.key)) e.preventDefault()
          }
        }}
        placeholder="Share how OI Body Chemistry has helped your wellness journey..."
        style={{ width: '100%', background: '#0d0b09', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '6px', padding: '13px 14px', color: '#F3ECE5', fontSize: '13px', marginBottom: '6px', fontFamily: "'DM Sans',sans-serif", minHeight: '90px', resize: 'vertical', outline: 'none', display: 'block' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ fontSize: '11px', color: wc >= MIN_WORDS ? '#C8A88A' : 'rgba(200,168,138,0.5)' }}>{wc} / {MAX_WORDS} words</span>
        <span style={{ fontSize: '11px', color: wc >= MIN_WORDS ? '#C8A88A' : 'rgba(200,168,138,0.5)' }}>
          {wc >= MIN_WORDS ? (wc === MAX_WORDS ? 'Max reached' : 'Looks good!') : `${MIN_WORDS - wc} more word${MIN_WORDS - wc === 1 ? '' : 's'} needed`}
        </span>
      </div>

      {reviewError && <p style={{ fontSize: '12px', color: '#ff6b6b', marginBottom: '12px' }}>{reviewError}</p>}
      <button
        onClick={handleReview}
        disabled={reviewSubmitting}
        style={{ display: 'block', width: '100%', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', padding: '16px', borderRadius: '6px', border: 'none', background: reviewReady ? '#C8A88A' : 'rgba(200,168,138,0.15)', color: reviewReady ? '#050505' : 'rgba(200,168,138,0.4)', cursor: reviewReady ? 'pointer' : 'not-allowed', transition: 'all 0.3s' }}
      >
        {reviewSubmitting ? 'Submitting...' : reviewReady ? 'Start My Next Order →' : 'Complete both fields to unlock'}
      </button>
    </div>
  )
}

const cardStyle = { background: '#161412', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const labelStyle = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C8A88A', marginBottom: '10px', display: 'block' }