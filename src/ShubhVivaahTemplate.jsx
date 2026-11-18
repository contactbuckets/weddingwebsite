import { useEffect, useMemo } from 'react'
import ORIGINAL_HTML from './templates/shubh-vivaah.html?raw'

const hindiDate = value => value ? new Date(value+'T12:00:00').toLocaleDateString('hi-IN',{day:'numeric',month:'long',year:'numeric'}) : ''
const englishDate = value => value ? new Date(value+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : ''
const timeLabel = value => {
  if(!value) return ''
  const [h,m]=String(value).split(':').map(Number)
  return new Date(2020,0,1,h||0,m||0).toLocaleTimeString('hi-IN',{hour:'numeric',minute:'2-digit'})
}
function makeConfig(data={},image=''){
  const bride=data.bride||'Bride',groom=data.groom||'Groom'
  const events=(Array.isArray(data.events)?data.events:[]).map(ev=>{
    const dateISO=ev.date?ev.date+'T'+(ev.time||'18:00')+':00+05:30':''
    return {title:ev.name||'Wedding celebration',titleEnglish:String(ev.name||'Wedding celebration').toUpperCase(),dateDisplay:hindiDate(ev.date),dateISO,timeDisplay:timeLabel(ev.time),venueLine:ev.venue||data.venue||data.city||''}
  })
  const venueName=data.venue||'Wedding venue',venueCity=data.city||''
  const mapQuery=[venueName,venueCity].filter(Boolean).join(', ')
  return {
    couple:{brideName:bride,groomName:groom,coupleShort:bride+' weds '+groom},
    hosts:{blessingsLine:data.welcome||'माता-पिता एवं समस्त परिवारजनों के आशीर्वाद से',invitationNote:'सादर आमंत्रित'},
    event:{titleHindi:'शुभ विवाह',dateDisplay:englishDate(data.date),cityLine:venueCity||venueName},
    venue:{name:venueName,city:venueCity,mapQuery,mapLink:mapQuery?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapQuery):'',parkingNote:''},
    schedule:{events},
    // Upstream demo photos, videos and music are explicitly excluded from its MIT licence.
    // Use the couple's own uploaded gallery photo; keep optional licensed media empty.
    media:{introImage:(data.gallery||[])[0]||image||'',heroVideoDesktop:'',heroVideoMobile:'',bgMusicPrimary:'',bgMusicSecondary:''},
    footer:{line:data.story||'आपका शुभ आगमन ही हमारा सबसे बड़ा आशीर्वाद होगा'}
  }
}
function buildDocument(data,image,projectId,endpoint,includeRsvp){
  const config=JSON.stringify(makeConfig(data,image)).replace(/</g,String.fromCharCode(92)+'u003c')
  let html=ORIGINAL_HTML
  const configStart='<script id="wedding-config" type="application/json">'
  const start=html.indexOf(configStart)
  const end=html.indexOf('</script>',start)
  if(start>=0&&end>=0)html=html.slice(0,start)+configStart+'\n'+config+'\n</script>'+html.slice(end+9)
  const title='शुभ विवाह | '+(data.bride||'Bride')+' & '+(data.groom||'Groom')+' · ShaadiSutra'
  html=html.replace('<title>शुभ विवाह | ShaadiSutra</title>','<title>'+title+'</title>')
  if(includeRsvp){
    const rsvp=[
      '<section id="shaadi-rsvp" class="snap-section relative overflow-hidden px-5 py-16 md:py-24" style="background:#f6eedc;color:#2a1810;text-align:center">',
      '<div style="max-width:620px;margin:auto;border:1px solid #c9a34e;background:#fffaf0;padding:clamp(24px,5vw,48px);box-shadow:0 16px 48px rgba(58,11,18,.12)">',
      '<p style="font:12px Mukta,sans-serif;letter-spacing:.22em;color:#8a6420">SHAADISUTRA · KINDLY REPLY</p>',
      '<h2 style="font:clamp(30px,6vw,44px) Yatra One,serif;color:#7a1e2b;margin:12px 0">Will you join us?</h2>',
      '<p style="font:17px Cormorant Garamond,serif;color:#6c5742;margin-bottom:24px">Your presence will make our celebration even more special.</p>',
      '<form id="shaadi-rsvp-form" style="display:grid;gap:13px;text-align:left">',
      '<label style="font:13px Mukta,sans-serif">Your name<input name="name" required minlength="2" maxlength="160" style="display:block;width:100%;margin-top:5px;padding:12px;border:1px solid #d8c7a7;background:#fff;font:15px Mukta"></label>',
      '<label style="font:13px Mukta,sans-serif">Email (optional)<input name="email" type="email" style="display:block;width:100%;margin-top:5px;padding:12px;border:1px solid #d8c7a7;background:#fff;font:15px Mukta"></label>',
      '<label style="font:13px Mukta,sans-serif">Your response<select name="attendance" required style="display:block;width:100%;margin-top:5px;padding:12px;border:1px solid #d8c7a7;background:#fff;font:15px Mukta"><option value="attending">Joyfully accepts</option><option value="not_attending">Regretfully declines</option></select></label>',
      '<label style="font:13px Mukta,sans-serif">Number of guests<input name="guestCount" type="number" min="1" max="20" value="1" style="display:block;width:100%;margin-top:5px;padding:12px;border:1px solid #d8c7a7;background:#fff;font:15px Mukta"></label>',
      '<label style="font:13px Mukta,sans-serif">Message (optional)<textarea name="note" rows="3" style="display:block;width:100%;margin-top:5px;padding:12px;border:1px solid #d8c7a7;background:#fff;font:15px Mukta"></textarea></label>',
      '<button type="submit" style="padding:13px 20px;background:#7a1e2b;color:#fff;border:1px solid #c9a34e;font:13px Mukta;letter-spacing:.1em">SEND RSVP ✦</button>',
      '<p id="shaadi-rsvp-status" role="status" aria-live="polite" style="font:14px Mukta,sans-serif;color:#7a1e2b;margin:0"></p>',
      '</form></div></section>'
    ].join('\n')
    const marker='</div>'+String.fromCharCode(10)+String.fromCharCode(10)+'<!-- ================= SCROLL HINT -->'
    html=html.replace(marker,rsvp+'\n'+marker)
    const script=[
      '<script>',
      '(function(){',
      'var form=document.getElementById("shaadi-rsvp-form");if(!form)return;',
      'form.addEventListener("submit",async function(e){',
      'e.preventDefault();var button=form.querySelector("button[type=submit]"),status=document.getElementById("shaadi-rsvp-status");',
      'button.disabled=true;button.textContent="SENDING…";status.textContent="";',
      'var f=new FormData(form);var payload={projectId:'+JSON.stringify(projectId)+',name:String(f.get("name")||""),email:String(f.get("email")||""),attendance:String(f.get("attendance")||""),guestCount:Number(f.get("guestCount")||1),note:String(f.get("note")||"")};',
      'try{',
      'var response=await fetch('+JSON.stringify(endpoint+'/functions/cashfree-payments/executions')+', {method:"POST",headers:{"content-type":"application/json","x-appwrite-project":'+JSON.stringify(projectId)+'},body:JSON.stringify({body:JSON.stringify(payload),async:false,path:"/rsvp",method:"POST"})});',
      'var execution=await response.json();var result={};try{result=JSON.parse(execution.responseBody||"{}")}catch(_){}',
      'if(!response.ok||execution.status==="failed"||Number(execution.responseStatusCode||200)>=400||result.success===false)throw new Error(result.message||execution.errors||"Could not submit RSVP. Please try again.");',
      'status.textContent="Thank you! Your RSVP has been received.";form.reset();',
      '}catch(err){status.textContent=err.message||"Could not submit RSVP. Please try again."}',
      'finally{button.disabled=false;button.textContent="SEND RSVP ✦"}',
      '});',
      '})();',
      '</script>'
    ].join('\n')
    html=html.replace('</body>',script+'\n</body>')
  }
  return html
}
export default function ShubhVivaahTemplate({data={},image='',fullPage=false,projectId=''}){
  const endpoint=import.meta.env.VITE_APPWRITE_ENDPOINT||'https://sgp.cloud.appwrite.io/v1'
  const html=useMemo(()=>buildDocument(data,image,projectId,endpoint,fullPage),[data,image,projectId,endpoint,fullPage])
  useEffect(()=>{if(!fullPage)return;document.open();document.write(html);document.close()},[fullPage,html])
  if(fullPage)return null
  return <iframe title="Shubh Vivaah original wedding invitation preview" srcDoc={html} style={{display:'block',width:'100%',height:'min(1100px, 100vh)',minHeight:'720px',border:0,background:'#3a0b12'}}/>
}
