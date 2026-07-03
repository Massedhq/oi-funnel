'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import ReviewGateScreen from '../../components/funnel/ReviewGateScreen'
import DosageScreen from '../../components/funnel/DosageScreen'
import SuppliesScreen from '../../components/funnel/SuppliesScreen'

export const dynamic = 'force-dynamic'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const MAX_ORDERS = 6
const FINAL_LINK = 'https://square.link/u/U89mkCMp'

export default function CheckoutPage() {
  const { token } = useParams()
  const [signup, setSignup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [screen, setScreen] = useState('loading')

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedDose, setSelectedDose] = useState(null)
  const [supplies, setSupplies] = useState('none')

  const [shipData, setShipData] = useState({ address:'', address2:'', city:'', state:'', zip:'' })
  const [billSameAsShip, setBillSameAsShip] = useState(true)
  const [billData, setBillData] = useState({ address:'', address2:'', city:'', state:'', zip:'' })

  const [card, setCard] = useState(null)
  const [cardReady, setCardReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const squareReady = useRef(false)

  useEffect(() => {
    fetch(`/api/checkout/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); setLoading(false); return }
        setSignup(d)
        setLoading(false)
        if (d.order_count >= MAX_ORDERS && d.review_submitted) setScreen('journeycomplete')
        else if (d.order_count >= 1 && !d.review_submitted) setScreen('review')
        else setScreen('dosage')
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

  useEffect(() => {
    if (screen !== 'payment' || squareReady.current) return

    const initSquare = async () => {
      try {
        const payments = window.Square.payments('sq0idp-AIJWRKIPpIwC4CPk3q4Qdw', 'LQA2D2J5740ZV')
        const total = getTotal()
        const paymentRequest = payments.paymentRequest({
          countryCode: 'US', currencyCode: 'USD',
          total: { amount: total, label: 'OI Body Chemistry' },
        })
        const c = await payments.card()
        await c.attach('#card-container')
        setCard(c)
        setCardReady(true)
        try { const ap = await payments.applePay(paymentRequest); await ap.attach('#apple-pay-button') } catch (e) {}
        try { const gp = await payments.googlePay(paymentRequest); await gp.attach('#google-pay-button') } catch (e) {}
        try {
          const ca = await payments.cashAppPay(paymentRequest, {
            redirectURL: window.location.href,
            referenceId: `oi-${token.substring(0, 20)}`,
          })
          await ca.attach('#cash-app-pay')
        } catch (e) {}
        squareReady.current = true
      } catch (e) { console.error('Square init error:', e) }
    }

    const timer = setTimeout(() => {
      if (window.Square) { initSquare() } else {
        const script = document.createElement('script')
        script.src = 'https://web.squarecdn.com/v1/square.js'
        script.onload = initSquare
        document.body.appendChild(script)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [screen])

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
      const noteLine = `OI Body Chemistry - ${selectedProduct || signup?.booster || ''} - ${signup?.name || ''}`.substring(0, 45)
      const res = await fetch(`/api/checkout/${token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: result.token,
          supplies,
          amount: getTotalCents(),
          product: selectedProduct,
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

  return (
    <div style={pageStyle}>
      <div style={{maxWidth:'420px',width:'100%'}}>

        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <p style={eyebrowStyle}>OI Body Chemistry</p>
          <h1 style={h1Style}>
            {screen==='review'          && 'Share Your Experience'}
            {screen==='dosage'          && 'Choose Your Dosage'}
            {screen==='supplies'        && 'Add Supplies'}
            {screen==='shipping'        && 'Shipping Address'}
            {screen==='payment'         && 'Complete Your Order'}
            {screen==='success'         && 'Order Confirmed'}
            {screen==='journeycomplete' && 'Journey Complete'}
          </h1>
          {['dosage','supplies','shipping','payment'].includes(screen) && (
            <p style={{fontSize:'11px',opacity:0.5,color:'#E8DDD2',marginTop:'4px'}}>Order {(signup?.order_count||0)+1} of {MAX_ORDERS}</p>
          )}
        </div>

        {['dosage','supplies','shipping','payment'].includes(screen) && (
          <div style={{display:'flex',gap:'4px',marginBottom:'20px'}}>
            {['dosage','supplies','shipping','payment'].map((s,i) => (
              <div key={s} style={{flex:1,height:'3px',borderRadius:'2px',background:
                i <= ['dosage','supplies','shipping','payment'].indexOf(screen)
                  ? '#C8A88A' : 'rgba(200,168,138,0.2)'}} />
            ))}
          </div>
        )}

        {screen==='journeycomplete' && (
          <div style={{...cardStyle,textAlign:'center'}}>
            <p style={{...headStyle,marginBottom:'12px'}}>You've completed your full dosage journey!</p>
            <p style={{...bodyStyle,marginBottom:'20px'}}>Thank you for being part of the OI Body Chemistry community. To continue your wellness journey, place your next order below.</p>
            <a href={FINAL_LINK} target="_blank" rel="noreferrer" style={primaryLinkStyle}>Continue My Order →</a>
            <a href="https://www.facebook.com/share/g/17tA4EgWx8/" target="_blank" rel="noreferrer" style={ghostBtnStyle}>Join Our Private Group →</a>
          </div>
        )}

        {screen==='review' && (
          <ReviewGateScreen
            token={token}
            onComplete={() => {
              if ((signup?.order_count || 0) >= MAX_ORDERS) setScreen('journeycomplete')
              else setScreen('dosage')
            }}
          />
        )}

        {screen==='dosage' && (
          <DosageScreen
            signup={signup}
            onNext={({ product, dose }) => { setSelectedProduct(product); setSelectedDose(dose); setScreen('supplies') }}
            onBack={() => {}}
          />
        )}

        {screen==='supplies' && (
          <SuppliesScreen
            onNext={(selectedSupplies) => { setSupplies(selectedSupplies); setScreen('shipping') }}
            onBack={() => setScreen('dosage')}
          />
        )}

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

        {screen==='payment' && (
          <div style={cardStyle}>
            <div style={{border:'1px solid rgba(200,168,138,0.2)',borderRadius:'8px',padding:'12px 16px',marginBottom:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                <span style={{fontSize:'13px',color:'#D8C3B3',fontWeight:600}}>
                  {selectedProduct || signup?.booster}™{selectedDose ? ` — ${selectedDose}mg` : ''}
                </span>
                <span style={{fontSize:'13px',color:'#D8C3B3'}}>$45.00</span>
              </div>
              {supplies==='single'  && <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>Single Supplies</span><span style={{fontSize:'12px',color:'#E8DDD2'}}>$1.75</span></div>}
              {supplies==='monthly' && <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>Monthly Supplies</span><span style={{fontSize:'12px',color:'#E8DDD2'}}>$7.00</span></div>}
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                <span style={{fontSize:'12px',opacity:0.6,color:'#E8DDD2'}}>Shipping</span>
                <span style={{fontSize:'12px',color:'#E8DDD2'}}>$8.90</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid rgba(200,168,138,0.2)',paddingTop:'8px'}}>
                <span style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.6,color:'#E8DDD2'}}>Total</span>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',fontWeight:700,color:'#D8C3B3'}}>${getTotal()}</span>
              </div>
            </div>

            <span style={labelStyle}>Payment</span>
            <div id="apple-pay-button" style={{marginBottom:'8px'}}/>
            <div id="google-pay-button" style={{marginBottom:'8px'}}/>
            <div id="cash-app-pay" style={{marginBottom:'12px'}}/>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
              <div style={{flex:1,height:'1px',background:'rgba(200,168,138,0.2)'}}/>
              <span style={{fontSize:'10px',opacity:0.4,letterSpacing:'0.1em',textTransform:'uppercase',color:'#E8DDD2'}}>or pay with card</span>
              <div style={{flex:1,height:'1px',background:'rgba(200,168,138,0.2)'}}/>
            </div>
            <div style={{background:'#fff',borderRadius:'8px',padding:'12px',marginBottom:'16px'}}>
              <div id="card-container" style={{minHeight:'160px'}}/>
            </div>
            {!cardReady && <p style={{fontSize:'11px',opacity:0.5,textAlign:'center',marginBottom:'16px',color:'#E8DDD2'}}>Loading secure payment form...</p>}
            {payError && <p style={{fontSize:'12px',color:'#ff6b6b',marginBottom:'12px',textAlign:'center'}}>{payError}</p>}
            <button
              onClick={handlePay}
              disabled={!cardReady||paying}
              style={{...primaryBtnStyle, opacity:cardReady&&!paying?1:0.5, cursor:cardReady&&!paying?'pointer':'not-allowed'}}
            >
              {paying ? 'Processing...' : `Complete Order — $${getTotal()}`}
            </button>
            <button onClick={() => setScreen('shipping')} style={backBtnStyle}>← Back</button>
            <p style={{textAlign:'center',fontSize:'9px',opacity:0.4,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:'8px',color:'#E8DDD2'}}>Secured by Square · SSL Encrypted</p>
          </div>
        )}

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

const pageStyle       = {minHeight:'100vh',background:'#050505',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px'}
const cardStyle       = {background:'#161412',border:'1px solid rgba(200,168,138,0.3)',borderRadius:'12px',padding:'20px',marginBottom:'16px'}
const eyebrowStyle    = {fontSize:'10px',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'#C8A88A',marginBottom:'8px'}
const h1Style         = {fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',fontWeight:700,color:'#fff',marginBottom:'4px'}
const headStyle       = {fontFamily:"'Cormorant Garamond',serif",fontSize:'20px',color:'#D8C3B3'}
const bodyStyle       = {fontSize:'13px',color:'#E8DDD2',lineHeight:1.7}
const labelStyle      = {fontSize:'10px',fontWeight:600,letterSpacing:'0.16em',textTransform:'uppercase',color:'#C8A88A',marginBottom:'10px',display:'block'}
const inputStyle      = {width:'100%',background:'#0d0b09',border:'1px solid rgba(200,168,138,0.3)',borderRadius:'6px',padding:'13px 14px',color:'#F3ECE5',fontSize:'13px',marginBottom:'10px',fontFamily:"'DM Sans',sans-serif",outline:'none',display:'block'}
const primaryBtnStyle = {display:'block',width:'100%',background:'#C8A88A',color:'#050505',fontSize:'13px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',textAlign:'center',padding:'16px',borderRadius:'6px',border:'none',cursor:'pointer',marginBottom:'10px',transition:'all 0.3s'}
const primaryLinkStyle= {display:'block',width:'100%',background:'#C8A88A',color:'#050505',fontSize:'13px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',textAlign:'center',padding:'16px',borderRadius:'6px',textDecoration:'none',marginBottom:'10px',transition:'all 0.3s'}
const ghostBtnStyle   = {display:'block',width:'100%',background:'transparent',border:'1px solid #C8A88A',color:'#C8A88A',fontSize:'11px',fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',textAlign:'center',padding:'16px',borderRadius:'6px',textDecoration:'none'}
const backBtnStyle    = {width:'100%',background:'transparent',border:'none',color:'#C8A88A',fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',padding:'10px',cursor:'pointer',display:'block'}