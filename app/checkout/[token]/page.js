'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function CheckoutPage() {
  const { token } = useParams()
  const [signup, setSignup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [screen, setScreen] = useState('loading')

  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewReady, setReviewReady] = useState(false)

  const [selectedDose, setSelectedDose] = useState(null)
  const [supplies, setSupplies] = useState('none')

  const [shipData, setShipData] = useState({ address:'', address2:'', city:'', state:'', zip:'' })
  const [billSameAsShip, setBillSameAsShip] = useState(true)
  const [billData, setBillData] = useState({ address:'', address2:'', city:'', state:'', zip:'' })

  const [card, setCard] = useState(null)
  const [cardReady, setCardReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  // Track whether Square has been initialized for the current payment screen
  // to prevent double-attach across screen === 'checkout' and screen === 'payment'
  const squareInitializedFor = useRef(null)

  useEffect(() => {
    fetch(`/api/checkout/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); setLoading(false); return }
        setSignup(d)
        setLoading(false)
        if (d.order_count >= 3) setScreen('maxorders')
        else if (d.order_count >= 1 && !d.review_submitted) setScreen('review')
        else setScreen('checkout')
        setShipData({
          address:  d.ship_address  || '',
          address2: d.ship_address2 || '',
          city:     d.ship_city     || '',
          state:    d.ship_state    || '',
          zip:      d.ship_zip      || '',
        })
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  // Square init — fires when screen is 'checkout' (first order) or 'payment' (returning)
  // Uses a ref to prevent double-init if the component re-renders on the same screen
  useEffect(() => {
    const isPaymentScreen = screen === 'checkout' || screen === 'payment'
    if (!isPaymentScreen) return
    if (squareInitializedFor.current === screen) return

    const initSquare = async () => {
      try {
        const payments = window.Square.payments('sandbox-sq0idb-eRGofW4DzY5eJtTS6eGPpw', 'LQA2D2J5740ZV')

        const total = getTotal()

        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: { amount: total, label: 'OI Body Chemistry' },
        })

        // Card — attach to the correct container for this screen
        const containerId = screen === 'checkout' ? '#card-container-first' : '#card-container-return'
        const c = await payments.card()
        await c.attach(containerId)
        setCard(c)
        setCardReady(true)

        // Apple Pay
        const appleId = screen === 'checkout' ? '#apple-pay-first' : '#apple-pay-return'
        try {
          const ap = await payments.applePay(paymentRequest)
          await ap.attach(appleId)
        } catch (e) { console.log('Apple Pay not available') }

        // Google Pay
        const googleId = screen === 'checkout' ? '#google-pay-first' : '#google-pay-return'
        try {
          const gp = await payments.googlePay(paymentRequest)
          await gp.attach(googleId)
        } catch (e) { console.log('Google Pay not available') }

        // Cash App Pay
        const cashId = screen === 'checkout' ? '#cash-app-first' : '#cash-app-return'
        try {
          const ca = await payments.cashAppPay(paymentRequest, {
            redirectURL: window.location.href,
            referenceId: `oi-${token.substring(0, 20)}`,
          })
          await ca.attach(cashId)
        } catch (e) { console.log('Cash App Pay not available') }

        squareInitializedFor.current = screen
      } catch (e) { console.error('Square init error:', e) }
    }

    if (window.Square) {
      initSquare()
    } else {
      const script = document.createElement('script')
      script.src = 'https://sandbox.web.squarecdn.com/v1/square.js'
      script.onload = initSquare
      document.body.appendChild(script)
    }
  }, [screen])

  const countWords = (str) => str.trim() === '' ? 0 : str.trim().split(/\s+/).filter(w => w.length > 0).length
  const MIN_WORDS = 11
  const MAX_WORDS = 19

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
      if (res.ok) {
        setSignup(s => ({...s, review_submitted: true}))
        setScreen('dosage')
      } else {
        setReviewError(data.error || 'Something went wrong.')
      }
    } catch (e) { setReviewError('Network error. Please try again.') }
    finally { setReviewSubmitting(false) }
  }

  const getDoseOptions = () => {
    const booster = signup?.booster || ''
    const orderCount = signup?.order_count || 0
    if (orderCount === 1) return [
      { value: '2.5mg', label: 'Stay on 2.5mg', desc: 'Continue your current dose' },
      { value: '5mg',   label: 'Move up to 5mg', desc: 'Step up for enhanced results' },
    ]
    if (orderCount === 2) {
      const top = booster.includes('MetaTride') ? '7.5mg' : '8mg'
      return [
        { value: 'current', label: 'Stay on current dose', desc: 'Continue what is working' },
        { value: top,       label: `Move up to ${top}`,   desc: 'Final level for maximum results' },
      ]
    }
    return []
  }

  const getSuppliesAmount = () => supplies === 'single' ? 175 : supplies === 'monthly' ? 700 : 0
  const getTotalCents = () => 4500 + getSuppliesAmount() + 890
  const getTotal = () => (getTotalCents() / 100).toFixed(2)

  const handlePay = async () => {
    if (!card) return
    setPaying(true)
    setPayError('')
    try {
      const result = await card.tokenize()
      if (result.status !== 'OK') {
        setPayError(result.errors?.map(e => e.message).join(', ') || 'Please check your card details.')
        setPaying(false)
        return
      }
      const billing = billSameAsShip ? shipData : billData
      // note field capped at 45 chars to satisfy Square API limit
      const noteLine = `OI Body Chemistry - ${signup?.booster || ''} - ${signup?.name || ''}`.substring(0, 45)
      const res = await fetch(`/api/checkout/${token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: result.token,
          supplies,
          amount: getTotalCents(),
          dose: selectedDose,
          note: noteLine,
          ship_address:  shipData.address,
          ship_address2: shipData.address2,
          ship_city:     shipData.city,
          ship_state:    shipData.state,
          ship_zip:      shipData.zip,
          bill_address:  billing.address,
          bill_city:     billing.city,
          bill_state:    billing.state,
          bill_zip:      billing.zip,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) setScreen('success')
      else setPayError(data.error || 'Payment failed. Please try again.')
    } catch (e) { setPayError('Something went wrong. Please try again.') }
    finally { setPaying(false) }
  }

  const lookupZip = async (zip, type) => {
    if (zip.length !== 5) return
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
      if (!res.ok) return
      const data = await res.json()
      const state = data.places?.[0]?.['state abbreviation']
      const city  = data.places?.[0]?.['place name']
      if (type === 'ship') setShipData(d => ({...d, state: state||d.state, city: d.city||city}))
      if (type === 'bill') setBillData(d => ({...d, state: state||d.state, city: d.city||city}))
    } catch (e) {}
  }

  const wc = countWords(reviewText)
  const ratingLabels = ['','Poor','Fair','Good','Great','Excellent']

  if (loading) return (
    <div style={pageStyle}>
      <p style={{color:'#C8A88A',fontSize:'13px',letterSpacing:'0.1em',textTransform:'uppercase'}}>Loading your order...</p>
    </div>
  )

  if (notFound) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={headStyle}>Link Not Found</p>
        <p style={bodyStyle}>This checkout link is invalid or has expired. Please contact us for assistance.</p>
      </div>
    </div>
  )

  // Shared payment block — used inside both 'checkout' (first order) and 'payment' (returning) screens
  // isFirst determines which DOM IDs to use
  const PaymentBlock = ({ isFirst }) => (
    <>
      <span style={labelStyle}>Payment</span>
      <div id={isFirst ? 'apple-pay-first' : 'apple-pay-return'} style={{marginBottom:'8px'}}/>
      <div id={isFirst ? 'google-pay-first' : 'google-pay-return'} style={{marginBottom:'8px'}}/>
      <div id={isFirst ? 'cash-app-first' : 'cash-app-return'} style={{marginBottom:'12px'}}/>
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
        <div style={{flex:1,height:'1px',background:'rgba(200,168,138,0.2)'}}/>
        <span style={{fontSize:'10px',opacity:0.4,letterSpacing:'0.1em',textTransform:'uppercase',color:'#E8DDD2'}}>or pay with card</span>
        <div style={{flex:1,height:'1px',background:'rgba(200,168,138,0.2)'}}/>
      </div>
      <div style={{background:'#fff',borderRadius:'8px',padding:'12px',marginBottom:'16px'}}>
        <div id={isFirst ? 'card-container-first' : 'card-container-return'} style={{minHeight:'90px'}}/>
      </div>
      {!cardReady && <p style={{fontSize:'11px',opacity:0.5,textAlign:'center',marginBottom:'16px',color:'#E8DDD2'}}>Loading secure payment form...</p>}
      {payError && <p style={{fontSize:'12px',color:'#ff6b6b',marginBottom:'12px',textAlign:'center'}}>{payError}</p>}
      <button onClick={handlePay} disabled={!cardReady||paying} style={{...primaryBtnStyle, opacity:cardReady&&!paying?1:0.5, cursor:cardReady&&!paying?'pointer':'not-allowed'}}>
        {paying ? 'Processing...' : `Complete Order — $${getTotal()}`}
      </button>
      <p style={{textAlign:'center',fontSize:'9px',opacity:0.4,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:'8px',color:'#E8DDD2'}}>Secured by Square · SSL Encrypted</p>
    </>
  )

  return (
    <div style={pageStyle}>
      <div style={{maxWidth:'420px',width:'100%'}}>

        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <p style={eyebrowStyle}>OI Body Chemistry</p>
          <h1 style={h1Style}>
            {screen==='review'   && 'Share Your Experience'}
            {screen==='dosage'   && 'Choose Your Dosage'}
            {screen==='supplies' && 'Add Supplies'}
            {screen==='shipping' && 'Shipping Address'}
            {screen==='payment'  && 'Complete Your Order'}
            {screen==='success'  && 'Order Confirmed'}
            {screen==='maxorders'&& 'Journey Complete'}
            {screen==='checkout' && 'Your Private Checkout'}
          </h1>
          {['dosage','supplies','shipping','payment'].includes(screen) && (
            <p style={{fontSize:'11px',opacity:0.5,color:'#E8DDD2',marginTop:'4px'}}>Order {(signup?.order_count||0)+1} of 3</p>
          )}
        </div>

        {/* STEP PROGRESS BAR */}
        {['dosage','supplies','shipping','payment'].includes(screen) && (
          <div style={{display:'flex',gap:'4px',marginBottom:'20px'}}>
            {['dosage','supplies','shipping','payment'].map((s,i) => (
              <div key={s} style={{flex:1,height:'3px',borderRadius:'2px',background:
                i <= ['dosage','supplies','shipping','payment'].indexOf(screen)
                  ? '#C8A88A' : 'rgba(200,168,138,0.2)'}} />
            ))}
          </div>
        )}

        {/* MAX ORDERS */}
        {screen==='maxorders' && (
          <div style={{...cardStyle,textAlign:'center'}}>
            <p style={{...headStyle,marginBottom:'12px'}}>You have completed your 3-order journey!</p>
            <p style={{...bodyStyle,marginBottom:'20px'}}>Thank you for being part of the OI Body Chemistry community. Please reach out to us to continue your wellness journey.</p>
            <a href="https://www.facebook.com/share/g/17tA4EgWx8/" target="_blank" rel="noreferrer" style={ghostBtnStyle}>Join Our Private Group →</a>
          </div>
        )}

        {/* REVIEW GATE */}
        {screen==='review' && (
          <div style={cardStyle}>
            <p style={{...bodyStyle,marginBottom:'16px'}}>Please share your honest experience before your next order unlocks.</p>
            <span style={labelStyle}>Your Rating</span>
            <div style={{display:'flex',gap:'10px',marginBottom:'6px'}}>
              {[1,2,3,4,5].map(s => (
                <span key={s} onClick={() => handleReviewRating(s)} style={{fontSize:'32px',cursor:'pointer',color: s<=reviewRating ? '#FFD700' : 'rgba(255,215,0,0.2)',transition:'color 0.2s',userSelect:'none'}}>★</span>
              ))}
            </div>
            <p style={{fontSize:'11px',color: reviewRating>0 ? '#C8A88A' : 'rgba(200,168,138,0.5)',marginBottom:'14px',minHeight:'16px'}}>
              {reviewRating > 0 ? `${ratingLabels[reviewRating]} — ${reviewRating} star${reviewRating===1?'':'s'} selected` : 'Select your rating to continue.'}
            </p>
            <span style={labelStyle}>Your Review <span style={{color:'rgba(200,168,138,0.4)',fontWeight:400,textTransform:'none',letterSpacing:0}}>(11–19 words)</span></span>
            <textarea
              value={reviewText}
              onChange={handleReviewText}
              onKeyDown={e => {
                if (wc >= MAX_WORDS) {
                  const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End']
                  if (!allowed.includes(e.key)) e.preventDefault()
                }
              }}
              placeholder="Share how OI Body Chemistry has helped your wellness journey..."
              style={{width:'100%',background:'#0d0b09',border:'1px solid rgba(200,168,138,0.3)',borderRadius:'6px',padding:'13px 14px',color:'#F3ECE5',fontSize:'13px',marginBottom:'6px',fontFamily:"'DM Sans',sans-serif",minHeight:'90px',resize:'vertical',outline:'none',display:'block'}}
            />
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
              <span style={{fontSize:'11px',color: wc>=MIN_WORDS ? '#C8A88A' : 'rgba(200,168,138,0.5)'}}>{wc} / {MAX_WORDS} words</span>
              <span style={{fontSize:'11px',color: wc>=MIN_WORDS ? '#C8A88A' : 'rgba(200,168,138,0.5)'}}>
                {wc >= MIN_WORDS ? (wc===MAX_WORDS ? 'Max reached' : 'Looks good!') : `${MIN_WORDS-wc} more word${MIN_WORDS-wc===1?'':'s'} needed`}
              </span>
            </div>
            {reviewError && <p style={{fontSize:'12px',color:'#ff6b6b',marginBottom:'12px'}}>{reviewError}</p>}
            <button
              onClick={handleReview}
              disabled={reviewSubmitting}
              style={{
                display:'block',width:'100%',fontSize:'13px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',
                textAlign:'center',padding:'16px',borderRadius:'6px',border:'none',
                background: reviewReady ? '#C8A88A' : 'rgba(200,168,138,0.15)',
                color: reviewReady ? '#050505' : 'rgba(200,168,138,0.4)',
                cursor: reviewReady ? 'pointer' : 'not-allowed',
                transition:'all 0.3s',
              }}
            >
              {reviewSubmitting ? 'Submitting...' : reviewReady ? 'Start My Next Order →' : 'Complete both fields to unlock'}
            </button>
          </div>
        )}

        {/* DOSAGE */}
        {screen==='dosage' && (
          <div style={cardStyle}>
            <div style={{border:'1px solid rgba(200,168,138,0.2)',borderRadius:'8px',padding:'12px 16px',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontSize:'10px',textTransform:'uppercase',opacity:0.5,color:'#E8DDD2',marginBottom:'3px'}}>Your Booster</p>
                <p style={{fontSize:'14px',color:'#D8C3B3',fontWeight:600}}>{signup?.booster}™</p>
              </div>
            </div>
            <span style={labelStyle}>Select Your Dosage</span>
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
              {getDoseOptions().map(opt => (
                <div key={opt.value} onClick={() => setSelectedDose(opt.value)} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'14px',borderRadius:'8px',border:`1px solid ${selectedDose===opt.value ? '#C8A88A' : 'rgba(200,168,138,0.2)'}`,cursor:'pointer',background: selectedDose===opt.value ? 'rgba(200,168,138,0.08)' : 'transparent',transition:'all 0.2s'}}>
                  <div style={{width:'18px',height:'18px',borderRadius:'50%',border:`2px solid ${selectedDose===opt.value ? '#C8A88A' : 'rgba(200,168,138,0.3)'}`,marginTop:'1px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {selectedDose===opt.value && <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#C8A88A'}}/>}
                  </div>
                  <div>
                    <p style={{fontSize:'14px',color:'#D8C3B3',fontWeight:600,marginBottom:'3px'}}>{opt.label}</p>
                    <p style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => selectedDose && setScreen('supplies')}
              style={{...primaryBtnStyle, background: selectedDose ? '#C8A88A' : 'rgba(200,168,138,0.15)', color: selectedDose ? '#050505' : 'rgba(200,168,138,0.4)', cursor: selectedDose ? 'pointer' : 'not-allowed'}}
            >
              {selectedDose ? 'Continue →' : 'Select a dosage to continue'}
            </button>
          </div>
        )}

        {/* SUPPLIES */}
        {screen==='supplies' && (
          <div style={cardStyle}>
            <span style={labelStyle}>Syringes & Alcohol Pads</span>
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
              {[
                {value:'none',    label:'No thanks',       price:null,    desc:''},
                {value:'single',  label:'Single Supply',   price:'+$1.75', desc:'One set of syringes & alcohol pads'},
                {value:'monthly', label:'Month Supply',    price:'+$7.00', desc:'Full month of syringes & alcohol pads'},
              ].map(opt => (
                <div key={opt.value} onClick={() => setSupplies(opt.value)} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'14px',borderRadius:'8px',border:`1px solid ${supplies===opt.value ? '#C8A88A' : 'rgba(200,168,138,0.2)'}`,cursor:'pointer',background: supplies===opt.value ? 'rgba(200,168,138,0.08)' : 'transparent',transition:'all 0.2s'}}>
                  <div style={{width:'18px',height:'18px',borderRadius:'50%',border:`2px solid ${supplies===opt.value ? '#C8A88A' : 'rgba(200,168,138,0.3)'}`,marginTop:'1px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {supplies===opt.value && <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#C8A88A'}}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <p style={{fontSize:'14px',color:'#D8C3B3',fontWeight:600}}>{opt.label}</p>
                      {opt.price && <span style={{fontSize:'13px',color:'#C8A88A',fontWeight:600}}>{opt.price}</span>}
                    </div>
                    {opt.desc && <p style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2',marginTop:'2px'}}>{opt.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setScreen('shipping')} style={primaryBtnStyle}>Continue →</button>
            <button onClick={() => setScreen('dosage')} style={backBtnStyle}>← Back</button>
          </div>
        )}

        {/* SHIPPING */}
        {screen==='shipping' && (
          <div style={cardStyle}>
            <span style={labelStyle}>Shipping Address</span>
            <input placeholder="Street Address" value={shipData.address} onChange={e => setShipData({...shipData,address:e.target.value})} style={inputStyle}/>
            <input placeholder="Apt, Suite, Unit (optional)" value={shipData.address2} onChange={e => setShipData({...shipData,address2:e.target.value})} style={inputStyle}/>
            <input placeholder="City" value={shipData.city} onChange={e => setShipData({...shipData,city:e.target.value})} style={inputStyle}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
              <select value={shipData.state} onChange={e => setShipData({...shipData,state:e.target.value})} style={{...inputStyle,marginBottom:0,appearance:'none',backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C8A88A' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center',cursor:'pointer'}}>
                <option value="" disabled>State</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
              <input placeholder="ZIP Code" value={shipData.zip} onChange={e => {setShipData({...shipData,zip:e.target.value}); lookupZip(e.target.value,'ship')}} style={{...inputStyle,marginBottom:0}}/>
            </div>
            <span style={{...labelStyle,marginTop:'14px',display:'block'}}>Billing Address</span>
            <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'#E8DDD2',marginBottom:'12px',cursor:'pointer'}}>
              <input type="checkbox" checked={billSameAsShip} onChange={e => setBillSameAsShip(e.target.checked)} style={{accentColor:'#C8A88A'}}/>
              Same as shipping address
            </label>
            {!billSameAsShip && (
              <>
                <input placeholder="Street Address" value={billData.address} onChange={e => setBillData({...billData,address:e.target.value})} style={inputStyle}/>
                <input placeholder="Apt, Suite, Unit (optional)" value={billData.address2} onChange={e => setBillData({...billData,address2:e.target.value})} style={inputStyle}/>
                <input placeholder="City" value={billData.city} onChange={e => setBillData({...billData,city:e.target.value})} style={inputStyle}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                  <select value={billData.state} onChange={e => setBillData({...billData,state:e.target.value})} style={{...inputStyle,marginBottom:0,appearance:'none',backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C8A88A' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center',cursor:'pointer'}}>
                    <option value="" disabled>State</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <input placeholder="ZIP Code" value={billData.zip} onChange={e => {setBillData({...billData,zip:e.target.value}); lookupZip(e.target.value,'bill')}} style={{...inputStyle,marginBottom:0}}/>
                </div>
              </>
            )}
            <button onClick={() => {
              if (!shipData.address||!shipData.city||!shipData.state||!shipData.zip) { alert('Please complete your shipping address.'); return }
              setScreen('payment')
            }} style={{...primaryBtnStyle,marginTop:'8px'}}>Continue to Payment →</button>
            <button onClick={() => setScreen('supplies')} style={backBtnStyle}>← Back</button>
          </div>
        )}

        {/* PAYMENT — returning customer (order 2 or 3) */}
        {screen==='payment' && (
          <div style={cardStyle}>
            <div style={{border:'1px solid rgba(200,168,138,0.2)',borderRadius:'8px',padding:'12px 16px',marginBottom:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                <span style={{fontSize:'13px',color:'#D8C3B3',fontWeight:600}}>{signup?.booster}™{selectedDose ? ` — ${selectedDose}` : ''}</span>
                <span style={{fontSize:'13px',color:'#D8C3B3'}}>$45.00</span>
              </div>
              {supplies==='single'  && <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>Single Supplies</span><span style={{fontSize:'12px',color:'#E8DDD2'}}>$1.75</span></div>}
              {supplies==='monthly' && <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>Monthly Supplies</span><span style={{fontSize:'12px',color:'#E8DDD2'}}>$7.00</span></div>}
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><span style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>Shipping</span><span style={{fontSize:'12px',color:'#E8DDD2'}}>$8.90</span></div>
              <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid rgba(200,168,138,0.2)',paddingTop:'8px'}}>
                <span style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.6,color:'#E8DDD2'}}>Total</span>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',fontWeight:700,color:'#D8C3B3'}}>${getTotal()}</span>
              </div>
            </div>
            <PaymentBlock isFirst={false} />
            <button onClick={() => setScreen('shipping')} style={backBtnStyle}>← Back</button>
          </div>
        )}

        {/* FIRST ORDER CHECKOUT — order_count === 0 */}
        {screen==='checkout' && (
          <div style={cardStyle}>
            <div style={{border:'1px solid rgba(200,168,138,0.2)',borderRadius:'8px',padding:'12px 16px',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontSize:'10px',textTransform:'uppercase',opacity:0.5,color:'#E8DDD2',marginBottom:'3px'}}>Your Selection</p>
                <p style={{fontSize:'14px',color:'#D8C3B3',fontWeight:600}}>{signup?.booster}™</p>
              </div>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'24px',fontWeight:700,color:'#D8C3B3'}}>$45</span>
            </div>

            {/* SUPPLIES UPSELL */}
            <div style={{border:'1px solid rgba(200,168,138,0.2)',borderRadius:'8px',padding:'14px',marginBottom:'16px'}}>
              <span style={labelStyle}>Add On — Supplies</span>
              {[
                {value:'none',    label:'No thanks'},
                {value:'single',  label:'Single Supply',  price:'+$1.75'},
                {value:'monthly', label:'Month Supply',   price:'+$7.00'},
              ].map(opt => (
                <label key={opt.value} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px',cursor:'pointer'}}>
                  <input type="radio" name="supplies-first" value={opt.value} checked={supplies===opt.value} onChange={() => setSupplies(opt.value)} style={{accentColor:'#C8A88A'}}/>
                  <span style={{fontSize:'12px',color:'#E8DDD2'}}>{opt.label} {opt.price && <span style={{color:'#C8A88A',fontWeight:600}}>{opt.price}</span>}</span>
                </label>
              ))}
            </div>

            {/* ORDER TOTAL */}
            <div style={{marginBottom:'16px',paddingBottom:'12px',borderBottom:'1px solid rgba(200,168,138,0.2)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}><span style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>Booster</span><span style={{fontSize:'12px',color:'#E8DDD2'}}>$45.00</span></div>
              {supplies==='single'  && <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}><span style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>Single Supplies</span><span style={{fontSize:'12px',color:'#E8DDD2'}}>$1.75</span></div>}
              {supplies==='monthly' && <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}><span style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>Monthly Supplies</span><span style={{fontSize:'12px',color:'#E8DDD2'}}>$7.00</span></div>}
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}><span style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>Shipping</span><span style={{fontSize:'12px',color:'#E8DDD2'}}>$8.90</span></div>
              <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid rgba(200,168,138,0.2)',paddingTop:'10px'}}>
                <span style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.6,color:'#E8DDD2'}}>Total</span>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'24px',fontWeight:700,color:'#D8C3B3'}}>${getTotal()}</span>
              </div>
            </div>

            <PaymentBlock isFirst={true} />
          </div>
        )}

        {/* SUCCESS */}
        {screen==='success' && (
          <div style={{...cardStyle,textAlign:'center'}}>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',fontStyle:'italic',color:'#D8C3B3',marginBottom:'16px'}}>Order Complete! ✳️</p>
            <p style={{...bodyStyle,marginBottom:'24px'}}>Thank you {signup?.name}! Your order has been placed and will ship soon. Check your email for confirmation.</p>
            <a href="https://www.facebook.com/share/g/17tA4EgWx8/" target="_blank" rel="noreferrer" style={ghostBtnStyle}>Join Our Private Group →</a>
          </div>
        )}

      </div>

      <style suppressHydrationWarning>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#050505;font-family:'DM Sans',sans-serif;}
        select option{background:#161412;color:#F3ECE5;}
        textarea:focus{border-color:#C8A88A!important;}
        input[type="text"]:focus,input[type="tel"]:focus,input[type="email"]:focus{border-color:#C8A88A!important;}
      `}</style>
    </div>
  )
}

const pageStyle      = {minHeight:'100vh',background:'#050505',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px'}
const cardStyle      = {background:'#161412',border:'1px solid rgba(200,168,138,0.3)',borderRadius:'12px',padding:'20px',marginBottom:'16px'}
const eyebrowStyle   = {fontSize:'10px',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'#C8A88A',marginBottom:'8px'}
const h1Style        = {fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',fontWeight:700,color:'#fff',marginBottom:'4px'}
const headStyle      = {fontFamily:"'Cormorant Garamond',serif",fontSize:'20px',color:'#D8C3B3'}
const bodyStyle      = {fontSize:'13px',color:'#E8DDD2',lineHeight:1.7}
const labelStyle     = {fontSize:'10px',fontWeight:600,letterSpacing:'0.16em',textTransform:'uppercase',color:'#C8A88A',marginBottom:'10px',display:'block'}
const inputStyle     = {width:'100%',background:'#0d0b09',border:'1px solid rgba(200,168,138,0.3)',borderRadius:'6px',padding:'13px 14px',color:'#F3ECE5',fontSize:'13px',marginBottom:'10px',fontFamily:"'DM Sans',sans-serif",outline:'none',display:'block'}
const primaryBtnStyle= {display:'block',width:'100%',background:'#C8A88A',color:'#050505',fontSize:'13px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',textAlign:'center',padding:'16px',borderRadius:'6px',border:'none',cursor:'pointer',marginBottom:'10px',transition:'all 0.3s'}
const ghostBtnStyle  = {display:'block',width:'100%',background:'transparent',border:'1px solid #C8A88A',color:'#C8A88A',fontSize:'11px',fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',textAlign:'center',padding:'16px',borderRadius:'6px',textDecoration:'none'}
const backBtnStyle   = {width:'100%',background:'transparent',border:'none',color:'#C8A88A',fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',padding:'10px',cursor:'pointer',display:'block'}