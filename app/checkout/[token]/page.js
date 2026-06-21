'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  const { token } = useParams()
  const [signup, setSignup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const [card, setCard] = useState(null)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/checkout/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); setLoading(false); return }
        setSignup(d)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  useEffect(() => {
    if (!signup || paid) return
    const script = document.createElement('script')
    script.src = 'https://web.squarecdn.com/v1/square.js'
    script.onload = async () => {
      const payments = window.Square.payments('sq0idp-AIJWRKIPpIwC4CPk3q4Qdw', 'LQA2D2J5740ZV')
      const c = await payments.card({
        style: {
          '.input-container': { borderColor: 'rgba(200,168,138,0.3)', borderRadius: '6px' },
          '.input-container.is-focus': { borderColor: '#C8A88A' },
          input: { color: '#F3ECE5', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' },
          'input::placeholder': { color: 'rgba(232,221,210,0.4)' },
        }
      })
      await c.attach('#card-container')
      setCard(c)
      setCardReady(true)
    }
    document.body.appendChild(script)
  }, [signup, paid])

  const handlePay = async () => {
    if (!card) return
    setPaying(true)
    setError('')
    try {
      const result = await card.tokenize()
      if (result.status !== 'OK') {
        setError('Card error — please check your details and try again.')
        setPaying(false)
        return
      }
      const res = await fetch(`/api/checkout/${token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: result.token }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setPaid(true)
      } else {
        setError(data.error || 'Payment failed. Please try again.')
      }
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return (
    <div style={pageStyle}>
      <p style={{color:'var(--gold)',fontSize:'13px',letterSpacing:'0.1em',textTransform:'uppercase'}}>Loading your order...</p>
    </div>
  )

  if (notFound) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'20px',color:'var(--gold-light)',marginBottom:'12px'}}>Link Not Found</p>
        <p style={{fontSize:'13px',opacity:0.7,lineHeight:1.7}}>This checkout link is invalid or has expired. Please contact us for assistance.</p>
      </div>
    </div>
  )

  if (paid) return (
    <div style={pageStyle}>
      <div style={{...cardStyle, textAlign:'center'}}>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'24px',fontStyle:'italic',color:'var(--gold-light)',marginBottom:'16px'}}>Order Complete! ✳️</p>
        <p style={{fontSize:'13px',color:'var(--light-beige)',lineHeight:1.7,marginBottom:'24px'}}>Thank you {signup?.name}! Your order has been placed and will ship soon. Check your email for confirmation.</p>
        <a href="https://www.facebook.com/share/g/17tA4EgWx8/" target="_blank" rel="noreferrer" style={{display:'block',width:'100%',background:'transparent',border:'1px solid var(--gold)',color:'var(--gold)',fontSize:'11px',fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',textAlign:'center',padding:'16px',borderRadius:'6px',textDecoration:'none'}}>Join Our Private Group →</a>
      </div>
    </div>
  )

  return (
    <div style={pageStyle}>
      <div style={{maxWidth:'420px',width:'100%'}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'8px'}}>OI Body Chemistry</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',fontWeight:700,color:'var(--white)',marginBottom:'6px'}}>Your Private Checkout</h1>
          <p style={{fontSize:'12px',opacity:0.5,letterSpacing:'0.04em'}}>This link is exclusive to you</p>
        </div>

        {/* Order Summary */}
        <div style={cardStyle}>
          <p style={labelStyle}>Order Summary</p>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
            <span style={{fontSize:'14px',color:'var(--gold-light)'}}>{signup?.booster}™</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'24px',fontWeight:700,color:'var(--gold-light)'}}>$45</span>
          </div>
          <p style={{fontSize:'11px',opacity:0.5,letterSpacing:'0.1em',textTransform:'uppercase'}}>Per Month · Cancel Anytime</p>
        </div>

        {/* Shipping Info */}
        <div style={cardStyle}>
          <p style={labelStyle}>Shipping To</p>
          <p style={{fontSize:'13px',lineHeight:1.9,opacity:0.85}}>
            {signup?.name}<br/>
            {signup?.ship_address}{signup?.ship_address2 ? `, ${signup.ship_address2}` : ''}<br/>
            {signup?.ship_city}, {signup?.ship_state} {signup?.ship_zip}
          </p>
        </div>

        {/* Card Form */}
        <div style={cardStyle}>
          <p style={labelStyle}>Payment Information</p>
          <div id="card-container" style={{minHeight:'90px',marginBottom:'16px'}} />
          {!cardReady && <p style={{fontSize:'11px',opacity:0.5,textAlign:'center',marginBottom:'16px'}}>Loading secure payment form...</p>}
          {error && <p style={{fontSize:'12px',color:'#ff6b6b',marginBottom:'12px',textAlign:'center'}}>{error}</p>}
          <button
            onClick={handlePay}
            disabled={!cardReady || paying}
            style={{display:'block',width:'100%',background: cardReady && !paying ? 'var(--gold)' : 'rgba(200,168,138,0.4)',color:'var(--black)',fontSize:'13px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',textAlign:'center',padding:'16px',borderRadius:'6px',border:'none',cursor: cardReady && !paying ? 'pointer' : 'not-allowed',transition:'all 0.2s'}}
          >
            {paying ? 'Processing...' : 'Complete Order — $45'}
          </button>
          <p style={{textAlign:'center',fontSize:'9px',opacity:0.4,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:'12px'}}>Secured by Square · SSL Encrypted</p>
        </div>

      </div>

      <style suppressHydrationWarning>{`
        :root {
          --black: #050505;
          --gold: #C8A88A;
          --gold-light: #D8C3B3;
          --warm: #161412;
          --border: rgba(200,168,138,0.3);
          --white: #FFFFFF;
          --light-beige: #E8DDD2;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050505; font-family: 'DM Sans', sans-serif; }
      `}</style>
    </div>
  )
}

const pageStyle = { minHeight:'100vh', background:'#050505', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px' }
const cardStyle = { background:'#161412', border:'1px solid rgba(200,168,138,0.3)', borderRadius:'12px', padding:'20px', marginBottom:'16px' }
const labelStyle = { fontSize:'10px', fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color:'#C8A88A', marginBottom:'12px' }