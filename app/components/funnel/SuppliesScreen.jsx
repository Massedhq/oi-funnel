'use client'
import { useState } from 'react'

export default function SuppliesScreen({ onNext, onBack }) {
  const [supplies, setSupplies] = useState('none')

  const options = [
    { value: 'none', label: 'No thanks', price: null, desc: '' },
    { value: 'single', label: 'Single Supply', price: '+$1.75', desc: 'One set of syringes & alcohol pads' },
    { value: 'monthly', label: 'Month Supply', price: '+$7.00', desc: 'Full month of syringes & alcohol pads' },
  ]

  return (
    <div style={cardStyle}>
      <span style={labelStyle}>Syringes & Alcohol Pads</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {options.map(opt => (
          <div key={opt.value} onClick={() => setSupplies(opt.value)} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', borderRadius: '8px', border: `1px solid ${supplies === opt.value ? '#C8A88A' : 'rgba(200,168,138,0.2)'}`, cursor: 'pointer', background: supplies === opt.value ? 'rgba(200,168,138,0.08)' : 'transparent', transition: 'all 0.2s' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${supplies === opt.value ? '#C8A88A' : 'rgba(200,168,138,0.3)'}`, marginTop: '1px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {supplies === opt.value && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C8A88A' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '14px', color: '#D8C3B3', fontWeight: 600 }}>{opt.label}</p>
                {opt.price && <span style={{ fontSize: '13px', color: '#C8A88A', fontWeight: 600 }}>{opt.price}</span>}
              </div>
              {opt.desc && <p style={{ fontSize: '12px', opacity: 0.6, color: '#E8DDD2', marginTop: '2px' }}>{opt.desc}</p>}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => onNext(supplies)} style={primaryBtnStyle}>Continue →</button>
      <button onClick={onBack} style={backBtnStyle}>← Back</button>
    </div>
  )
}

const cardStyle = { background: '#161412', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const labelStyle = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C8A88A', marginBottom: '10px', display: 'block' }
const primaryBtnStyle = { display: 'block', width: '100%', background: '#C8A88A', color: '#050505', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', padding: '16px', borderRadius: '6px', border: 'none', cursor: 'pointer', marginBottom: '10px' }
const backBtnStyle = { width: '100%', background: 'transparent', border: 'none', color: '#C8A88A', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', cursor: 'pointer', display: 'block' }