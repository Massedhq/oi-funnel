'use client'

import { useState, useEffect } from 'react'

export default function AdminReviewsPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('oi_admin_secret') : null
    if (saved) {
      setSecret(saved)
      setAuthed(true)
    }
  }, [])

  useEffect(() => {
    if (authed) fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  const handleLogin = async () => {
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        sessionStorage.setItem('oi_admin_secret', secret)
        setAuthed(true)
      } else {
        setAuthError(data.error || 'Incorrect password.')
      }
    } catch (err) {
      setAuthError('Something went wrong. Try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const fetchReviews = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetch(`/api/admin/reviews?secret=${encodeURIComponent(secret)}`)
      const data = await res.json()
      if (!res.ok) {
        setLoadError(data.error || 'Failed to load reviews.')
        return
      }
      setReviews(data.reviews || [])
    } catch (err) {
      setLoadError(`Something went wrong: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, id }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to delete review.')
        return
      }
      setReviews((r) => r.filter((rev) => rev.id !== id))
      setConfirmId(null)
    } catch (err) {
      alert(`Something went wrong: ${err.message || err}`)
    } finally {
      setDeletingId(null)
    }
  }

  const page = { minHeight: '100vh', background: '#050505', color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif", padding: '24px', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' }
  const card = { width: '100%', maxWidth: '560px', boxSizing: 'border-box' }
  const label = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9971C', marginBottom: '8px', display: 'block' }
  const input = { width: '100%', background: '#161412', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '8px', padding: '14px', fontSize: '14px', color: '#fff', marginBottom: '14px', boxSizing: 'border-box' }
  const primaryBtn = { width: '100%', background: '#C9971C', color: '#000', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '15px', borderRadius: '8px', border: 'none', cursor: 'pointer', boxSizing: 'border-box' }
  const cardBox = { background: '#161412', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxSizing: 'border-box' }

  if (!authed) {
    return (
      <div style={page}>
        <div style={card}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', marginBottom: '20px' }}>Admin Login</h1>
          <label style={label}>Admin Password</label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={input}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {authError && <p style={{ color: '#E89BB5', fontSize: '12px', marginBottom: '12px' }}>{authError}</p>}
          <button onClick={handleLogin} disabled={authLoading} style={primaryBtn}>
            {authLoading ? 'Checking…' : 'Log In'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', marginBottom: '6px' }}>Customer Reviews</h1>
        <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '24px' }}>
          {loading ? 'Loading…' : `${reviews.length} review${reviews.length === 1 ? '' : 's'} on file`}
        </p>

        {loadError && <p style={{ color: '#E89BB5', fontSize: '12px', marginBottom: '16px' }}>{loadError}</p>}

        {!loading && reviews.length === 0 && !loadError && (
          <p style={{ fontSize: '13px', opacity: 0.6 }}>No reviews yet.</p>
        )}

        {reviews.map((rev) => (
          <div key={rev.id} style={cardBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{rev.name}</div>
                <div style={{ fontSize: '11px', opacity: 0.5 }}>{rev.email}</div>
              </div>
              <div style={{ fontSize: '13px', color: '#C9971C', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
              </div>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.6, opacity: 0.85, marginBottom: '10px' }}>{rev.review_text}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', opacity: 0.4 }}>
                Order #{rev.order_number} · {new Date(rev.created_at).toLocaleDateString()}
              </span>
              {confirmId === rev.id ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDelete(rev.id)}
                    disabled={deletingId === rev.id}
                    style={{ background: '#E89BB5', color: '#000', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '7px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  >
                    {deletingId === rev.id ? 'Deleting…' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    style={{ background: 'transparent', color: '#fff', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', padding: '7px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(rev.id)}
                  style={{ background: 'transparent', color: '#E89BB5', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', padding: '7px 12px', borderRadius: '6px', border: '1px solid rgba(232,155,181,0.4)', cursor: 'pointer' }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}