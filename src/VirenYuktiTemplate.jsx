import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import './viren-yukti.css'

const photos = [
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&q=85',
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=700&q=85',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=700&q=85',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=85',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&q=85',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=700&q=85'
]
const petals = Array.from({length:22},(_,i)=>({left:(i*37)%100,delay:(i%7)*1.3,duration:11+(i%6)*2,size:7+(i%4)*3,rotate:i*53}))
const prettyDate = value => value ? new Date(value+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : 'The wedding day'
const Reveal = ({children,className='',delay=0}) => <motion.div className={className} initial={{opacity:0,y:42}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.18}} transition={{duration:.9,ease:[.22,.61,.36,1],delay}}>{children}</motion.div>
export default function VirenYuktiTemplate({data={}}){
  const {scrollYProgress}=useScroll()
  const heroY=useTransform(scrollYProgress,[0,.35],[0,110])
  const events=Array.isArray(data.events)&&data.events.length?data.events:[{name:'Mehendi',date:'2027-02-12',time:'16:00',venue:'Garden Courtyard'},{name:'Sangeet',date:'2027-02-13',time:'19:00',venue:'The Celebration Hall'},{name:'Shubh Vivah',date:data.date||'2027-02-14',time:'17:00',venue:data.venue||'The Wedding Venue'}]
  const couple=data.bride&&data.groom?[data.bride,data.groom]:['Viren','Yukti']
  const families=data.families||[['Groom’s Family','Mr. & Mrs. Sharma','Shri. R. Sharma'],['Bride’s Party','Mr. & Mrs. Mehta','Smt. N. Mehta']]
  return <div className="vy-site">
    <div className="vy-progress"><motion.span style={{scaleX:scrollYProgress}}/></div>
    <div className="vy-petals" aria-hidden="true">{petals.map((p,i)=><motion.i key={i} style={{left:p.left+'%',width:p.size,height:p.size,rotate:p.rotate}} animate={{y:['-8vh','110vh'],x:[0,(i%2?1:-1)*55,0],rotate:[p.rotate,p.rotate+220]}} transition={{duration:p.duration,delay:p.delay,repeat:Infinity,ease:'linear'}}/>)}</div>
    <section className="vy-hero">
      <motion.div className="vy-hero-bg" style={{y:heroY}}/>
      <div className="vy-hero-glow"/>
      <Reveal className="vy-invite-frame"><span className="vy-ornament">✦ ❀ ✦</span><small>{data.welcome||'Together with our families'}</small><div className="vy-kicker">REQUEST THE PLEASURE OF YOUR COMPANY</div><h1>{couple[0]} <i>&</i><br/>{couple[1]}</h1><span className="vy-flourish">❧ ✦ ❧</span><p>AS WE BEGIN OUR FOREVER</p><b>{prettyDate(data.date)}</b><div className="vy-couple-photo"><img src={photos[0]} alt="Wedding celebration"/></div><span className="vy-hero-place">{data.city||'A celebration filled with love'}</span></Reveal>
      <div className="vy-scroll-cue">SCROLL TO EXPLORE <span/></div>
    </section>
    <section className="vy-blessing">
      <Reveal className="vy-ornate-panel"><span className="vy-corner vy-tl">❀</span><span className="vy-corner vy-tr">❀</span><span className="vy-corner vy-bl">❀</span><span className="vy-corner vy-br">❀</span><small>WITH THE BLESSINGS OF OUR ELDERS</small><h2>A beautiful beginning</h2><p>{data.story||'With the love and blessings of our families, we invite you to join us as we celebrate the beginning of our forever.'}</p><b>॥ श्री गणेशाय नमः ॥</b></Reveal>
    </section>
    <section className="vy-families"><Reveal><span className="vy-eyebrow">THE PEOPLE WHO MADE US</span><h2>Our Families</h2></Reveal><div className="vy-family-grid">{families.map((group,i)=><Reveal key={i} delay={i*.12} className="vy-family-card"><span>✿</span><b>{group[0]}</b>{group.slice(1).map((line,j)=><small key={j}>{line}</small>)}</Reveal>)}</div></section>
    <section className="vy-story"><Reveal><span className="vy-eyebrow">A LITTLE BIT OF MAGIC</span><h2>Our Love Story</h2></Reveal>{[0,1,2].map((n)=><Reveal className={'vy-story-card '+(n%2?'reverse':'')} key={n} delay={n*.1}><img src={photos[n+1]} alt="A moment from the couple's story"/><div><small>CHAPTER 0{n+1}</small><h3>{['How We Met','Friends & Firsts','The Big Yes'][n]}</h3><p>{[data.story||'Some stories begin with a hello and quietly become a forever.', 'A thousand little moments, laughter and memories brought us here.', 'And now, a new chapter begins — with all of you beside us.'][n]}</p></div><span className="vy-flower">❀</span></Reveal>)}</section>
    <section className="vy-date"><Reveal><span className="vy-eyebrow">MARK YOUR CALENDAR</span><h2>Save the Date</h2><div className="vy-date-card"><small>THE WEDDING OF</small><b>{couple.join(' & ')}</b><strong>{prettyDate(data.date)}</strong><span>✦ &nbsp; WITH LOVE, ALWAYS &nbsp; ✦</span></div></Reveal></section>
    <section className="vy-journey"><Reveal><span className="vy-eyebrow">THE CELEBRATION</span><h2>Our Wedding Journey</h2></Reveal><div className="vy-event-list">{events.map((event,i)=><Reveal className={'vy-event '+(i%2?'right':'')} key={i}><div className="vy-event-copy"><small>CELEBRATION 0{i+1}</small><h3>{event.name}</h3><p>{prettyDate(event.date)} · {event.time||'Time to be announced'}</p><span>{event.venue||data.venue||data.city}</span></div><div className="vy-event-seal"><span>{['मेहंदी','संगीत','विवाह'][i%3]}</span><b>✿</b></div></Reveal>)}</div></section>
    <section className="vy-gallery"><Reveal><span className="vy-eyebrow">LITTLE MOMENTS, FOREVER</span><h2>Rituals & Portraits</h2></Reveal><div className="vy-gallery-grid">{(data.gallery?.length?data.gallery:photos).slice(0,6).map((src,i)=><Reveal key={i} delay={i*.06} className="vy-gallery-photo"><img src={src} alt={'Wedding portrait '+(i+1)}/><span>✿</span></Reveal>)}</div></section>
    <section className="vy-venues"><Reveal><span className="vy-eyebrow">WHERE WE BECOME FOREVER</span><h2>Venues</h2></Reveal><div className="vy-venue-grid"><Reveal className="vy-venue-card"><span>THE CELEBRATION</span><h3>{events[0]?.venue||data.venue||'Our Venue'}</h3><p>{data.city||'With love, in a place close to our hearts'}</p></Reveal><Reveal className="vy-venue-card" delay={.15}><span>THE WEDDING</span><h3>{data.venue||'Wedding Venue'}</h3><p>{data.city||'We cannot wait to celebrate with you'}</p></Reveal></div></section>
    <footer className="vy-footer"><Reveal><span className="vy-eyebrow">WITH LOVE & BLESSINGS</span><h2>{couple.join(' & ')}</h2><p>We cannot wait to celebrate with you.</p><b>{data.hashtag||'#ForeverBegins'}</b><span className="vy-footer-flourish">❀ ❧ ✦ ❧ ❀</span></Reveal></footer>
  </div>
}
