'use client'
import { useEffect, useState } from 'react'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReviewFeed() {
  const [count, setCount] = useState(78)
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(d => {
        if (d.reviews) {
          setReviews(d.reviews)
          setCount(78 + d.reviews.length)
        }
      })
      .catch(() => {})
  }, [])

  if (reviews.length === 0) {
    return (
      <div style={{background:'var(--black)',padding:'16px 20px 0',display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{display:'flex',gap:'2px'}}>
          {[1,2,3,4,5].map(i => <span key={i} style={{color:'#FFD700',fontSize:'18px'}}>★</span>)}
        </div>
        <span style={{fontSize:'12px',color:'var(--light-beige)',letterSpacing:'0.04em',fontWeight:500}}>5.0 by {count}+</span>
      </div>
    )
  }

  return (
    <div style={{background:'var(--black)',padding:'16px 0 8px'}}>
      <div style={{padding:'0 20px',display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
        <div style={{display:'flex',gap:'2px'}}>
          {[1,2,3,4,5].map(i => <span key={i} style={{color:'#FFD700',fontSize:'18px'}}>★</span>)}
        </div>
        <span style={{fontSize:'12px',color:'var(--light-beige)',letterSpacing:'0.04em',fontWeight:500}}>5.0 by {count}+</span>
      </div>
      <div style={{display:'flex',gap:'12px',overflowX:'auto',padding:'0 20px 8px',scrollbarWidth:'none'}}>
        {reviews.map((r, i) => (
          <div key={i} style={{flexShrink:0,width:'210px',background:'var(--warm)',border:'1px solid var(--border)',borderRadius:'10px',padding:'14px'}}>
            <div style={{display:'flex',gap:'2px',marginBottom:'8px'}}>
              {Array.from({length: r.review_rating}).map((_, s) => (
                <span key={s} style={{color:'#FFD700',fontSize:'12px'}}>★</span>
              ))}
            </div>
            <p style={{fontSize:'12px',color:'var(--light-beige)',lineHeight:1.5,marginBottom:'8px'}}>{r.review_text}</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
              <p style={{fontSize:'10px',color:'var(--gold)',margin:0}}>{r.name?.split(' ')[0] || 'Customer'}</p>
              <p style={{fontSize:'9px',color:'rgba(232,221,210,0.4)',margin:0}}>{formatDate(r.review_submitted_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}