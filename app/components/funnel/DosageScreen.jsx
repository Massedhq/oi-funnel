'use client'
import { useState } from 'react'

const LADDER = [2.5, 5, 7.5, 10, 12, 15]

const getOtherProduct = (product) =>
  product === 'MetaTride Ultra' ? 'TriPhase MetaBurn' : 'MetaTride Ultra'

const getNextDose = (current) => {
  const idx = LADDER.indexOf(Number(current))
  if (idx === -1 || idx === LADDER.length - 1) return null
  return LADDER[idx + 1]
}

export default function DosageScreen({ signup, onNext, onBack }) {
  const [selected, setSelected] = useState(null)

  const currentProduct = signup?.booster || 'MetaTride Ultra'
  const currentDose = Number(signup?.current_dosage) || 2.5
  const orderCount = signup?.order_count || 0
  const nextDose = getNextDose(currentDose)
  const otherProduct = getOtherProduct(currentProduct)

  // First order: no history yet — starts everyone at 2.5mg, no choice needed
  if (orderCount === 0) {
    return (
      <div style={cardStyle}>
        <p style={{ fontSize: '13px', color: '#E8DDD2', lineHeight: 1.7, marginBottom: '16px' }}>
          Your journey begins at 2.5mg on {currentProduct}™.
        </p>
        <button
          onClick={() => onNext({ product: currentProduct, dose: 2.5 })}
          style={{ ...primaryBtnStyle, background: '#C8A88A', color: '#050505', cursor: 'pointer' }}
        >
          Continue →
        </button>
      </div>
    )
  }

  const options = [
    { key: 'stay', product: currentProduct, dose: currentDose,
      label: `Stay on ${currentProduct}`, desc: `Continue at ${currentDose}mg` },
    { key: 'switch', product: otherProduct, dose: currentDose,
      label: `Switch to ${otherProduct}`, desc: `Same dose, new formula — ${currentDose}mg` },
  ]

  if (nextDose) {
    options.push({
      key: 'continue', product: currentProduct, dose: nextDose,
      label: `Move up to ${nextDose}mg`, desc: `Step up on ${currentProduct}`,
    })
  }

  return (
    <div style={cardStyle}>
      <div style={{ border: '1px solid rgba(200,168,138,0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
        <p style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.5, color: '#E8DDD2', marginBottom: '3px' }}>Currently On</p>
        <p style={{ fontSize: '14px', color: '#D8C3B3', fontWeight: 600 }}>{currentProduct}™ — {currentDose}mg</p>
      </div>

      <span style={labelStyle}>Choose Your Next Order</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {options.map(opt => (
          <div
            key={opt.key}
            onClick={() => setSelected(opt.key)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', borderRadius: '8px',
              border: `1px solid ${selected === opt.key ? '#C8A88A' : 'rgba(200,168,138,0.2)'}`,
              cursor: 'pointer',
              background: selected === opt.key ? 'rgba(200,168,138,0.08)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${selected === opt.key ? '#C8A88A' : 'rgba(200,168,138,0.3)'}`, marginTop: '1px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selected === opt.key && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C8A88A' }} />}
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#D8C3B3', fontWeight: 600, marginBottom: '3px' }}>{opt.label}</p>
              <p style={{ fontSize: '12px', opacity: 0.6, color: '#E8DDD2' }}>{opt.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          const opt = options.find(o => o.key === selected)
          if (opt) onNext({ product: opt.product, dose: opt.dose })
        }}
        style={{ ...primaryBtnStyle, background: selected ? '#C8A88A' : 'rgba(200,168,138,0.15)', color: selected ? '#050505' : 'rgba(200,168,138,0.4)', cursor: selected ? 'pointer' : 'not-allowed' }}
      >
        {selected ? 'Continue →' : 'Select an option to continue'}
      </button>
    </div>
  )
}

const cardStyle = { background: '#161412', border: '1px solid rgba(200,168,138,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const labelStyle = { fontSize: '10px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C8A88A', marginBottom: '10px', display: 'block' }
const primaryBtnStyle = { display: 'block', width: '100%', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', padding: '16px', borderRadius: '6px', border: 'none', cursor: 'pointer', marginBottom: '10px', transition: 'all 0.3s' }