'use client'

export default function ConfirmationScreen({ submitted, capacityFull }) {
  return (
    <>
      {submitted && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontStyle: 'italic', color: 'var(--gold-light)', marginBottom: '16px' }}>You are In! ✳️</p>
          <p style={{ fontSize: '13px', color: 'var(--light-beige)', lineHeight: 1.7, marginBottom: '24px' }}>
            Congratulations on making the first step to your new identity journey on becoming. Please check your email for your private checkout link for your second order.
          </p>
          <a href="https://www.facebook.com/share/g/17tA4EgWx8/" target="_blank" rel="noreferrer" style={ghostBtnStyle}>Join Our Private Group →</a>
        </div>
      )}

      {capacityFull && !submitted && (
        <div style={{ ...cardStyle, border: '1px solid var(--gold)', textAlign: 'center' }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>{"We've Reached Our Current Inventory Capacity"}</h3>
          <p style={{ fontSize: '12px', opacity: 0.7, lineHeight: 1.7, marginBottom: '18px' }}>
            You may proceed to preorder ahead — our next shipment is already en route. Your order will ship within 24 hours of arrival. (No shipping on Sundays.)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={primaryBtnStyle}>Preorder Now</button>
            <button style={ghostBtnStyle}>Join the Waiting List</button>
          </div>
        </div>
      )}
    </>
  )
}

const cardStyle = { border: '1px solid var(--border)', borderRadius: '12px', padding: '32px 20px' }
const primaryBtnStyle = { background: 'var(--gold)', color: 'var(--black)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px', borderRadius: '6px', border: 'none', cursor: 'pointer' }
const ghostBtnStyle = { display: 'block', width: '100%', background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center', padding: '16px', borderRadius: '6px', textDecoration: 'none' }