export const dynamic = 'force-dynamic'
import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'

export default async function CheckoutPage({ params }) {
  const { token } = params

  // Look up the signup by token
  const rows = await sql`SELECT * FROM signups WHERE token = ${token}`

  if (rows.length === 0) {
    return notFound()
  }

  const signup = rows[0]

  // If already paid, show confirmation
  if (signup.paid) {
    return (
      <div style={{minHeight:'100vh',background:'#050505',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
        <div style={{maxWidth:'420px',width:'100%',background:'#161412',border:'1px solid rgba(200,168,138,0.3)',borderRadius:'16px',padding:'40px 32px',textAlign:'center',color:'#F3ECE5'}}>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',fontStyle:'italic',color:'#D8C3B3',marginBottom:'12px'}}>Order Already Completed ✳️</p>
          <p style={{fontSize:'13px',opacity:0.7,lineHeight:1.7}}>Your order has already been placed. Check your email for shipping confirmation.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#050505',color:'#F3ECE5',padding:'40px 20px',fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{maxWidth:'420px',margin:'0 auto'}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'#C8A88A',marginBottom:'8px'}}>OI Body Chemistry</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',fontWeight:700,marginBottom:'6px'}}>Your Private Checkout</h1>
          <p style={{fontSize:'12px',opacity:0.6}}>This link is exclusive to you · Expires in 24 hours</p>
        </div>

        {/* Order Summary */}
        <div style={{background:'#161412',border:'1px solid rgba(200,168,138,0.3)',borderRadius:'12px',padding:'20px',marginBottom:'20px'}}>
          <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.16em',textTransform:'uppercase',color:'#C8A88A',marginBottom:'12px'}}>Order Summary</p>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
            <span style={{fontSize:'14px',color:'#D8C3B3'}}>{signup.booster}™</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',fontWeight:700,color:'#D8C3B3'}}>$45</span>
          </div>
          <p style={{fontSize:'11px',opacity:0.5,letterSpacing:'0.1em',textTransform:'uppercase'}}>Per Month · Cancel Anytime</p>
        </div>

        {/* Shipping Info */}
        <div style={{background:'#161412',border:'1px solid rgba(200,168,138,0.3)',borderRadius:'12px',padding:'20px',marginBottom:'20px'}}>
          <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.16em',textTransform:'uppercase',color:'#C8A88A',marginBottom:'12px'}}>Shipping To</p>
          <p style={{fontSize:'13px',lineHeight:1.8,opacity:0.85}}>
            {signup.name}<br/>
            {signup.ship_address}{signup.ship_address2 ? `, ${signup.ship_address2}` : ''}<br/>
            {signup.ship_city}, {signup.ship_state} {signup.ship_zip}
          </p>
        </div>

        {/* Checkout Button */}
        <a
          href="https://square.link/u/nkI3321h"
          target="_blank"
          rel="noreferrer"
          style={{display:'block',width:'100%',background:'#C8A88A',color:'#050505',fontSize:'13px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',textAlign:'center',padding:'18px',borderRadius:'8px',textDecoration:'none',marginBottom:'12px'}}
        >
          Complete My Order →
        </a>
        <p style={{textAlign:'center',fontSize:'9px',opacity:0.4,letterSpacing:'0.1em',textTransform:'uppercase'}}>Secure · Discreet · Cancel Anytime</p>

      </div>
    </div>
  )
}