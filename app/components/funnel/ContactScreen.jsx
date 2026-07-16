'use client'
import { useState } from 'react'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function ContactScreen({ formData, setFormData, smsAgreed, setSmsAgreed, metatrideRemaining, triphaseRemaining, onNext, setPrivacyOpen, setTermsOpen }) {
  const [waitlistMode, setWaitlistMode] = useState(false)
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [waitlistError, setWaitlistError] = useState('')

  const selectedRemaining = formData.booster === 'MetaTride Ultra' ? metatrideRemaining : formData.booster === 'TriPhase MetaBurn' ? triphaseRemaining : null
  const isSoldOut = formData.booster && selectedRemaining !== null && selectedRemaining <= 0

  const goToShipping = () => {
    if (!formData.name || formData.name.trim().length < 2) { alert('Please enter your full name.'); return }
    const phoneClean = formData.phone.replace(/\D/g, '')
    if (phoneClean.length !== 10) { alert('Please enter a valid 10-digit phone number.'); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) { alert('Please enter a valid email address.'); return }
    if (!formData.booster) { alert('Please select your wellness booster.'); return }
    if (!smsAgreed) { alert('Please agree to the Terms and Conditions to continue.'); return }
    if (isSoldOut) { alert(`${formData.booster} is currently sold out. Please join the waiting list below.`); return }
    onNext()
  }

  const joinWaitlist = async () => {
    if (!formData.name || formData.name.trim().length < 2) { alert('Please enter your full name.'); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) { alert('Please enter a valid email address.'); return }

    setWaitlistSubmitting(true)
    setWaitlistError('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          product: formData.booster,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setWaitlistDone(true)
      } else {
        setWaitlistError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (e) {
      setWaitlistError('Something went wrong. Please try again.')
    } finally {
      setWaitlistSubmitting(false)
    }
  }

  if (waitlistDone) {
    return (
      <div style={cardStyle}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontStyle: 'italic', color: 'var(--gold-light)', marginBottom: '12px', textAlign: 'center' }}>You're on the list! ✳️</p>
        <p style={{ fontSize: '13px', color: 'var(--light-beige)', lineHeight: 1.7, textAlign: 'center' }}>We'll reach out the moment {formData.booster} is back in stock.</p>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginBottom: '18px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 700, color: 'var(--gold-light)', lineHeight: 1 }}>{metatrideRemaining}</div>
          <div style={{ fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5, marginTop: '4px' }}>MetaTride Spots</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 700, color: 'var(--gold-light)', lineHeight: 1 }}>{triphaseRemaining}</div>
          <div style={{ fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5, marginTop: '4px' }}>TriPhase Spots</div>
        </div>
      </div>

      <p style={labelStyle}>Contact Information</p>
      {['name', 'phone', 'email'].map(field => (
        <input
          key={field}
          type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
          placeholder={field === 'name' ? 'Full Name' : field === 'phone' ? 'Phone Number' : 'Email Address'}
          value={formData[field]}
          onChange={e => setFormData({ ...formData, [field]: e.target.value })}
          style={inputStyle}
        />
      ))}

      <p style={{ ...labelStyle, marginTop: '14px' }}>Select Your Wellness Booster</p>
      <select
        value={formData.booster}
        onChange={e => { setFormData({ ...formData, booster: e.target.value }); setWaitlistError('') }}
        style={{ ...inputStyle, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C8A88A' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', cursor: 'pointer' }}
      >
        <option value="" disabled>Choose Your Booster</option>
        <option value="MetaTride Ultra">MetaTride Ultra™ {metatrideRemaining <= 0 ? '(Sold Out)' : ''}</option>
        <option value="TriPhase MetaBurn">TriPhase MetaBurn™ {triphaseRemaining <= 0 ? '(Sold Out)' : ''}</option>
      </select>

      {formData.booster && !isSoldOut && (
        <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 18px', marginBottom: '14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--light-beige)', opacity: 0.6 }}>Monthly Investment</span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '44px', fontWeight: 600, color: 'var(--gold-light)', lineHeight: 1 }}>$45</span>
          <span style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--light-beige)', opacity: 0.6, marginTop: '2px' }}>Per Month · Cancel Anytime</span>
        </div>
      )}

      {isSoldOut && (
        <div style={{ border: '1px solid rgba(255,107,107,0.4)', borderRadius: '8px', padding: '14px 18px', marginBottom: '14px' }}>
          <p style={{ fontSize: '13px', color: '#ff6b6b', fontWeight: 600, marginBottom: '4px' }}>{formData.booster} is currently sold out</p>
          <p style={{ fontSize: '12px', color: 'var(--light-beige)', opacity: 0.7 }}>Enter your name and email above, then join the waiting list below.</p>
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '10px', opacity: 0.6, margin: '12px 0 16px', lineHeight: 1.6, cursor: 'pointer' }}>
        <input type="checkbox" checked={smsAgreed} onChange={e => setSmsAgreed(e.target.checked)} style={{ marginTop: '2px', accentColor: 'var(--gold)' }} />
        <span>
          I agree to receive SMS with my exclusive checkout link and agree to the{' '}
          <span onClick={() => setPrivacyOpen(true)} style={legalLinkStyle}>Privacy Policy</span> and{' '}
          <span onClick={() => setTermsOpen(true)} style={legalLinkStyle}>Terms of Service</span>.
        </span>
      </label>

      {waitlistError && <p style={{ fontSize: '12px', color: '#ff6b6b', marginBottom: '12px' }}>{waitlistError}</p>}

      {isSoldOut ? (
        <button onClick={joinWaitlist} disabled={waitlistSubmitting} style={submitBtnStyle}>
          {waitlistSubmitting ? 'Joining...' : 'Join the Waiting List →'}
        </button>
      ) : (
        <button onClick={goToShipping} style={submitBtnStyle}>Secure Checkout →</button>
      )}
      <p style={{ textAlign: 'center', fontSize: '9px', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Secure · Discreet · Cancel Anytime</p>
    </div>
  )
}

const cardStyle = { border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }
const labelStyle = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }
const inputStyle = { width: '100%', background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: '6px', padding: '13px 14px', color: 'var(--white)', fontSize: '13px', marginBottom: '10px', fontFamily: "'DM Sans', sans-serif", outline: 'none' }
const submitBtnStyle = { display: 'block', width: '100%', background: 'var(--gold)', color: 'var(--black)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', padding: '15px', borderRadius: '6px', border: 'none', cursor: 'pointer', marginBottom: '10px' }
const legalLinkStyle = { color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer' }