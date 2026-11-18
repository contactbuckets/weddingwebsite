import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './shubh-vivaah.css'

const dateLabel = value => value ? new Date(value+'T12:00:00').toLocaleDateString('hi-IN',{day:'numeric',month:'long',year:'numeric'}) : 'शुभ दिन'
const englishDate = value => value ? new Date(value+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : 'Wedding day'
const calendarUrl = event => {
  if(!event.date)return '#'
  const [y,m,d]=event.date.split('-').map(Number)
  const [hh,mm]=String(event.time||'18:00').split(':').map(Number)
  const start=new Date(y,m-1,d,hh||0,mm||0)
  const end=new Date(start.getTime()+3*60*60*1000)
  const stamp=v=>v.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')
  const q=new URLSearchParams({action:'TEMPLATE',text:event.name||'Wedding celebration',dates:stamp(start)+'/'+stamp(end),location:event.venue||'',details:'A celebration with ShaadiSutra'})
  return 'https://calendar.google.com/calendar/render?'+q.toString()
}
const defaults=[{name:'Haldi Ceremony',date:'2027-02-12',time:'11:00',venue:'The Garden Courtyard'},{name:'Mehendi & Sangeet',date:'2027-02-13',time:'18:00',venue:'The Celebration Hall'},{name:'Shubh Vivah',date:'2027-02-14',time:'17:00',venue:'The Wedding Venue'}]

export default function ShubhVivaahTemplate({data={}}){
  const [stage,setStage]=useState('gate')
  const [eventIndex,setEventIndex]=useState(0)
  const couple=[data.bride||'Aarav',data.groom||'Meera']
  const events=Array.isArray(data.events)&&data.events.length?data.events:defaults
  const event=events[eventIndex]||events[0]
  const directions='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([data.venue,data.city].filter(Boolean).join(', ')||'Wedding venue')
  return <div className="shubh-template">
    {stage!=='site'&&<div className="shubh-entry">
      <div className="shubh-entry-ornament">❀　✦　❀　✦　❀</div>
      {stage==='gate'?<div className="shubh-gate-wrap">
        <div className="shubh-gate-arch"><div className="shubh-gate-inner"><span className="shubh-mantra">॥ श्री गणेशाय नमः ॥</span><div className="shubh-gate-names">{couple[0]} <i>&</i> {couple[1]}</div><div className="shubh-gate-sub">शुभ विवाह · WEDDING INVITATION</div><div className="shubh-gate-doors"><motion.div className="shubh-door left" animate={{rotateY:0}}/><motion.div className="shubh-door right" animate={{rotateY:0}}/></div></div></div>
        <p>With the blessings of our families</p><h1>Our celebration<br/>begins with you.</h1>
        <button className="shubh-gold-button" onClick={()=>setStage('envelope')}>Open the temple doors <span>✧</span></button>
      </div>:<div className="shubh-envelope-wrap">
        <span className="shubh-mantra">॥ श्री गणेशाय नमः ॥</span>
        <h1>A little invitation,<br/><em>wrapped with love.</em></h1>
        <div className="shubh-envelope">
          <div className="shubh-envelope-flap"/>
          <div className="shubh-envelope-seal">श्री</div>
          <motion.div className="shubh-letter" initial={{y:0}} animate={{y:-38}} transition={{duration:.8,delay:.25}}>
            <span>सादर आमंत्रण</span><b>{couple[0]} <i>&</i> {couple[1]}</b><small>{dateLabel(data.date)}</small><em>❧ ✦ ❧</em>
          </motion.div>
        </div>
        <p>Tap below to unfold your invitation</p>
        <button className="shubh-gold-button" onClick={()=>setStage('site')}>Unfold invitation <span>✧</span></button>
      </div>}
      <div className="shubh-entry-footer">MADE WITH LOVE · SHAADISUTRA</div>
    </div>}
    {stage==='site'&&<main className="shubh-site">
      <nav className="shubh-nav"><span>श्री</span><small>THE WEDDING OF {couple[0].toUpperCase()} & {couple[1].toUpperCase()}</small><a href="#shubh-events">THE CELEBRATIONS ↓</a></nav>
      <section className="shubh-hero">
        <div className="shubh-petal-field" aria-hidden="true">✿　❀　✧　✿　❀　✧　✿</div>
        <div className="shubh-hero-frame"><span className="shubh-mantra">॥ श्री गणेशाय नमः ॥</span><small>{data.welcome||'Together with our families'}</small><div className="shubh-hero-kicker">REQUEST THE PLEASURE OF YOUR COMPANY</div><h1>{couple[0]} <i>&</i><br/>{couple[1]}</h1><div className="shubh-divider">❧ ✦ ❧</div><p>AS WE BEGIN OUR FOREVER</p><strong>{englishDate(data.date)}</strong><span>{data.city||data.venue||'A celebration filled with love'}</span></div>
        <a href="#shubh-story" className="shubh-scroll">SCROLL TO EXPLORE <b>↓</b></a>
      </section>
      <section className="shubh-blessing" id="shubh-story"><span className="shubh-eyebrow">WITH THE BLESSINGS OF OUR ELDERS</span><h2>A beautiful beginning</h2><p>{data.story||'With the love and blessings of our families, we invite you to join us as we celebrate the beginning of our forever.'}</p><b>॥ शुभमस्तु ॥</b></section>
      <section className="shubh-events" id="shubh-events"><span className="shubh-eyebrow">SAVE THE DATES</span><h2>Our Wedding Journey</h2><p className="shubh-section-intro">Every ritual, every laugh, every little moment — we would love to celebrate it with you.</p>
        <div className="shubh-event-card"><div className="shubh-event-count">CELEBRATION {String(eventIndex+1).padStart(2,'0')} / {String(events.length).padStart(2,'0')}</div><div className="shubh-event-flower">❀</div><h3>{event.name||'Wedding celebration'}</h3><strong>{englishDate(event.date)}</strong><span>{event.time||'Time to be announced'}</span><small>{event.venue||data.venue||data.city}</small><a href={calendarUrl(event)} target="_blank" rel="noreferrer">＋ ADD TO CALENDAR</a>
          <div className="shubh-event-controls"><button disabled={eventIndex===0} onClick={()=>setEventIndex(i=>Math.max(0,i-1))}>← PREVIOUS</button><div>{events.map((_,i)=><button key={i} aria-label={'Show event '+(i+1)} className={i===eventIndex?'active':''} onClick={()=>setEventIndex(i)}/>)}</div><button disabled={eventIndex===events.length-1} onClick={()=>setEventIndex(i=>Math.min(events.length-1,i+1))}>NEXT →</button></div>
        </div>
      </section>
      {(data.gallery||[]).length>0&&<section className="shubh-gallery"><span className="shubh-eyebrow">LITTLE MOMENTS, FOREVER</span><h2>Our memories</h2><div>{data.gallery.map((src,i)=><img key={src+i} src={src} alt={'Wedding memory '+(i+1)}/>)}</div></section>}
      <section className="shubh-venue"><span className="shubh-eyebrow">WE CAN'T WAIT TO WELCOME YOU</span><h2>Find your way to us</h2><div className="shubh-venue-card"><span>THE WEDDING VENUE</span><h3>{data.venue||'Our wedding venue'}</h3><p>{data.city||'Details to follow'}</p><a href={directions} target="_blank" rel="noreferrer">GET DIRECTIONS ↗</a></div></section>
      <footer className="shubh-footer"><span>❀　✦　❀</span><h2>{couple[0]} <i>&</i> {couple[1]}</h2><p>आपका आगमन ही हमारा आशीर्वाद है</p><small>{data.hashtag||'#ForeverBegins'}</small><b>MADE WITH LOVE · SHAADISUTRA</b></footer>
    </main>}
  </div>
}
