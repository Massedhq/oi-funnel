'use client'
import { useState } from 'react'

const PRICING = {
  'MetaTride Ultra': [
    { dose: 2.5, price: 78 },
    { dose: 5, price: 78 },
    { dose: 7.5, price: 78 },
    { dose: 10, price: 88 },
    { dose: 12, price: 88 },
    { dose: 15, price: 110 },
  ],
  'TriPhase MetaBurn': [
    { dose: 2.5, price: 88 },
    { dose: 5, price: 88 },
    { dose: 8, price: 120 },
    { dose: 10, price: 125 },
    { dose: 12, price: 130 },
  ],
}

const REP_CODES = {
  'ELOVE10': 'Erica',
  'QUITA10': 'Shuquila',
  'CHOC10': 'Deann',
  'OIBODY10': 'Avy',
}

export default function ExistingCustomerDosageScreen({ onNext, onBack }) {
  const [product, setProduct] = useState(null)
  const [selected, setSelected] = useState(null)
  const [repCode, setRepCode] = useState('')
  const [repError, setRepError] = useState('')

  const options = product ? PRICING[product] : []

  const validateRep = () => {
    if (!repCode.trim()) return { valid: true, rep: null }
    const match = REP_CODES[repCode.trim().toUpperCase()]
    if (!match) {
      setRepError('That code isn\'t recognized. Leave blank if you don\'t have a rep.')
      return { valid: false, rep: null }
    }
    setRepError('')
    return { valid: true, rep: match }
  }

  const handleContinue = () => {
    const { valid, rep } = validateRep()
    if (!valid) return
    const opt = options.find(o => o.dose === selected)
    if (opt) onNext({ product, dose: opt.dose, price: opt.price, repName: rep, repDiscount: rep ? 10 : 0 })
  }

  return (
    <div style={cardStyle}>
      <span style={labelStyle}>Choose Your Product</span>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {Object.keys(PRICING).map(p => (
          <div
            key={p}
            onClick={() => { setProduct(p); setSelected(null) }}
            style={{
              flex: 1, padding: '14px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
              border: `1px solid ${product === p ? '#C8A88A' : 'rgba(200,168,138,0.2)'}`,
              background: product === p ? 'rgba(200,168,138,0.08)' : 'transparent',
            }}
          >
            <p style={{ fontSize: '13px', color: '#D8C3B3', fontWeight: 600, margin: 0 }}>{p}</p>
          </div>
        ))}
      </div>

      {product && (
        <>
          <span style={labelStyle}>Choose Your Dosage</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {options.map(opt => (
              <div
                key={opt.dose}
                onClick={() => setSelected(opt.dose)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '8px', cursor: 'pointer',
                  border: `1px solid ${selected === opt.dose ? '#C8A88A' : 'rgba(200,168,138,0.2)'}`,
                  background: selected === opt.dose ? 'rgba(200,168,138,0.08)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${selected === opt.dose ? '#C8A88A' : 'rgba(200,168,138,0.3)'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selected === opt.dose && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C8A88A' }} />}
                  </div>
                  <p style={{ fontSize: '14px', color: '#D8C3B3', fontWeight: 600, margin: 0 }}>{opt.dose}mg</p>
                </div>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', fontWeight: 700, color: '#D8C3B3' }}>${opt.price}</span>
              </div>
            ))}
          </div>
        </>
      )}

<span style={labelStyle}>Your Rep Code <span style={{ color: 'rgba(200,168,138,0.4)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — $10 off if you have one)</span></span>      <input
        type="text"
        value={repCode}
        onChange={e => { setRepCode(e.target.value); setRepError('') }}
        placeholder="Enter code if you have a rep"
        style={inputStyle}
      />
      {repError && <p style={{ fontSize: '12px', color: '#ff6b6b', marginBottom: '12px' }}>{repError}</p>}

      <button
        onClick={handleContinue}
        disabled={!selected}
        style={{ ...primaryBtnStyle, background: selected ? '#C8A88A' : 'rgba(200,168,138,0.15)', color: selected ? '#050505' : 'rgba(200,168,138,0.4)', cursor: selected ? 'pointer' : 'not-allowed', marginTop: '16px' }}
      >
        {selected ? 'Continue →' : 'Select a product and dosage'}
      </button>
      {onBack && <button onClick={onBack} style={backBtnStyle}>← Back</button>}
    </div>
  )
}

const cardStyle = { background: '#161412', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const labelStyle = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C8A88A', marginBottom: '10px', display: 'block' }
const inputStyle = { width: '100%', background: '#0d0b09', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '6px', padding: '13px 14px', color: '#F3ECE5', fontSize: '13px', marginBottom: '10px', fontFamily: "'DM Sans',sans-serif", outline: 'none', display: 'block' }
const primaryBtnStyle = { display: 'block', width: '100%', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', padding: '16px', borderRadius: '6px', border: 'none', cursor: 'pointer', marginBottom: '10px', transition: 'all 0.3s' }
const backBtnStyle = { width: '100%', background: 'transparent', border: 'none', color: '#C8A88A', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', cursor: 'pointer', display: 'block' }