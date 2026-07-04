'use client'

import { useState, useRef } from 'react'

export default function AdminShipPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [extracted, setExtracted] = useState(null) // { trackingNumber, recipientName, city, state, zip }
  const [candidates, setCandidates] = useState([])
  const [selectedEmail, setSelectedEmail] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

  const [sending, setSending] = useState(false)
  const [sentMessage, setSentMessage] = useState('')
  const [sendError, setSendError] = useState('')

  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')

  const [createForm, setCreateForm] = useState({
    name: '', email: '', phone: '', booster: '',
    shipAddress: '', shipAddress2: '', shipCity: '', shipState: '', shipZip: '',
  })
  const [createSendEmail, setCreateSendEmail] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [createMessage, setCreateMessage] = useState('')
  const [createError, setCreateError] = useState('')
  const [createLink, setCreateLink] = useState('')

  const fileInputRef = useRef(null)
  const galleryInputRef = useRef(null)

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

  // Auto-login if we already have the secret saved for this browser session
  useState(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('oi_admin_secret') : null
    if (saved) {
      setSecret(saved)
      setAuthed(true)
    }
  })

  const resetScan = () => {
    setExtracted(null)
    setCandidates([])
    setSelectedEmail('')
    setTrackingNumber('')
    setExtractError('')
    setSentMessage('')
    setSendError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const handlePhotoSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    resetScan()
    setExtracting(true)

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/admin/extract-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          imageBase64: base64,
          mediaType: file.type || 'image/jpeg',
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setExtractError(data.error || 'Could not read that label.')
        return
      }

      setExtracted(data.extracted)
      setTrackingNumber(data.extracted?.trackingNumber || '')
      setCandidates(data.candidates || [])
      if (data.candidates?.length === 1) {
        setSelectedEmail(data.candidates[0].email)
      }
    } catch (err) {
      setExtractError('Something went wrong reading the photo. Try again.')
    } finally {
      setExtracting(false)
    }
  }

  const handleConfirmSend = async () => {
    if (!selectedEmail || !trackingNumber) {
      setSendError('Select a customer and confirm the tracking number first.')
      return
    }
    setSending(true)
    setSendError('')
    try {
      const res = await fetch('/api/admin/ship-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          email: selectedEmail,
          carrier: 'USPS',
          trackingNumber,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error || 'Failed to send.')
        return
      }
      setSentMessage(data.message || 'Tracking email sent!')
    } catch (err) {
      setSendError(`Something went wrong: ${err.message || err}`)
    } finally {
      setSending(false)
    }
  }

  const handleResendLink = async () => {
    if (!resendEmail || !resendEmail.includes('@')) {
      setResendError('Enter a valid customer email.')
      return
    }
    setResendLoading(true)
    setResendError('')
    setResendMessage('')
    try {
      const res = await fetch('/api/admin/resend-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, email: resendEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResendError(data.error || 'Failed to resend link.')
        return
      }
      setResendMessage(data.message || 'Link resent!')
      setResendEmail('')
    } catch (err) {
      setResendError(`Something went wrong: ${err.message || err}`)
    } finally {
      setResendLoading(false)
    }
  }

  const updateCreateForm = (field) => (e) => {
    setCreateForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const handleCreateLink = async () => {
    const { name, email, shipAddress, shipCity, shipState, shipZip } = createForm
    if (!name || !email || !email.includes('@') || !shipAddress || !shipCity || !shipState || !shipZip) {
      setCreateError('Name, email, and full shipping address are required.')
      return
    }
    setCreateLoading(true)
    setCreateError('')
    setCreateMessage('')
    setCreateLink('')
    try {
      const res = await fetch('/api/admin/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, ...createForm, sendEmail: createSendEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create customer link.')
        return
      }
      setCreateMessage(data.warning || data.message || 'Done!')
      setCreateLink(data.link || '')
      setCreateForm({ name: '', email: '', phone: '', booster: '', shipAddress: '', shipAddress2: '', shipCity: '', shipState: '', shipZip: '' })
    } catch (err) {
      setCreateError(`Something went wrong: ${err.message || err}`)
    } finally {
      setCreateLoading(false)
    }
  }

  const page = { minHeight: '100vh', background: '#050505', color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif", padding: '24px', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' }
  const card = { width: '100%', maxWidth: '420px', boxSizing: 'border-box' }
  const label = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9971C', marginBottom: '8px', display: 'block' }
  const input = { width: '100%', background: '#161412', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '8px', padding: '14px', fontSize: '14px', color: '#fff', marginBottom: '14px', boxSizing: 'border-box' }
  const primaryBtn = { width: '100%', background: '#C9971C', color: '#000', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '15px', borderRadius: '8px', border: 'none', cursor: 'pointer', boxSizing: 'border-box' }
  const secondaryBtn = { width: '100%', background: 'transparent', color: '#C9971C', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '12px', borderRadius: '8px', border: '1px solid #C9971C', cursor: 'pointer', marginTop: '10px', boxSizing: 'border-box' }
  const cardBox = { background: '#161412', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxSizing: 'border-box' }

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
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', marginBottom: '6px' }}>Ship an Order</h1>
        <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '24px' }}>Take a photo of the USPS label to read the tracking number and match it to a customer.</p>

        {!extracted && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelected}
              style={{ display: 'none' }}
              id="label-photo-camera"
            />
            <label htmlFor="label-photo-camera" style={{ ...primaryBtn, display: 'block', textAlign: 'center', cursor: 'pointer' }}>
              {extracting ? 'Reading Label…' : (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Take Photo of Label
                </span>
              )}
            </label>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelected}
              style={{ display: 'none' }}
              id="label-photo-upload"
            />
            <label htmlFor="label-photo-upload" style={{ ...secondaryBtn, display: 'block', textAlign: 'center', cursor: 'pointer' }}>
              {extracting ? 'Reading Label…' : (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  Upload From Photos
                </span>
              )}
            </label>

            {extractError && <p style={{ color: '#E89BB5', fontSize: '12px', marginTop: '12px' }}>{extractError}</p>}
          </>
        )}

        {extracted && !sentMessage && (
          <div style={cardBox}>
            <p style={label}>Tracking Number (edit if needed)</p>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              style={input}
            />

            <p style={label}>Matched Customer</p>
            {candidates.length === 0 && (
              <p style={{ fontSize: '13px', color: '#E89BB5', marginBottom: '14px' }}>
                No match found for "{extracted.recipientName || 'unknown name'}". Double check the name/email in your records, or resend from the main admin route manually.
              </p>
            )}
            {candidates.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                {candidates.map((c) => (
                  <label key={c.email} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', border: selectedEmail === c.email ? '1.5px solid #C9971C' : '1px solid rgba(200,168,138,0.3)', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="candidate"
                      checked={selectedEmail === c.email}
                      onChange={() => setSelectedEmail(c.email)}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ fontSize: '12px', lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ opacity: 0.7 }}>{c.email}</div>
                      <div style={{ opacity: 0.7 }}>{c.ship_address}{c.ship_address2 ? `, ${c.ship_address2}` : ''}, {c.ship_city}, {c.ship_state} {c.ship_zip}</div>
                      <div style={{ opacity: 0.5 }}>Order #{c.order_count}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {sendError && <p style={{ color: '#E89BB5', fontSize: '12px', marginBottom: '10px' }}>{sendError}</p>}

            <button onClick={handleConfirmSend} disabled={sending || !selectedEmail} style={{ ...primaryBtn, opacity: sending || !selectedEmail ? 0.5 : 1, cursor: sending || !selectedEmail ? 'not-allowed' : 'pointer' }}>
              {sending ? 'Sending…' : 'Confirm & Send'}
            </button>
            <button onClick={resetScan} style={secondaryBtn}>Scan a Different Label</button>
          </div>
        )}

        {sentMessage && (
          <div style={cardBox}>
            <p style={{ color: '#D8C3B3', fontSize: '14px', marginBottom: '16px' }}>✓ {sentMessage}</p>
            <button onClick={resetScan} style={primaryBtn}>Ship Another Order</button>
          </div>
        )}

        <div style={{ borderTop: '1px solid rgba(200,168,138,0.3)', paddingTop: '24px', marginTop: '32px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', marginBottom: '6px' }}>Resend Order Link</h2>
          <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '16px' }}>
            Manually resend a customer's existing private order link (their current token — this won't generate a new one).
          </p>
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="customer@email.com"
            style={input}
            onKeyDown={(e) => e.key === 'Enter' && handleResendLink()}
          />
          {resendError && <p style={{ color: '#E89BB5', fontSize: '12px', marginBottom: '10px' }}>{resendError}</p>}
          {resendMessage && <p style={{ color: '#D8C3B3', fontSize: '12px', marginBottom: '10px' }}>✓ {resendMessage}</p>}
          <button
            onClick={handleResendLink}
            disabled={resendLoading}
            style={{ ...primaryBtn, opacity: resendLoading ? 0.6 : 1, cursor: resendLoading ? 'not-allowed' : 'pointer' }}
          >
            {resendLoading ? 'Sending…' : 'Resend Link'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid rgba(200,168,138,0.3)', paddingTop: '24px', marginTop: '32px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', marginBottom: '6px' }}>Create Manual Order Link</h2>
          <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '16px' }}>
            For a customer who paid you directly (outside the funnel) — whether they have no record at all, or only a partial signup with no completed order. This activates their account, counts their manual payment as Order #1, and generates their link for Order #2 onward.
          </p>

          <p style={label}>Full Name</p>
          <input type="text" value={createForm.name} onChange={updateCreateForm('name')} style={input} placeholder="Jane Doe" />

          <p style={label}>Email</p>
          <input type="email" value={createForm.email} onChange={updateCreateForm('email')} style={input} placeholder="jane@email.com" />

          <p style={label}>Phone (optional)</p>
          <input type="text" value={createForm.phone} onChange={updateCreateForm('phone')} style={input} placeholder="2145551234" />

          <p style={label}>Product</p>
          <input type="text" value={createForm.booster} onChange={updateCreateForm('booster')} style={input} placeholder="MetaTride Ultra" />

          <p style={label}>Shipping Address</p>
          <input type="text" value={createForm.shipAddress} onChange={updateCreateForm('shipAddress')} style={input} placeholder="Street address" />
          <input type="text" value={createForm.shipAddress2} onChange={updateCreateForm('shipAddress2')} style={input} placeholder="Apt / Unit (optional)" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" value={createForm.shipCity} onChange={updateCreateForm('shipCity')} style={{ ...input, flex: 2 }} placeholder="City" />
            <input type="text" value={createForm.shipState} onChange={updateCreateForm('shipState')} style={{ ...input, flex: 1 }} placeholder="TX" />
            <input type="text" value={createForm.shipZip} onChange={updateCreateForm('shipZip')} style={{ ...input, flex: 1 }} placeholder="Zip" />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '14px', cursor: 'pointer' }}>
            <input type="checkbox" checked={createSendEmail} onChange={(e) => setCreateSendEmail(e.target.checked)} />
            Email the link to the customer automatically
          </label>

          {createError && <p style={{ color: '#E89BB5', fontSize: '12px', marginBottom: '10px' }}>{createError}</p>}
          {createMessage && <p style={{ color: '#D8C3B3', fontSize: '12px', marginBottom: '10px' }}>✓ {createMessage}</p>}
          {createLink && (
            <p style={{ fontSize: '11px', wordBreak: 'break-all', background: '#161412', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '6px', padding: '10px', marginBottom: '14px' }}>
              {createLink}
            </p>
          )}

          <button
            onClick={handleCreateLink}
            disabled={createLoading}
            style={{ ...primaryBtn, opacity: createLoading ? 0.6 : 1, cursor: createLoading ? 'not-allowed' : 'pointer' }}
          >
            {createLoading ? 'Creating…' : 'Create Customer & Link'}
          </button>
        </div>
      </div>
    </div>
  )
}