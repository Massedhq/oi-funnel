'use client'
import { useState, useEffect } from 'react'

export default function FunnelPage() {
  const [screen, setScreen] = useState(1)
  const [agreed, setAgreed] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' })
  const [smsAgreed, setSmsAgreed] = useState(false)
  const [remaining, setRemaining] = useState(300)
  const [capacityFull, setCapacityFull] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/spots')
      .then(r => r.json())
      .then(d => {
        setRemaining(d.remaining)
        if (d.remaining <= 0) setCapacityFull(true)
      })
      .catch(() => {})
  }, [])

  const goTo = (n) => setScreen(n)

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.email || !smsAgreed) return
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setRemaining(data.remaining)
        setSubmitted(true)
      } else if (res.status === 410) {
        setCapacityFull(true)
      } else {
        console.error('Signup failed:', res.status, data)
        alert(data?.error || 'Something went wrong submitting your info. Please try again.')
      }
    } catch (e) {
      console.error('Signup request error:', e)
      alert('Network error — please check your connection and try again.')
    }
  }

  const scrollToJoin = () => {
    document.getElementById('join-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <style suppressHydrationWarning>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --black: #050505;
          --deep: #0A0A0A;
          --cream: #F3ECE5;
          --cream-soft: #EFE6DD;
          --gold: #C8A88A;
          --gold-light: #D8C3B3;
          --warm: #161412;
          --text-dark: #050505;
          --text-muted: #B99678;
          --border: rgba(200,168,138,0.3);
          --white: #FFFFFF;
          --light-beige: #E8DDD2;
        }
        html, body { height: 100%; }
        body {
          background: var(--black);
          color: var(--white);
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── ENTRY FLOW (screens 1-4) ── */}
      {screen < 5 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'24px', background:'var(--black)' }}>
          <div style={{ width:'100%', maxWidth:'480px' }}>

            {/* Screen 1: Age Verification */}
            {screen === 1 && (
              <div style={screenStyle}>
                <div style={ageIconStyle}>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--gold)" fill="none" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/>
                  </svg>
                </div>
                <p style={brandMarkStyle}>Age Verification Required</p>
                <h1 style={screenH1Style}>You Must Be <em style={{color:'var(--gold-light)'}}>18 or Older</em> to Enter</h1>
                <p style={subtitleStyle}>This website contains information about wellness products intended for adults only. By entering, you confirm that you are at least 18 years of age.</p>
                <label style={checkboxRowStyle}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{display:'none'}} />
                  <span style={{...checkboxBoxStyle, background: agreed ? 'var(--gold)' : 'transparent'}}>
                    {agreed && <span style={{position:'absolute',left:'5px',top:'1px',width:'5px',height:'9px',border:'solid var(--black)',borderWidth:'0 2px 2px 0',transform:'rotate(45deg)',display:'block'}}/>}
                  </span>
                  <span style={{fontSize:'12px',color:'var(--light-beige)',lineHeight:1.6}}>
                    I agree to the{' '}
                    <span onClick={() => setTermsOpen(true)} style={legalLinkStyle}>Terms of Service</span>
                    {' '}and{' '}
                    <span onClick={() => setPrivacyOpen(true)} style={legalLinkStyle}>Privacy Policy</span>
                  </span>
                </label>
                <button
                  disabled={!agreed}
                  onClick={() => goTo(2)}
                  style={{...ageBtnPrimaryStyle, opacity: agreed ? 1 : 0.5, cursor: agreed ? 'pointer' : 'not-allowed'}}
                >
                  I Am 18 or Older — Enter
                </button>
                <a style={backLinkStyle}>I am under 18 — Exit</a>
              </div>
            )}

            {/* Screen 2: Readiness */}
            {screen === 2 && (
              <div style={screenStyle}>
                <ProgressDots current={1} />
                <p style={brandMarkStyle}>OI Body Chemistry</p>
                <h1 style={screenH1Style}>Where are you<br/><em style={{color:'var(--gold-light)'}}>right now?</em></h1>
                <p style={subtitleStyle}>There's no wrong answer — this just helps us guide you to what's most helpful.</p>
                <div style={optionsStyle}>
                  <button style={optBtnStyle} onClick={() => goTo(5)}><span style={optRadioStyle}/> I'm ready — let me in</button>
                  <button style={optBtnStyle} onClick={() => goTo(3)}><span style={optRadioStyle}/> I'm interested, but have a few questions</button>
                  <button style={optBtnStyle} onClick={() => goTo(3)}><span style={optRadioStyle}/> I'm just browsing, not ready to decide yet</button>
                </div>
              </div>
            )}

            {/* Screen 3: Goal */}
            {screen === 3 && (
              <div style={screenStyle}>
                <ProgressDots current={2} />
                <p style={brandMarkStyle}>OI Body Chemistry</p>
                <h1 style={screenH1Style}>What's your<br/><em style={{color:'var(--gold-light)'}}>biggest goal</em> right now?</h1>
                <p style={subtitleStyle}>This helps us understand what matters most to you.</p>
                <div style={optionsStyle}>
                  {['Lose weight','Control cravings','Boost energy','Stay consistent','Improve overall wellness'].map(opt => (
                    <button key={opt} style={optBtnStyle} onClick={() => goTo(4)}><span style={optRadioStyle}/> {opt}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Screen 4: Transition */}
            {screen === 4 && (
              <div style={screenStyle}>
                <ProgressDots current={3} />
                <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'rgba(201,145,26,0.12)',border:'1.5px solid var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'28px'}}>
                  <svg viewBox="0 0 24 24" width="28" height="28" stroke="var(--gold-light)" fill="none" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <p style={brandMarkStyle}>OI Body Chemistry</p>
                <h1 style={screenH1Style}>Great — all the<br/><em style={{color:'var(--gold-light)'}}>information</em> you need<br/>will be found here.</h1>
                <p style={subtitleStyle}>When you're ready, just click the option inside.</p>
                <button style={ctaPrimaryStyle} onClick={() => goTo(5)}>Take Me Inside</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN FUNNEL (screen 5) ── */}
      {screen === 5 && (
        <div style={{ width:'100%', maxWidth:'420px', margin:'0 auto', background:'var(--cream)', border:'1px solid var(--border)', borderRadius:'20px', overflow:'hidden' }}>

          {/* NAV */}
          <nav style={{background:'var(--black)',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',borderRadius:'20px 20px 0 0'}}>
            <div style={{fontSize:'13px',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--white)',lineHeight:1.3}}>
              Orisha<br/>Infinity
              <span style={{display:'block',fontSize:'8px',letterSpacing:'0.2em',color:'var(--gold)',fontWeight:400}}>OI Body Chemistry</span>
            </div>
            <button onClick={scrollToJoin} style={{background:'var(--cream)',color:'var(--black)',fontSize:'10px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',padding:'9px 16px',borderRadius:'40px',border:'none',cursor:'pointer'}}>Join The Journey & Get My Link</button>
          </nav>

          {/* WELCOME */}
          <div style={{background:'var(--black)',padding:'24px 20px 8px'}}>
            <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'28px',fontWeight:700,lineHeight:1.2,color:'var(--white)',whiteSpace:'nowrap'}}>
              Welcome, <em style={{fontStyle:'italic',color:'var(--gold-light)'}}>You're In.</em>
            </p>
          </div>

          {/* HERO */}
          <div style={{background:'var(--black)',padding:'28px 20px 32px'}}>
            <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'10px'}}>Limited Opportunity</p>
            <h1 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'38px',fontWeight:700,lineHeight:1.05,color:'var(--white)',textTransform:'uppercase',marginBottom:'6px'}}>Gained<br/>Weight?</h1>
            <div style={{width:'100%',aspectRatio:'3/4.2',borderRadius:'16px',overflow:'hidden',margin:'28px 0 18px',background:'var(--warm)'}}>
              <img src="/images/hero.png" alt="Model" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}} />
            </div>
            <p style={{fontSize:'13px',color:'var(--light-beige)',lineHeight:1.7,marginBottom:'18px'}}>Because everyone is built different. OI Body Chemistry was created to provide affordable, beginner-friendly access — no insurance needed, no appointment necessary. Get started with no pressure, but everything to gain.</p>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'10px',marginBottom:'22px'}}>
              {['Rid of Hunger Pain','Rid of Food Noise','Control Eating Portions','Change Eating Cycles','Control Late Night Snacking','Rid of Gained Weight'].map(item => (
                <li key={item} style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'13px',color:'var(--white)'}}>
                  <span style={{width:'18px',height:'18px',borderRadius:'50%',border:'1.5px solid var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <svg viewBox="0 0 12 12" width="9" height="9" stroke="var(--gold)" fill="none" strokeWidth="3"><polyline points="2,6 5,9 10,3"/></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div style={{border:'1px solid var(--border)',borderRadius:'8px',padding:'14px 18px',display:'inline-flex',flexDirection:'column',alignItems:'flex-start',marginBottom:'14px'}}>
              <span style={{fontSize:'9px',letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--light-beige)',opacity:0.6}}>Only</span>
              <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'44px',fontWeight:600,color:'var(--gold-light)',lineHeight:1}}>$45</span>
              <span style={{fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--light-beige)',opacity:0.6,marginTop:'2px'}}>A Month</span>
            </div>
            <button onClick={scrollToJoin} style={{display:'block',width:'100%',background:'var(--cream)',color:'var(--black)',fontSize:'13px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',textAlign:'center',padding:'16px',borderRadius:'6px',border:'none',cursor:'pointer',marginBottom:'24px'}}>Join Now</button>
            <div style={{background:'var(--cream)',borderRadius:'0 0 16px 16px',padding:'18px 12px',display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'16px',margin:'0 -20px -32px'}}>
              {[
                {icon:'lock', label:'Private Community Access'},
                {icon:'pkg', label:'Discreet Shipping'},
                {icon:'x-circle', label:'Cancel Anytime'},
                {icon:'shield', label:'Secure & Private'},
              ].map(t => (
                <div key={t.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',textAlign:'center'}}>
                  <svg viewBox="0 0 24 24" width="26" height="26" stroke="var(--black)" fill="none" strokeWidth="1.5">
                    {t.icon === 'lock' && <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}
                    {t.icon === 'pkg' && <><path d="M21 10V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/><rect x="1" y="10" width="22" height="12" rx="2"/></>}
                    {t.icon === 'x-circle' && <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>}
                    {t.icon === 'shield' && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
                  </svg>
                  <span style={{fontSize:'10px',fontWeight:500,letterSpacing:'0.04em',lineHeight:1.3,color:'var(--black)'}}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* VIDEO + PDF */}
          <div style={{padding:'56px 20px 32px',background:'var(--black)',color:'var(--white)'}}>
            <p style={sectionLabelStyle}>Your Transformation, Explained</p>
            <h2 style={sectionTitleStyle}>Everything Included<br/>in <em style={{fontStyle:'italic',color:'var(--gold-light)'}}>Your Package</em></h2>
            <p style={sectionSubStyle}>Watch each video, then download the matching guide. By the end, your body will be telling you yes.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              {[
                {num:'01', title:'Know Your Blood Type', desc:'Your blood type determines how your body processes food, stores fat, and responds to supplements. This is where your reset starts.', video:'/videos/blood_type.mp4', pdf:'/pdfs/blood_type_guide.pdf', dl:'Know_Your_Blood_Type_Reset_Guide.pdf'},
                {num:'02', title:'Deficiencies & What Tests You Need', desc:'Most women are deficient and don\'t know it. We break down which tests to request and what your results mean for your transformation.', video:'/videos/testing_guide.mp4', pdf:'/pdfs/testing_guide.pdf', dl:'Deficiencies_And_Tests_Guide.pdf'},
                {num:'03', title:'Body Functions + Peptides & Herbs', desc:'Understand how your metabolism, liver, and gut work together — plus peptides and herbs that can amplify your results.', video:'/videos/body_functions.mp4', pdf:'/pdfs/body_functions_guide.pdf', dl:'Body_Functions_Guide.pdf'},
                {num:'04', title:'Your First Order & Why It Works', desc:'See what\'s in your first order, how the booster works, and the protocol to follow while you wait on test results.', video:'/videos/first_order.mp4', pdf:'/pdfs/protocol_guide.pdf', dl:'Your_First_Order_And_Why_It_Works.pdf'},
              ].map(v => (
                <div key={v.num} style={{background:'var(--warm)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px'}}>
                  <div style={{width:'100%',aspectRatio:'16/9',borderRadius:'8px',overflow:'hidden',marginBottom:'14px',border:'1px solid var(--border)',background:'#000'}}>
                    <video controls preload="metadata" style={{width:'100%',height:'100%',display:'block',objectFit:'cover'}}>
                      <source src={v.video} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'4px'}}>Video {v.num}</p>
                  <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'17px',fontWeight:600,color:'var(--white)',marginBottom:'8px',lineHeight:1.2}}>{v.title}</h3>
                  <p style={{fontSize:'12px',color:'var(--light-beige)',opacity:0.75,lineHeight:1.65,marginBottom:'14px'}}>{v.desc}</p>
                  <a href={v.pdf} download={v.dl} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'transparent',border:'1px solid var(--gold)',color:'var(--gold)',fontSize:'11px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'11px',borderRadius:'6px',width:'100%',textDecoration:'none'}}>
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="var(--gold)" fill="none" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>
                    Download {v.title.split(' ').slice(0,3).join(' ')} (PDF)
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* TRANSFORMATIONS */}
          <div style={{padding:'0 20px 32px',background:'var(--cream)',color:'var(--black)'}}>
            <div style={{background:'var(--black)',color:'var(--white)',textAlign:'center',padding:'18px 20px',margin:'0 -20px 20px'}}>
              <p style={{fontSize:'9px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'6px'}}>Real People, Real Transformations</p>
              <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'22px',fontWeight:700}}>Different Starting Points.<span style={{color:'var(--gold-light)',display:'block',fontStyle:'italic',fontWeight:400,fontSize:'18px'}}>Same Commitment.</span></h2>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px'}}>
              {[
                {name:'Avy A.', program:'8 months', result:'-56 lbs', before:'/images/avy_before.png', after:'/images/avy_after.png'},
                {name:'Monica B.', program:'16 weeks', result:'-29 lbs', before:'/images/monica_before.png', after:'/images/monica_after.png'},
                {name:'Amanda L.', program:'14 months', result:'-85 lbs', before:'/images/amanda_before.png', after:'/images/amanda_after.png'},
                {name:'Erica E.', program:'8 months', result:'-60 lbs', before:'/images/erica_before.png', after:'/images/erica_after.png'},
              ].map(p => (
                <div key={p.name} style={{border:'1px solid var(--border)',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                  <div style={{display:'flex',gap:'4px',marginBottom:'8px'}}>
                    {[p.before, p.after].map((src, i) => (
                      <div key={i} style={{flex:1,aspectRatio:'1/2.5',background:'var(--warm)',borderRadius:'6px',overflow:'hidden',marginTop:'8px'}}>
                        <img src={src} alt={`${p.name} ${i===0?'before':'after'}`} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center',display:'block'}} />
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:'11px',fontWeight:600,marginBottom:'2px'}}>{p.name}</div>
                  <div style={{fontSize:'9px',opacity:0.5,marginBottom:'6px'}}>{p.program}</div>
                  <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'20px',fontWeight:700,color:'var(--gold)'}}>{p.result}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PRODUCTS */}
          <div style={{padding:'56px 20px 32px',background:'var(--black)',color:'var(--white)'}}>
            <p style={sectionLabelStyle}>Real Products</p>
            <h2 style={sectionTitleStyle}>Choose Your<br/><em style={{fontStyle:'italic',color:'var(--gold-light)'}}>Wellness Path</em></h2>
            <p style={sectionSubStyle}>Select the option that aligns with your wellness goals.</p>
            <div style={{width:'100%',aspectRatio:'1/1',borderRadius:'12px',overflow:'hidden',marginBottom:'20px'}}>
              <img src="/images/product.png" alt="OI Body Chemistry product" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block',borderRadius:'12px'}} />
            </div>
            {[
              {name:'MetaTride Ultra', desc:'Not a diet. Not a quick fix. A monthly wellness boost designed to work with your body chemistry — not against it.'},
              {name:'TriPhase MetaBurn', desc:'Not a shortcut. A synergistic wellness booster formulated to support how your body manages hunger, processes fuel, and sustains energy.'},
            ].map(p => (
              <div key={p.name} style={{border:'1px solid var(--border)',borderRadius:'12px',padding:'18px',marginBottom:'14px'}}>
                <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'18px',fontWeight:600,marginBottom:'8px'}}>{p.name}</h3>
                <p style={{fontSize:'12px',opacity:0.7,lineHeight:1.65,marginBottom:'14px'}}>{p.desc}</p>
                <button onClick={scrollToJoin} style={{display:'block',width:'100%',background:'var(--gold)',color:'var(--black)',fontSize:'11px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',textAlign:'center',padding:'12px',borderRadius:'6px',border:'none',cursor:'pointer'}}>Start With {p.name}</button>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div style={{padding:'56px 20px 32px',background:'var(--cream)',color:'var(--black)'}}>
            <p style={{...sectionLabelStyle,color:'var(--gold)'}}>Questions? We Have Answers</p>
            <h2 style={{...sectionTitleStyle,color:'var(--black)'}}>Everything <em style={{fontStyle:'italic',color:'var(--gold)'}}>You Need to Know</em></h2>
            {[
              {q:'What is the Booster Journey?', a:'A monthly wellness booster  designed to support your body\'s natural balance — paired with educational resources and community support.'},
              {q:'Do I need insurance?', a:'No. All Booster are available without insurance.'},
              {q:'Do I need appointments?', a:'No. Everything is done on your schedule, with no appointments necessary.'},
              {q:'How does billing work?', a:' There is no automatic billing, membership, subscription, or renewal program. OI: Body Chemistry™ operates on a month-to-month ordering basis. When you are ready for your next order, simply place a new order through your personal checkout link. You order only when you choose to order. There are no recurring charges, no contracts, and no automatic payments.Please note: Your program timeline continues whether an order is placed or not. A month not used is still considered a month completed within your overall journey. For best results, we recommend remaining consistent with your protocol and ordering schedule.'},
              {q:'Can I cancel anytime?', a:'Yes. There\'s no long-term contract — cancel whenever you\'d like. Please keep in mind if no order is placed for that month it stil counts as a month used.'},
              {q:'Can I join the community?', a:'Yes! Members get access to our private community for support and accountability as well as our public Facebook profile.'},
            ].map(faq => (
              <details key={faq.q} style={{borderBottom:'1px solid var(--border)',padding:'16px 0'}}>
                <summary style={{fontSize:'13px',fontWeight:500,cursor:'pointer',listStyle:'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  {faq.q}
                  <span style={{fontSize:'18px',color:'var(--gold)',flexShrink:0,marginLeft:'12px'}}>+</span>
                </summary>
                <p style={{fontSize:'12px',opacity:0.65,lineHeight:1.7,marginTop:'10px'}}>{faq.a}</p>
              </details>
            ))}
          </div>

          {/* JOIN FORM */}
          <div id="join-section" style={{padding:'56px 20px 32px',background:'var(--black)',color:'var(--white)'}}>
            <p style={sectionLabelStyle}>Limited Enrollment</p>
            <h2 style={sectionTitleStyle}>Join The <em style={{fontStyle:'italic',color:'var(--gold-light)'}}>Journey</em></h2>
            <p style={sectionSubStyle}>To maintain a personalized experience, enrollment is currently limited.</p>

            {!capacityFull && !submitted && (
              <div style={{border:'1px solid var(--border)',borderRadius:'12px',padding:'20px'}}>
                <div style={{textAlign:'center',marginBottom:'18px'}}>
                  <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'48px',fontWeight:700,color:'var(--gold-light)',lineHeight:1}}>{remaining}</div>
                  <div style={{fontSize:'9px',letterSpacing:'0.2em',textTransform:'uppercase',opacity:0.5,marginTop:'4px'}}>Remaining Capacity</div>
                </div>
                {['name','phone','email'].map(field => (
                  <input
                    key={field}
                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                    placeholder={field === 'name' ? 'Full Name' : field === 'phone' ? 'Phone Number' : 'Email Address'}
                    value={formData[field]}
                    onChange={e => setFormData({...formData, [field]: e.target.value})}
                    style={{width:'100%',background:'var(--warm)',border:'1px solid var(--border)',borderRadius:'6px',padding:'13px 14px',color:'var(--white)',fontSize:'13px',marginBottom:'10px',fontFamily:"'DM Sans', sans-serif"}}
                  />
                ))}
                <label style={{display:'flex',alignItems:'flex-start',gap:'8px',fontSize:'10px',opacity:0.6,margin:'12px 0 16px',lineHeight:1.6}}>
                  <input type="checkbox" checked={smsAgreed} onChange={e => setSmsAgreed(e.target.checked)} style={{marginTop:'2px',accentColor:'var(--gold)'}} />
                  <span>I agree to receive SMS with my exclusive checkout link. I have read and agree to the <span onClick={() => setPrivacyOpen(true)} style={legalLinkStyle}>Privacy Policy</span> and <span onClick={() => setTermsOpen(true)} style={legalLinkStyle}>Terms of Service</span>.</span>
                </label>
                <button onClick={handleSubmit} style={{display:'block',width:'100%',background:'var(--gold)',color:'var(--black)',fontSize:'13px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',textAlign:'center',padding:'15px',borderRadius:'6px',border:'none',cursor:'pointer',marginBottom:'10px'}}>Join The Journey & Get My Link →</button>
                <p style={{textAlign:'center',fontSize:'9px',opacity:0.4,letterSpacing:'0.1em',textTransform:'uppercase'}}>Secure · Discreet · Cancel Anytime</p>
              </div>
            )}

            {submitted && (
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'8px'}}>Limited Availability</p>
                <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'32px',fontWeight:700,color:'var(--white)',marginBottom:'4px'}}>Spots Are <em style={{fontStyle:'italic',color:'var(--gold-light)'}}>Filling Fast.</em></h2>
                <div style={{width:'40px',height:'1px',background:'var(--gold)',margin:'16px auto'}}/>
                <div style={{border:'1px solid var(--border)',borderRadius:'12px',padding:'24px 20px',marginBottom:'16px'}}>
                  <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'48px',fontWeight:700,color:'var(--gold-light)',lineHeight:1}}>{remaining}</div>
                  <div style={{fontSize:'9px',letterSpacing:'0.2em',textTransform:'uppercase',opacity:0.5,marginTop:'4px',marginBottom:'16px'}}>Spots Remaining</div>
                  <p style={{fontSize:'13px',color:'var(--light-beige)',lineHeight:1.7}}>Once these spots are gone, they are gone.</p>
                </div>
                <div style={{border:'1px solid var(--border)',borderRadius:'12px',padding:'24px 20px'}}>
                  <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'18px',fontStyle:'italic',color:'var(--gold-light)',marginBottom:'12px'}}>You are In! ✳️</p>
                  <p style={{fontSize:'13px',color:'var(--light-beige)',lineHeight:1.7,marginBottom:'20px'}}>Check your email — your exclusive Checkout link is on its way! Complete your signup to lock in your spot!</p>
                  <a href="https://www.facebook.com/share/g/17tA4EgWx8/" target="_blank" rel="noreferrer" style={{display:'block',width:'100%',background:'transparent',border:'1px solid var(--gold)',color:'var(--gold)',fontSize:'11px',fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',textAlign:'center',padding:'16px',borderRadius:'6px',textDecoration:'none'}}>Join Our Private Group →</a>
                </div>
              </div>
            )}

            {capacityFull && !submitted && (
              <div style={{border:'1px solid var(--gold)',borderRadius:'12px',padding:'24px 20px',textAlign:'center'}}>
                <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'20px',fontWeight:600,marginBottom:'10px'}}>We've Reached Our Current Inventory Capacity</h3>
                <p style={{fontSize:'12px',opacity:0.7,lineHeight:1.7,marginBottom:'18px'}}>You may proceed to preorder ahead — our next shipment is already en route. Your order will ship within 24 hours of arrival. (No shipping on Sundays.)</p>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  <button style={{background:'var(--gold)',color:'var(--black)',fontSize:'12px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',padding:'14px',borderRadius:'6px',border:'none',cursor:'pointer'}}>Preorder Now</button>
                  <button style={{background:'transparent',color:'var(--gold)',fontSize:'12px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'14px',borderRadius:'6px',border:'1px solid var(--gold)',cursor:'pointer'}}>Join the Waiting List</button>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div style={{background:'var(--black)',color:'var(--white)',padding:'32px 20px'}}>
            <div style={{fontSize:'13px',fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'4px'}}>OI Body Chemistry</div>
            <div style={{fontSize:'10px',opacity:0.5,marginBottom:'14px'}}>oibodychemistry.com</div>
            <p style={{fontSize:'11px',opacity:0.55,lineHeight:1.6,marginBottom:'16px',maxWidth:'280px'}}>Orisha Infinity is a beauty &amp; wellness company. Your glow is a priority!</p>
            <div style={{display:'flex',gap:'10px',marginBottom:'28px',flexWrap:'wrap'}}>
              <a href="https://www.facebook.com/OrishaInfinity" target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'11px',fontWeight:600,textDecoration:'none',border:'1px solid rgba(232,155,181,0.4)',borderRadius:'6px',padding:'9px 14px',color:'#E89BB5'}}>📣 Public Page</a>
              <a href="https://www.facebook.com/share/g/17tA4EgWx8/" target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'11px',fontWeight:600,textDecoration:'none',border:'1px solid rgba(183,155,232,0.4)',borderRadius:'6px',padding:'9px 14px',color:'#B79BE8'}}>👥 Private Group</a>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'24px'}}>
              <div>
                <h4 style={{fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'10px'}}>Menu</h4>
                {[['Home','https://www.orishainfinity.com/home'],['About','https://www.orishainfinity.com/about'],['Shop','https://www.orishainfinity.com/shop'],['Contact','https://www.orishainfinity.com/contact']].map(([label,href]) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" style={{display:'block',fontSize:'11px',opacity:0.6,textDecoration:'none',color:'var(--white)',marginBottom:'8px'}}>{label}</a>
                ))}
              </div>
              <div>
                <h4 style={{fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'10px'}}>What You Get</h4>
                {['Affordable Access','Private Community','Tips & Guidance','Cancel Anytime'].map(item => (
                  <span key={item} style={{display:'block',fontSize:'11px',opacity:0.6,color:'var(--white)',marginBottom:'8px'}}>{item}</span>
                ))}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'24px'}}>
              <div>
                <h4 style={{fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'10px'}}>Connect</h4>
                <a href="https://www.facebook.com/OrishaInfinity" target="_blank" rel="noreferrer" style={{display:'block',fontSize:'11px',opacity:0.6,textDecoration:'none',color:'var(--white)',marginBottom:'8px'}}>@orishainfinity</a>
                <a href="https://www.oibodychemistry.com" target="_blank" rel="noreferrer" style={{display:'block',fontSize:'11px',opacity:0.6,textDecoration:'none',color:'var(--white)',marginBottom:'8px'}}>oibodychemistry.com</a>
              </div>
              <div>
                <h4 style={{fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'10px'}}>Legal</h4>
                <span onClick={() => setPrivacyOpen(true)} style={{display:'block',fontSize:'11px',color:'var(--gold)',opacity:0.85,textDecoration:'underline',cursor:'pointer',marginBottom:'8px'}}>Privacy Policy</span>
                <span onClick={() => setTermsOpen(true)} style={{display:'block',fontSize:'11px',color:'var(--gold)',opacity:0.85,textDecoration:'underline',cursor:'pointer',marginBottom:'8px'}}>Terms of Service</span>
              </div>
            </div>
            <div style={{borderTop:'1px solid var(--border)',paddingTop:'16px',fontSize:'9px',opacity:0.4,textAlign:'center',letterSpacing:'0.05em'}}>
              © 2026 Oi Body Chemistry · Orisha Infinity · All Rights Reserved<br/>Lebanon Rd, Frisco, TX 75034
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY MODAL */}
      {privacyOpen && <Modal title="Privacy Policy" onClose={() => setPrivacyOpen(false)}>
        <p className="updated-date" style={{fontSize:'11px',color:'var(--text-muted)',letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:'16px'}}>Last Updated: June 2026</p>
        <div style={{background:'rgba(200,168,138,0.12)',border:'1px solid var(--border)',borderRadius:'8px',padding:'14px 16px',margin:'12px 0',fontSize:'12px',fontWeight:500}}>Orisha Infinity respects your privacy. This Privacy Policy explains what information we collect, how we use it, and the choices you have.</div>
        <h3 style={modalH3Style}>1. Information We Collect</h3><p>When you sign up or place an order, we may collect your name, email address, phone number, shipping address, and payment information (processed securely through our third-party processor).</p>
        <h3 style={modalH3Style}>2. How We Use Your Information</h3><p>To verify your identity, prevent duplicate signups, process your order, communicate about your account, send marketing emails and SMS where you have agreed, and improve our services.</p>
        <h3 style={modalH3Style}>3. Email and SMS Communications</h3><p>By providing your contact info you consent to transactional and marketing communications. Opt out of emails via unsubscribe link. Opt out of SMS by replying STOP. Message and data rates may apply.</p>
        <h3 style={modalH3Style}>4. Duplicate Account Prevention</h3><p>Each email and phone number may only be associated with one active signup to maintain fairness in our limited enrollment program.</p>
        <h3 style={modalH3Style}>5. Data Storage</h3><p>Your information is stored using secure, industry-standard database services. Access is restricted to authorized personnel only.</p>
        <h3 style={modalH3Style}>6. Sharing</h3><p>We do not sell your personal information. We may share with trusted service providers (payment, email/SMS, shipping) only as necessary.</p>
        <h3 style={modalH3Style}>7. Children's Privacy</h3><p>Our services are intended for individuals 18 years of age or older.</p>
        <h3 style={modalH3Style}>8. Contact Us</h3><p>Questions? Contact us through the contact information provided on our website.</p>
      </Modal>}

      {/* TERMS MODAL */}
      {termsOpen && <Modal title="Terms of Service" onClose={() => setTermsOpen(false)}>
        <p style={{fontSize:'11px',color:'var(--text-muted)',letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:'16px'}}>Last Updated: June 2026</p>
        <div style={{background:'rgba(200,168,138,0.12)',border:'1px solid var(--border)',borderRadius:'8px',padding:'14px 16px',margin:'12px 0',fontSize:'12px',fontWeight:500}}>Please read these Terms carefully before using this website or placing an order. By accessing this site, you agree to be bound by these terms.</div>
        <h3 style={modalH3Style}>1. Research Use Only</h3><p>All products are sold for research, laboratory, or analytical purposes only and are not for human consumption. Statements have not been evaluated by the FDA. Products are not intended to diagnose, treat, cure, or prevent any disease. By purchasing, you accept full responsibility for use.</p>
        <h3 style={modalH3Style}>2. Eligibility</h3><p>You must be at least 18 years of age to access this website or place an order.</p>
        <h3 style={modalH3Style}>3. Account Registration</h3><p>Each email address and phone number may only be associated with one active enrollment. Providing false or duplicate information may result in cancellation without refund.</p>
        <h3 style={modalH3Style}>4. Personal Checkout Links</h3><p>Upon enrollment, you receive a personal checkout link unique to you. Links are time-limited. Failure to complete checkout within the stated window may result in your spot being released.</p>
        <h3 style={modalH3Style}>5. Limited Enrollment</h3><p>Enrollment is limited. Once capacity is reached, additional signups may be placed on a waiting list. We reserve the right to adjust enrollment capacity at our sole discretion.</p>
        <h3 style={modalH3Style}>6. Reviews</h3><p>Members may be required to submit a review prior to placing a subsequent order. By submitting a review, you grant us a non-exclusive right to use it for marketing purposes.</p>
        <h3 style={modalH3Style}>7. Pricing & Payment</h3><p>All prices are in U.S. Dollars. Pricing locked at enrollment remains in effect for the stated duration. Payment is processed through a secure third-party processor.</p>
        <h3 style={modalH3Style}>8. Shipping</h3><p>We ship to all U.S. states. Orders are not shipped on Sundays.</p>
        <h3 style={modalH3Style}>9. Returns & Refunds</h3><p>All sales are final unless otherwise required by applicable law.</p>
        <h3 style={modalH3Style}>10. Limitation of Liability</h3><p>To the fullest extent permitted by law, Orisha Infinity shall not be liable for any indirect, incidental, or consequential damages.</p>
      </Modal>}
    </>
  )
}

// ── Sub-components ──

function ProgressDots({ current }) {
  return (
    <div style={{display:'flex',gap:'8px',marginBottom:'36px'}}>
      {[1,2,3].map(i => (
        <div key={i} style={{width:'28px',height:'3px',borderRadius:'2px',background: i < current ? 'var(--gold-light)' : i === current ? 'var(--gold)' : 'rgba(201,145,26,0.2)',transition:'background 0.3s'}} />
      ))}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{display:'flex',position:'fixed',inset:0,background:'rgba(5,5,5,0.85)',zIndex:1000,alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{background:'var(--cream)',color:'var(--black)',borderRadius:'16px',maxWidth:'600px',width:'100%',maxHeight:'80vh',display:'flex',flexDirection:'column',overflow:'hidden',border:'1px solid var(--border)'}}>
        <div style={{padding:'28px 32px 16px',borderBottom:'1px solid rgba(5,5,5,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:'24px',fontWeight:600,color:'var(--black)'}}>{title}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:'22px',color:'var(--black)',cursor:'pointer',opacity:0.5}}>×</button>
        </div>
        <div style={{padding:'24px 32px 32px',overflowY:'auto',fontSize:'13px',lineHeight:1.75,color:'rgba(5,5,5,0.8)'}}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Shared styles ──
const ageIconStyle = { width:'56px',height:'56px',borderRadius:'50%',border:'1.5px solid var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'24px',position:'relative',zIndex:2 }
const screenStyle = {
  background:'var(--deep)',border:'1px solid var(--border)',borderRadius:'20px',padding:'56px 40px',
  textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',position:'relative',
  overflow:'hidden',animation:'fadeIn 0.5s ease forwards',color:'var(--white)',
}
const brandMarkStyle = { fontSize:'10px',fontWeight:500,letterSpacing:'0.24em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'24px' }
const screenH1Style = { fontFamily:"'Cormorant Garamond', serif",fontSize:'clamp(28px,6vw,38px)',fontWeight:600,lineHeight:1.15,marginBottom:'12px',color:'var(--white)' }
const subtitleStyle = { fontSize:'14px',color:'var(--light-beige)',lineHeight:1.7,maxWidth:'360px',marginBottom:'32px' }
const optionsStyle = { display:'flex',flexDirection:'column',gap:'12px',width:'100%' }
const optBtnStyle = { background:'var(--warm)',border:'1px solid var(--border)',color:'var(--light-beige)',fontFamily:"'DM Sans', sans-serif",fontSize:'14px',fontWeight:400,textAlign:'left',padding:'18px 22px',borderRadius:'10px',cursor:'pointer',display:'flex',alignItems:'center',gap:'14px' }
const optRadioStyle = { width:'18px',height:'18px',borderRadius:'50%',border:'1.5px solid var(--gold)',flexShrink:0 }
const ctaPrimaryStyle = { display:'inline-block',background:'var(--gold)',color:'var(--black)',fontSize:'14px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',padding:'18px 48px',borderRadius:'8px',border:'none',cursor:'pointer',width:'100%' }
const ageBtnPrimaryStyle = { flex:1,background:'#EFE6DD',color:'var(--black)',fontSize:'14px',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',padding:'16px',borderRadius:'8px',border:'none',cursor:'pointer',width:'100%' }
const backLinkStyle = { fontSize:'12px',color:'var(--light-beige)',opacity:0.6,textDecoration:'none',marginTop:'24px',cursor:'pointer' }
const checkboxRowStyle = { display:'flex',alignItems:'flex-start',gap:'10px',textAlign:'left',width:'100%',marginBottom:'20px',cursor:'pointer' }
const checkboxBoxStyle = { width:'18px',height:'18px',border:'1.5px solid var(--gold)',borderRadius:'4px',flexShrink:0,marginTop:'1px',position:'relative',transition:'background 0.2s',display:'block' }
const legalLinkStyle = { color:'var(--gold)',textDecoration:'underline',cursor:'pointer' }
const sectionLabelStyle = { fontSize:'10px',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--gold)',textAlign:'center',marginBottom:'10px' }
const sectionTitleStyle = { fontFamily:"'Cormorant Garamond', serif",fontSize:'26px',fontWeight:600,lineHeight:1.2,textAlign:'center',marginBottom:'10px' }
const sectionSubStyle = { fontSize:'12px',textAlign:'center',lineHeight:1.7,opacity:0.65,maxWidth:'340px',margin:'0 auto 28px' }
const modalH3Style = { fontFamily:"'Cormorant Garamond', serif",fontSize:'16px',fontWeight:600,color:'var(--black)',margin:'20px 0 8px' }
