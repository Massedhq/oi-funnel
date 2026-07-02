'use client'
import { useEffect, useState, useRef } from 'react'

export default function PaymentScreen({ formData, signupToken, onBack, onSuccess }) {
  const [supplies, setSupplies] = useState('none')
  const [card, setCard] = useState(null)
  const [cardReady, setCardReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [applePay, setApplePay] = useState(null)
  const [googlePay, setGooglePay] = useState(null)
  const [cashAppPay, setCashAppPay] = useState(null)
  const [applePayReady, setApplePayReady] = useState(false)
  const [googlePayReady, setGooglePayReady] = useState(false)
  const [cashAppReady, setCashAppReady] = useState(false)
  const squareInitialized = useRef(false)

  const getTotal = () => supplies === 'single' ? '55.65' : supplies === 'monthly' ? '60.90' : '53.90'
  const getTotalCents = () => supplies === 'single' ? 5565 : supplies === 'monthly' ? 6090 : 5390

  useEffect(() => {
    if (squareInitialized.current || !signupToken) return

    const initSquare = async () => {
      try {
        const payments = window.Square.payments(
          'sq0idp-AIJWRKIPpIwC4CPk3q4Qdw',
          'LQA2D2J5740ZV'
        )
        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: { amount: getTotal(), label: 'OI Body Chemistry' },
        })

        const c = await payments.card()
        await c.attach('#card-container-new')
        setCard(c)
        setCardReady(true)

        try {
          const ap = await payments.applePay(paymentRequest)
          await ap.attach('#apple-pay-new')
          setApplePay(ap)
          setApplePayReady(true)
        } catch (e) { console.error('APPLE PAY ERROR:', e) }

        try {
          const gp = await payments.googlePay(paymentRequest)
          await gp.attach('#google-pay-new')
          setGooglePay(gp)
          setGooglePayReady(true)
        } catch (e) { console.error('GOOGLE PAY ERROR:', e) }

        try {
          const ca = await payments.cashAppPay(paymentRequest, {
            redirectURL: window.location.href,
            referenceId: `oi-${signupToken.substring(0, 20)}`,
          })
          await ca.attach('#cash-app-new')
          setCashAppPay(ca)
          setCashAppReady(true)
        } catch (e) { console.error('CASH APP ERROR:', e) }

        squareInitialized.current = true
      } catch (e) { console.error('Square init error:', e) }
    }

    const timer = setTimeout(() => {
      if (window.Square) {
        initSquare()
      } else {
        const script = document.createElement('script')
        script.src = 'https://web.squarecdn.com/v1/square.js'
        script.onload = initSquare
        document.body.appendChild(script)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [signupToken])

  const submitPayment = async (sourceId) => {
    const noteLine = `OI Body Chemistry - ${formData.booster} - ${formData.name}`.substring(0, 45)
    const res = await fetch(`/api/checkout/${signupToken}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId, supplies, amount: getTotalCents(), note: noteLine }),
    })
    const data = await res.json()
    if (res.ok && data.success) { onSuccess() }
    else { setPayError(data.error || 'Payment failed. Please try again.') }
  }

  const handlePay = async (method = 'card') => {
    setPaying(true)
    setPayError('')
    try {
      let result
      if (method === 'apple') {
        if (!applePay) throw new Error('Apple Pay is not available on this device.')
        result = await applePay.tokenize()
      } else if (method === 'google') {
        if (!googlePay) throw new Error('Google Pay is not available.')
        result = await googlePay.tokenize()
      } else if (method === 'cashapp') {
        if (!cashAppPay) throw new Error('Cash App Pay is not available.')
        result = await cashAppPay.tokenize()
      } else {
        if (!card) throw new Error('Card is not ready.')
        result = await card.tokenize()
      }

      if (result.status !== 'OK') {
        setPayError(result.errors?.map(e => e.message).join(', ') || 'Please check your payment details.')
        return
      }

      const token = result.token
      if (!token) {
        setPayError('Payment token missing. Please try again.')
        return
      }

      await submitPayment(token)
    } catch (e) {
      setPayError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  const showDivider = applePayReady || googlePayReady || cashAppReady

  return (
    <div style={cardStyle}>

      {/* Selection summary */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '4px', color: 'var(--light-beige)' }}>Your Selection</p>
          <p style={{ fontSize: '14px', color: 'var(--gold-light)', fontWeight: 600, margin: 0 }}>{formData.booster}™</p>
        </div>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 700, color: 'var(--gold-light)' }}>$45</span>
      </div>

      {/* Supplies upsell */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
        <p style={labelStyle}>Add On — Supplies</p>
        {[
          { value: 'none', label: 'No thanks' },
          { value: 'single', label: 'Syringes & Alcohol Pads — Single Supply', price: '+$1.75' },
          { value: 'monthly', label: 'Syringes & Alcohol Pads — Month Supply', price: '+$7.00' },
        ].map(opt => (
          <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
            <input type="radio" name="supplies" value={opt.value} checked={supplies === opt.value} onChange={() => setSupplies(opt.value)} style={{ marginTop: '2px', accentColor: 'var(--gold)' }} />
            <span style={{ fontSize: '12px', color: 'var(--light-beige)' }}>
              {opt.label} {opt.price && <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{opt.price}</span>}
            </span>
          </label>
        ))}
      </div>

      {/* Order total */}
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', opacity: 0.6, color: 'var(--light-beige)' }}>Booster</span>
          <span style={{ fontSize: '12px', color: 'var(--light-beige)' }}>$45.00</span>
        </div>
        {supplies === 'single' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', opacity: 0.6, color: 'var(--light-beige)' }}>Single Supplies</span>
            <span style={{ fontSize: '12px', color: 'var(--light-beige)' }}>$1.75</span>
          </div>
        )}
        {supplies === 'monthly' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', opacity: 0.6, color: 'var(--light-beige)' }}>Monthly Supplies</span>
            <span style={{ fontSize: '12px', color: 'var(--light-beige)' }}>$7.00</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', opacity: 0.6, color: 'var(--light-beige)' }}>Shipping</span>
          <span style={{ fontSize: '12px', color: 'var(--light-beige)' }}>$8.90</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, color: 'var(--light-beige)' }}>Total</span>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '24px', fontWeight: 700, color: 'var(--gold-light)' }}>${getTotal()}</span>
        </div>
      </div>

      {/* Payment label */}
      <p style={labelStyle}>Payment Information</p>

      {/* Wallet divs — always in DOM, visibility toggled after Square confirms */}
      <div id="apple-pay-new" style={{ width: '100%', minHeight: '48px', marginBottom: applePayReady ? '8px' : '0', display: applePayReady ? 'block' : 'none' }} />
      <div id="google-pay-new" style={{ width: '100%', minHeight: '48px', marginBottom: googlePayReady ? '8px' : '0', display: googlePayReady ? 'block' : 'none' }} />
      <div id="cash-app-new" style={{ width: '100%', minHeight: '48px', marginBottom: cashAppReady ? '12px' : '0', display: cashAppReady ? 'block' : 'none' }} />

      {showDivider && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '10px', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--light-beige)' }}>or pay with card</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>
      )}

      {!showDivider && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '10px', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--light-beige)' }}>pay with card</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>
      )}

      {/* Card form */}
      <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
        <div id="card-container-new" style={{ minHeight: '90px' }} />
      </div>

      {!cardReady && <p style={{ fontSize: '11px', opacity: 0.5, textAlign: 'center', marginBottom: '16px', color: 'var(--light-beige)' }}>Loading secure payment form...</p>}
      {payError && <p style={{ fontSize: '12px', color: '#ff6b6b', marginBottom: '12px', textAlign: 'center' }}>{payError}</p>}

      <button onClick={() => handlePay('card')} disabled={!cardReady || paying} style={{ ...submitBtnStyle, opacity: cardReady && !paying ? 1 : 0.5, cursor: cardReady && !paying ? 'pointer' : 'not-allowed' }}>
        {paying ? 'Processing...' : `Complete Order — $${getTotal()}`}
      </button>
      <button onClick={onBack} style={backBtnStyle}>← Back</button>
      <p style={{ textAlign: 'center', fontSize: '9px', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '8px', color: 'var(--light-beige)' }}>Secured by Square · SSL Encrypted</p>
    </div>
  )
}

const cardStyle = { border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }
const labelStyle = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px', display: 'block' }
const submitBtnStyle = { display: 'block', width: '100%', background: 'var(--gold)', color: 'var(--black)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', padding: '15px', borderRadius: '6px', border: 'none', cursor: 'pointer', marginBottom: '10px' }
const backBtnStyle = { width: '100%', background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px', cursor: 'pointer', display: 'block' }