'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReviewFeed from '../components/funnel/ReviewFeed'

export default function OrderLookupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/order-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        router.push(`/order-checkout/${data.token}`)
      } else {
        setError(data.error || "We couldn't find an order under that email. Please check and try again.")
      }
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '420px', width: '100%' }}>

        <div style={{ textAlign: 'center', paddingTop: '8px' }}>
          <p style={brandStyle}>Orisha Infinity</p>
        </div>

        <div style={{ position: 'relative', height: '260px', marginTop: '20px', borderRadius: '16px', overflow: 'hidden' }}>
          <img src="/images/hero.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, #050505 100%)' }} />
        </div>

        <div style={{ padding: '0 4px', marginTop: '-24px', position: 'relative' }}>
          <p style={eyebrowStyle}>Welcome back</p>
          <h1 style={h1Style}>Continue your <em style={{ color: '#D8C3B3', fontStyle: 'italic' }}>journey</em></h1>

          <div style={cardStyle}>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              placeholder="you@email.com"
              style={inputStyle}
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button onClick={handleLookup} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Looking up your order...' : 'Find my order'}
            </button>
          </div>

          <p style={footerStyle}>
            Not a customer yet?{' '}
            <a href="https://www.oibodychemistry.com" style={linkStyle}>Join here</a>
          </p>
          <div style={{ marginTop: '32px' }}>
  <ReviewFeed />
</div>
        </div>

      </div>

      <style suppressHydrationWarning>{`
        * { box-sizing: border-box; }
        body { background: #050505; }
        input::placeholder { color: rgba(232,221,210,0.4); }
      `}</style>
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: '#050505', display: 'flex', justifyContent: 'center', padding: '24px 20px 60px', fontFamily: "'DM Sans', sans-serif" }
const brandStyle = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#C8A88A', margin: 0 }
const eyebrowStyle = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8A88A', marginBottom: '10px' }
const h1Style = { fontFamily: "'Cormorant Garamond', serif", fontSize: '30px', fontWeight: 600, lineHeight: 1.1, color: '#fff', marginBottom: '20px' }
const cardStyle = { background: '#161412', border: '1px solid rgba(200,168,138,0.35)', borderRadius: '12px', padding: '22px' }
const labelStyle = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8A88A', marginBottom: '10px', display: 'block' }
const inputStyle = { width: '100%', background: '#0d0b09', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '6px', padding: '14px', color: '#F3ECE5', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box' }
const btnStyle = { display: 'block', width: '100%', background: '#EFE6DD', color: '#050505', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '15px', borderRadius: '6px', border: 'none' }
const errorStyle = { fontSize: '12px', color: '#ff6b6b', marginBottom: '12px', textAlign: 'center' }
const footerStyle = { textAlign: 'center', fontSize: '11px', color: '#E8DDD2', opacity: 0.5, marginTop: '20px' }
const linkStyle = { color: '#C8A88A', textDecoration: 'underline' }