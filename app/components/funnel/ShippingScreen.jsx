'use client'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function ShippingScreen({ shipData, setShipData, billData, setBillData, billSameAsShip, setBillSameAsShip, loading, onNext, onBack }) {

  const lookupZip = async (zip, type) => {
    if (zip.length !== 5) return
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
      if (!res.ok) return
      const data = await res.json()
      const state = data.places?.[0]?.['state abbreviation']
      const city = data.places?.[0]?.['place name']
      if (state && type === 'ship') setShipData(d => ({ ...d, state, city: d.city || city }))
      if (state && type === 'bill') setBillData(d => ({ ...d, state, city: d.city || city }))
    } catch (e) {}
  }

  const handleNext = () => {
    if (!shipData.address || shipData.address.trim().length < 5) { alert('Please enter a valid street address.'); return }
    if (!shipData.city || shipData.city.trim().length < 2) { alert('Please enter a valid city.'); return }
    if (!shipData.state) { alert('Please select your state.'); return }
    if (shipData.zip.replace(/\D/g, '').length !== 5) { alert('Please enter a valid 5-digit ZIP code.'); return }
    if (!billSameAsShip) {
      if (!billData.address || !billData.city || !billData.state) { alert('Please complete your billing address.'); return }
      if (billData.zip.replace(/\D/g, '').length !== 5) { alert('Please enter a valid billing ZIP code.'); return }
    }
    onNext()
  }

  return (
    <div style={cardStyle}>
      <p style={labelStyle}>Shipping Address</p>
      <input placeholder="Street Address" value={shipData.address} onChange={e => setShipData({ ...shipData, address: e.target.value })} style={inputStyle} />
      <input placeholder="Apt, Suite, Unit (optional)" value={shipData.address2} onChange={e => setShipData({ ...shipData, address2: e.target.value })} style={inputStyle} />
      <input placeholder="City" value={shipData.city} onChange={e => setShipData({ ...shipData, city: e.target.value })} style={inputStyle} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <select value={shipData.state} onChange={e => setShipData({ ...shipData, state: e.target.value })} style={{ ...inputStyle, marginBottom: 0, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C8A88A' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', cursor: 'pointer' }}>
          <option value="" disabled>State</option>
          {STATES.map(s => <option key={s}>{s}</option>)}
        </select>
        <input placeholder="ZIP Code" value={shipData.zip} onChange={e => { setShipData({ ...shipData, zip: e.target.value }); lookupZip(e.target.value, 'ship') }} style={{ ...inputStyle, marginBottom: 0 }} />
      </div>

      <p style={{ ...labelStyle, marginTop: '14px' }}>Billing Address</p>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--light-beige)', marginBottom: '14px', cursor: 'pointer' }}>
        <input type="checkbox" checked={billSameAsShip} onChange={e => setBillSameAsShip(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
        Same as shipping address
      </label>

      {!billSameAsShip && (
        <>
          <input placeholder="Street Address" value={billData.address} onChange={e => setBillData({ ...billData, address: e.target.value })} style={inputStyle} />
          <input placeholder="Apt, Suite, Unit (optional)" value={billData.address2} onChange={e => setBillData({ ...billData, address2: e.target.value })} style={inputStyle} />
          <input placeholder="City" value={billData.city} onChange={e => setBillData({ ...billData, city: e.target.value })} style={inputStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <select value={billData.state} onChange={e => setBillData({ ...billData, state: e.target.value })} style={{ ...inputStyle, marginBottom: 0, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C8A88A' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', cursor: 'pointer' }}>
              <option value="" disabled>State</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
            <input placeholder="ZIP Code" value={billData.zip} onChange={e => { setBillData({ ...billData, zip: e.target.value }); lookupZip(e.target.value, 'bill') }} style={{ ...inputStyle, marginBottom: 0 }} />
          </div>
        </>
      )}

      <button onClick={handleNext} disabled={loading} style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1, marginTop: '8px' }}>
        {loading ? 'Processing...' : 'Complete Order →'}
      </button>
      <button onClick={onBack} style={backBtnStyle}>← Back</button>
      <p style={{ textAlign: 'center', fontSize: '9px', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Secure · Discreet · Cancel Anytime</p>
    </div>
  )
}

const cardStyle = { border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }
const labelStyle = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }
const inputStyle = { width: '100%', background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: '6px', padding: '13px 14px', color: 'var(--white)', fontSize: '13px', marginBottom: '10px', fontFamily: "'DM Sans', sans-serif", outline: 'none' }
const submitBtnStyle = { display: 'block', width: '100%', background: 'var(--gold)', color: 'var(--black)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', padding: '15px', borderRadius: '6px', border: 'none', cursor: 'pointer', marginBottom: '10px' }
const backBtnStyle = { width: '100%', background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px', cursor: 'pointer', display: 'block' }