import { useState, useEffect, useCallback, useRef } from "react";
import mammoth from "mammoth";

/* ═══ THEMES ═══ */
const TH={
  default:{l:"Default",bg:"#F9F5EE",c:"#FFF",n:"#0F2340",p:"#0F2340",pl:"#1A3A5C",a:"#C9963A",al:"#E8B85A",i:"#1C1C1E",m:"#6B7280",b:"#DDD5C8",s:"#2D7A4F",sb:"#EAF5EE",d:"#C0392B",db:"#FDECEA",bl:"#3B6DC1",bb:"#EEF4FF",pu:"#6B3FA0",pb:"#F3EEFF",t:"#0E7490"},
  darkBlue:{l:"Dark Blue",bg:"#0D1B2A",c:"#162636",n:"#071320",p:"#162636",pl:"#1F3449",a:"#E8A838",al:"#F5C462",i:"#DCE8F4",m:"#7A9AB5",b:"#1F3449",s:"#2ECC71",sb:"#0A2318",d:"#E74C3C",db:"#2A0A08",bl:"#5B9BD5",bb:"#0A1F35",pu:"#9B59B6",pb:"#1A0D28",t:"#17A8C0"},
  black:{l:"Dark Mode",bg:"#0C0C0C",c:"#1A1A1A",n:"#000",p:"#1A1A1A",pl:"#262626",a:"#F0A500",al:"#F5C842",i:"#E8E8E8",m:"#888",b:"#2A2A2A",s:"#27AE60",sb:"#0A1F10",d:"#E74C3C",db:"#2A0A08",bl:"#4A90D9",bb:"#0A0A1F",pu:"#8E44AD",pb:"#150D20",t:"#16A085"},
  white:{l:"Pure White",bg:"#F0F4F8",c:"#FFF",n:"#1E3A8A",p:"#1E3A8A",pl:"#2563EB",a:"#D97706",al:"#FBBF24",i:"#0F172A",m:"#64748B",b:"#E2E8F0",s:"#059669",sb:"#ECFDF5",d:"#DC2626",db:"#FEF2F2",bl:"#2563EB",bb:"#EFF6FF",pu:"#7C3AED",pb:"#F5F3FF",t:"#0891B2"},
  blueW:{l:"Blue & White",bg:"#EFF6FF",c:"#FFF",n:"#1E40AF",p:"#1D4ED8",pl:"#2563EB",a:"#D97706",al:"#FBBF24",i:"#1E293B",m:"#64748B",b:"#BFDBFE",s:"#059669",sb:"#ECFDF5",d:"#DC2626",db:"#FEF2F2",bl:"#1D4ED8",bb:"#DBEAFE",pu:"#7C3AED",pb:"#EDE9FE",t:"#0891B2"},
};
let $=TH.default;
const fd="'Playfair Display',Georgia,serif",fb="'DM Sans','Segoe UI',sans-serif";

/* ═══ HELPERS ═══ */
const td=()=>new Date().toISOString().split("T")[0];
const fD=d=>new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
const fT=d=>new Date(d).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
const fDy=d=>new Date(d).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fm=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

/* ═══ FILES ═══ */
async function cImg(f){return new Promise(r=>{const rd=new FileReader();rd.onload=e=>{const img=new Image();img.onload=()=>{const rt=Math.min(900/img.width,1),c=document.createElement("canvas");c.width=img.width*rt;c.height=img.height*rt;c.getContext("2d").drawImage(img,0,0,c.width,c.height);r(c.toDataURL("image/jpeg",.78));};img.src=e.target.result;};rd.readAsDataURL(f);});}
async function cAv(f){return new Promise(r=>{const rd=new FileReader();rd.onload=e=>{const img=new Image();img.onload=()=>{const s=120,c=document.createElement("canvas");c.width=s;c.height=s;const sq=Math.min(img.width,img.height);c.getContext("2d").drawImage(img,(img.width-sq)/2,(img.height-sq)/2,sq,sq,0,0,s,s);r(c.toDataURL("image/jpeg",.85));};img.src=e.target.result;};rd.readAsDataURL(f);});}
async function pF(f){if(f.type.startsWith("image/"))return{id:uid(),name:f.name,type:"image",data:await cImg(f)};if(/\.(docx?)$/i.test(f.name)||f.type.includes("word")){try{const r=await mammoth.convertToHtml({arrayBuffer:await f.arrayBuffer()});return{id:uid(),name:f.name,type:"word",html:r.value||"<p>Empty</p>"};}catch{return{id:uid(),name:f.name,type:"word",html:"<p>Cannot read</p>"};}}return null;}

/* ═══ CLAUDE ═══ */
async function ai(sys,msg){const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system:sys,messages:[{role:"user",content:msg}]})});const d=await r.json();return d.content?.find(b=>b.type==="text")?.text||"Could not generate feedback.";}
const HW=`You are an expert English teacher. NO band scores/numbers. EXACTLY this structure:
📝 Grammatical Range & Accuracy\n[Detailed feedback]\n💡 Suggestion: [Tip]\n────────────────────────────────\n🎯 Task Achievement\n[Feedback]\n💡 Suggestion: [Tip]\n────────────────────────────────\n🔗 Coherence & Cohesion\n[Feedback]\n💡 Suggestion: [Tip]\n────────────────────────────────\n📚 Lexical Resource\n[Feedback]\n💡 Suggestion: [Tip]\n────────────────────────────────\n⭐ Overall Impression\n[Warm encouragement]`;
const SH=`You are an expert pronunciation coach for shadowing. NO scores. EXACTLY this structure:
🎯 Accuracy & Word Matching\n[Feedback]\n💡 Suggestion: [Tip]\n────────────────────────────────\n🗣️ Fluency & Natural Rhythm\n[Feedback]\n💡 Suggestion: [Tip]\n────────────────────────────────\n🔊 Pronunciation Patterns\n[Feedback]\n💡 Suggestion: [Tip]\n────────────────────────────────\n🎵 Intonation & Sentence Stress\n[Feedback]\n💡 Suggestion: [Tip]\n────────────────────────────────\n⭐ Overall Impression\n[Warm encouragement]`;

/* ═══ STORAGE ═══ */
async function ld(k,fb){try{const r=await window.storage.get(k,true);return r?JSON.parse(r.value):fb;}catch{return fb;}}
async function sv(k,v){try{await window.storage.set(k,JSON.stringify(v),true);}catch{}}
const SA={id:"super_admin",username:"Teacher_Marvel",password:"Marvel_Boy_19",role:"super_admin",name:"Teacher Marvel",profilePhoto:null};

/* ═══ UI ATOMS ═══ */
const bs=(v,s)=>({fontFamily:fb,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",padding:s?"6px 14px":"10px 22px",fontSize:s?13:15,display:"inline-flex",alignItems:"center",gap:6,...({primary:{background:$.p,color:"#fff"},accent:{background:$.a,color:"#fff"},ghost:{background:"transparent",color:$.p,border:`1.5px solid ${$.b}`},danger:{background:$.d,color:"#fff"},logout:{background:$.c,color:$.d,border:`1.5px solid ${$.d}55`},teal:{background:$.t,color:"#fff"},purple:{background:$.pu,color:"#fff"}}[v]||{background:$.p,color:"#fff"})});
function B({children,onClick,v="primary",disabled,s,full,style}){return<button onClick={onClick} disabled={disabled} style={{...bs(v,s),opacity:disabled?.55:1,cursor:disabled?"not-allowed":"pointer",width:full?"100%":undefined,justifyContent:full?"center":undefined,...style}}>{children}</button>;}
function C({children,style}){return<div style={{background:$.c,borderRadius:14,border:`1px solid ${$.b}`,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.07)",...style}}>{children}</div>;}
function Bg({label,color}){const c=color||$.p;return<span style={{background:c+"18",color:c,border:`1px solid ${c}33`,borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700,fontFamily:fb}}>{label}</span>;}
function L({children}){return<label style={{fontSize:12,fontWeight:700,color:$.m,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{children}</label>;}
function M({t}){if(!t)return null;const ok=t[0]==="✓";return<div style={{padding:"10px 14px",borderRadius:8,fontSize:14,background:ok?$.sb:$.bb,color:ok?$.s:$.bl,marginTop:8}}>{t}</div>;}
function I({value,onChange,placeholder,type="text",disabled}){return<input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={e=>onChange(e.target.value)} style={{width:"100%",fontFamily:fb,fontSize:15,border:`1.5px solid ${$.b}`,borderRadius:8,padding:"9px 14px",outline:"none",background:disabled?$.bg:$.c,color:$.i,boxSizing:"border-box"}}/>;}
function Pw({value,onChange,placeholder="Password"}){const[s,set]=useState(false);return<div style={{position:"relative"}}><input type={s?"text":"password"} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} style={{width:"100%",fontFamily:fb,fontSize:15,border:`1.5px solid ${$.b}`,borderRadius:8,padding:"9px 42px 9px 14px",outline:"none",background:$.c,color:$.i,boxSizing:"border-box"}}/><button type="button" onClick={()=>set(x=>!x)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:17,color:$.m}}>{s?"🙈":"👁️"}</button></div>;}
function Tx({value,onChange,placeholder,rows=5,disabled}){return<textarea value={value} placeholder={placeholder} rows={rows} disabled={disabled} onChange={e=>onChange(e.target.value)} style={{width:"100%",fontFamily:fb,fontSize:15,border:`1.5px solid ${$.b}`,borderRadius:8,padding:"10px 14px",resize:"vertical",outline:"none",background:disabled?$.bg:$.c,color:$.i,boxSizing:"border-box",lineHeight:1.6}}/>;}
function Av({photo,name,size=38}){if(photo)return<img src={photo} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:`2px solid ${$.b}`,flexShrink:0}}/>;return<div style={{width:size,height:size,borderRadius:"50%",background:$.a,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:size*.38,fontFamily:fb,flexShrink:0}}>{name?.[0]?.toUpperCase()||"?"}</div>;}

function FB({text}){if(!text)return null;return<div style={{background:$.c,borderRadius:10,padding:20,border:`1px solid ${$.b}`,lineHeight:1.85,fontSize:14.5,color:$.i,fontFamily:fb}}>{text.split("\n").map((l,i)=>{if(/^[📝🎯🔗📚⭐🗣️🔊🎵]/.test(l))return<p key={i} style={{fontWeight:700,fontSize:16,color:$.p,margin:"18px 0 6px"}}>{l}</p>;if(l.startsWith("💡"))return<div key={i} style={{background:$.bb,border:`1px solid ${$.bl}33`,borderRadius:8,padding:"8px 14px",margin:"6px 0 10px",color:$.bl,fontSize:13.5,fontWeight:600}}>{l}</div>;if(l.includes("────"))return<hr key={i} style={{border:"none",borderTop:`1px solid ${$.b}`,margin:"14px 0"}}/>;if(!l.trim())return<br key={i}/>;return<p key={i} style={{margin:"3px 0"}}>{l}</p>;})}</div>;}

function FU({at,setAt,dis}){const ref=useRef();const[busy,setBusy]=useState(false);
  async function h(files){setBusy(true);const out=[];for(const f of Array.from(files)){const p=await pF(f);if(p)out.push(p);}if(out.length)setAt(p=>[...p,...out]);setBusy(false);}
  return<div><div onClick={()=>!dis&&ref.current.click()} style={{border:`2px dashed ${$.b}`,borderRadius:10,padding:14,textAlign:"center",background:$.bg,cursor:dis?"default":"pointer",opacity:dis?.6:1}}><div style={{fontSize:22}}>📎</div><div style={{fontWeight:600,fontSize:13,color:$.i}}>{busy?"Processing…":"Click to add files"}</div><div style={{fontSize:12,color:$.m}}>Images or Word</div><input ref={ref} type="file" multiple accept="image/*,.docx,.doc" style={{display:"none"}} onChange={e=>h(e.target.files)}/></div>{at.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>{at.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:5,background:a.type==="image"?$.sb:$.pb,borderRadius:8,padding:"4px 9px"}}><span style={{fontSize:12}}>{a.type==="image"?"🖼️":"📄"}</span><span style={{fontSize:12,fontWeight:600,color:a.type==="image"?$.s:$.pu,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</span>{!dis&&<button onClick={()=>setAt(p=>p.filter(x=>x.id!==a.id))} style={{background:"none",border:"none",cursor:"pointer",color:$.m,fontSize:12,padding:0}}>✕</button>}</div>)}</div>}</div>;}

function AV({at}){const[ow,sOw]=useState({});if(!at?.length)return null;return<div style={{display:"flex",flexDirection:"column",gap:8}}>{at.filter(a=>a.type==="image").map(img=><div key={img.id} style={{border:`1px solid ${$.b}`,borderRadius:10,overflow:"hidden",maxWidth:240}}><img src={img.data} alt="" style={{display:"block",width:"100%",height:"auto"}}/></div>)}{at.filter(a=>a.type==="word").map(d=><div key={d.id} style={{border:`1px solid ${$.pu}44`,borderRadius:10,overflow:"hidden"}}><div onClick={()=>sOw(p=>({...p,[d.id]:!p[d.id]}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:$.pb,cursor:"pointer"}}><span style={{fontWeight:700,fontSize:13,color:$.pu}}>📄 {d.name}</span><span style={{color:$.pu}}>{ow[d.id]?"▲":"▼"}</span></div>{ow[d.id]&&<div style={{padding:14,fontSize:14,lineHeight:1.75,color:$.i,maxHeight:300,overflowY:"auto"}} dangerouslySetInnerHTML={{__html:d.html}}/>}</div>)}</div>;}

function VP({url}){if(!url?.trim())return null;const yt=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);if(yt)return<div><div style={{borderRadius:10,overflow:"hidden",background:"#000",aspectRatio:"16/9"}}><iframe src={`https://www.youtube.com/embed/${yt[1]}?rel=0`} width="100%" height="100%" frameBorder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen style={{display:"block"}}/></div><a href={url} target="_blank" rel="noreferrer" style={{fontSize:12,color:$.bl,fontWeight:600,marginTop:6,display:"inline-block"}}>🔗 Open link</a></div>;return<div><video src={url} controls playsInline style={{width:"100%",borderRadius:10,maxHeight:400,background:"#000"}}/><a href={url} target="_blank" rel="noreferrer" style={{fontSize:12,color:$.bl,fontWeight:600,marginTop:6,display:"inline-block"}}>🔗 Open link</a></div>;}

/* ═══ VOICE RECORDER ═══ */
function VR({targetText,onResult,eFb,eTr}){
  const[ph,setPh]=useState(eFb?"done":"idle");
  const[au,setAu]=useState(null);const[sec,setSec]=useState(0);
  const[tr,setTr]=useState(eTr||"");const[fb,setFb]=useState(eFb||null);const[err,setErr]=useState("");
  const mr=useRef(null);const ch=useRef([]);const tm=useRef(null);const sr=useRef(null);const buf=useRef("");

  async function start(){
    setErr("");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const rec=new MediaRecorder(stream);ch.current=[];
      rec.ondataavailable=e=>{if(e.data.size>0)ch.current.push(e.data);};
      rec.onstop=()=>{setAu(URL.createObjectURL(new Blob(ch.current,{type:rec.mimeType||"audio/webm"})));stream.getTracks().forEach(t=>t.stop());};
      rec.start(200);mr.current=rec;buf.current="";
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(SR){try{const s=new SR();s.continuous=true;s.interimResults=false;s.lang="en-US";s.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)buf.current+=e.results[i][0].transcript+" ";setTr(buf.current.trim());};s.onerror=()=>{};s.start();sr.current=s;}catch{}}
      setPh("rec");setSec(0);tm.current=setInterval(()=>setSec(s=>s+1),1000);
    }catch{setErr("Microphone blocked. Allow microphone access and try again.");}
  }
  function stop(){try{mr.current?.stop();}catch{}try{sr.current?.stop();}catch{}clearInterval(tm.current);setPh("rev");}
  async function analyze(){setPh("load");try{const f=await ai(SH,`Target:\n"${targetText}"\n\nStudent speech:\n"${tr.trim()||"(no transcription)"}"\n\nGive shadowing feedback.`);setFb(f);setPh("done");onResult?.(tr.trim(),f);}catch{setErr("Failed.");setPh("rev");}}
  function reset(){try{mr.current?.stop();}catch{}try{sr.current?.stop();}catch{}clearInterval(tm.current);setPh("idle");setAu(null);setTr("");setFb(null);setSec(0);setErr("");buf.current="";}

  return<div style={{display:"flex",flexDirection:"column",gap:14}}>
    {err&&<div style={{background:$.db,color:$.d,borderRadius:9,padding:14,fontSize:14}}>{err}</div>}
    {ph!=="done"&&ph!=="load"&&<div style={{textAlign:"center",padding:8}}>
      <div style={{fontSize:ph==="rec"?42:50,marginBottom:8}}>{ph==="rec"?"🔴":"🎙️"}</div>
      {ph==="rec"&&<div style={{fontSize:30,fontWeight:800,color:$.d,fontFamily:"monospace",marginBottom:12}}>{fm(sec)}</div>}
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
        {ph==="idle"&&<B v="danger" onClick={start} style={{fontSize:16,padding:"14px 30px",borderRadius:40}}>🎙️ Start Recording</B>}
        {ph==="rec"&&<B v="ghost" onClick={stop} style={{fontSize:16,padding:"14px 30px",borderRadius:40}}>⏹ Stop</B>}
        {ph==="rev"&&<B v="teal" onClick={analyze}>🤖 Get AI Feedback</B>}
        {ph==="rev"&&<B v="ghost" s onClick={reset}>↺ Re-record</B>}
      </div>
      {ph==="idle"&&<p style={{color:$.m,fontSize:13,margin:"12px 0 0"}}>Play the video above, press Record, and speak along.</p>}
      {ph==="rec"&&<p style={{color:$.m,fontSize:13,margin:"12px 0 0"}}>🎤 Recording… speak the target text.</p>}
    </div>}
    {ph==="load"&&<div style={{textAlign:"center",padding:28}}><div style={{fontSize:36,marginBottom:10}}>⏳</div><p style={{color:$.m,fontSize:15}}>Analysing your shadowing…</p></div>}
    {au&&ph!=="idle"&&<div style={{background:$.bg,borderRadius:10,padding:14,border:`1px solid ${$.b}`}}><L>🔊 Your Recording</L><audio controls src={au} style={{width:"100%",marginTop:6}}/></div>}
    {tr&&ph!=="idle"&&<div style={{background:$.bg,borderRadius:10,padding:14,border:`1px solid ${$.b}`}}><L>📝 Auto-detected speech</L><p style={{fontSize:14,color:$.i,margin:"6px 0 0",lineHeight:1.7,fontStyle:"italic"}}>{tr}</p></div>}
    {ph==="done"&&fb&&<div><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><span style={{fontSize:26}}>🤖</span><h3 style={{fontFamily:fd,fontSize:17,color:$.s,margin:0}}>Shadowing Feedback</h3></div><FB text={fb}/><B v="ghost" s onClick={reset} style={{marginTop:12}}>↺ Record Again</B></div>}
  </div>;
}

/* ═══ NAV ═══ */
function Hm({open}){const b=t=>({display:"block",width:22,height:2.5,background:"#fff",borderRadius:2,transition:"all .25s",transform:open?(t==="top"?"translateY(7px) rotate(45deg)":t==="bot"?"translateY(-7px) rotate(-45deg)":"scaleX(0)"):"none",opacity:open&&t==="mid"?0:1});return<div style={{width:22,display:"flex",flexDirection:"column",gap:4.5,cursor:"pointer"}}><span style={b("top")}/><span style={b("mid")}/><span style={b("bot")}/></div>;}

function Dr({open,onClose,tab,setTab,items,onLogout,user}){
  return<>{open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200}}/>}<div style={{position:"fixed",top:0,left:0,height:"100vh",width:290,background:$.n,transform:open?"translateX(0)":"translateX(-100%)",transition:"transform .3s",zIndex:300,display:"flex",flexDirection:"column",overflowY:"auto"}}>
    <div style={{padding:"20px 20px 16px",borderBottom:"1px solid rgba(255,255,255,.1)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>📚</span><span style={{fontFamily:fd,color:"#fff",fontSize:18,fontWeight:700}}>HomeworkHub</span></div><button onClick={onClose} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",width:28,height:28,borderRadius:8,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>
      <div style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,.08)",borderRadius:10,padding:"10px 12px"}}><Av photo={user.profilePhoto} name={user.name} size={42}/><div><div style={{color:"#fff",fontWeight:700,fontSize:14}}>{user.name}</div><div style={{color:"rgba(255,255,255,.5)",fontSize:12,textTransform:"capitalize"}}>{user.role==="super_admin"?"Admin":user.role}</div></div></div>
    </div>
    <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:3}}>{items.map(it=>{const a=tab===it.id;return<button key={it.id} onClick={()=>{setTab(it.id);onClose();}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:10,border:"none",cursor:"pointer",textAlign:"left",width:"100%",background:a?"rgba(255,255,255,.15)":"transparent",color:a?"#fff":"rgba(255,255,255,.7)",fontFamily:fb,fontWeight:a?700:500,fontSize:15,borderLeft:a?`3px solid ${$.a}`:"3px solid transparent"}}><span style={{fontSize:18}}>{it.icon}</span>{it.label}</button>;})}</nav>
    <div style={{padding:"12px 10px",borderTop:"1px solid rgba(255,255,255,.1)"}}><button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,border:"none",cursor:"pointer",width:"100%",background:"rgba(192,57,43,.15)",color:"#FF8A80",fontFamily:fb,fontWeight:700,fontSize:15}}><span>⏏</span> Log Out</button></div>
  </div></>;
}

function NB({user,onLogout,onHam,open,label}){return<div style={{background:$.n,color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:58,boxShadow:"0 2px 16px rgba(0,0,0,.2)",position:"sticky",top:0,zIndex:100}}><div style={{display:"flex",alignItems:"center",gap:14}}><button onClick={onHam} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}><Hm open={open}/></button><div><span style={{fontFamily:fd,fontSize:18,fontWeight:700}}>HomeworkHub</span>{label&&<span style={{marginLeft:10,fontSize:12,color:"rgba(255,255,255,.5)"}}>/ {label}</span>}</div></div><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:600}}>{user.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,.5)",textTransform:"capitalize"}}>{user.role==="super_admin"?"Admin":user.role}</div></div><Av photo={user.profilePhoto} name={user.name} size={32}/></div></div>;}

/* ═══ LOGIN ═══ */
function Login({onLogin,users}){const[un,sUn]=useState("");const[pw,sPw]=useState("");const[err,sErr]=useState("");
  return<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${$.p},${$.pl},${$.bl})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:fb,padding:20}}><div style={{width:"100%",maxWidth:420}}><div style={{textAlign:"center",marginBottom:32}}><div style={{width:64,height:64,borderRadius:18,background:`linear-gradient(135deg,${$.a},${$.al})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:"0 8px 24px rgba(0,0,0,.3)",fontSize:30}}>📚</div><h1 style={{fontFamily:fd,color:"#fff",fontSize:28,margin:0}}>HomeworkHub</h1><p style={{color:"rgba(255,255,255,.6)",margin:"6px 0 0",fontSize:14}}>Smart learning platform</p></div>
  <C style={{padding:28}}><h2 style={{fontFamily:fd,color:$.p,fontSize:20,margin:"0 0 18px"}}>Sign In</h2><div style={{display:"flex",flexDirection:"column",gap:12}}><div><L>Username</L><I value={un} onChange={sUn} placeholder="Username"/></div><div><L>Password</L><Pw value={pw} onChange={sPw}/></div>{err&&<p style={{color:$.d,fontSize:13,margin:0}}>⚠ {err}</p>}<B onClick={()=>{const u=users.find(u=>u.username===un.trim()&&u.password===pw);if(!u){sErr("Invalid credentials.");return;}onLogin(u);}} full style={{marginTop:4}}>Sign In →</B></div></C>
  <p style={{textAlign:"center",color:"rgba(255,255,255,.5)",fontSize:13,marginTop:20}}>Created by <a href="https://t.me/Marvels_Blog" target="_blank" rel="noreferrer" style={{color:$.al,fontWeight:700,textDecoration:"none"}}>Akbar Salimov</a> with the help of AI</p></div></div>;
}

/* ═══ ADMIN PANEL ═══ */
function Admin({users,setUsers,classes,setClasses,assignments,setAssigns,submissions,setSubs,shadowSubs,setShadowSubs,theme,onTheme}){
  const[vw,sVw]=useState("list");const[nm,sNm]=useState("");const[un,sUn]=useState("");const[pw,sPw]=useState("");const[msg,sMsg]=useState("");const[sp,sSp]=useState({});
  const tch=users.filter(u=>u.role==="teacher");
  async function create(){if(!nm||!un||!pw){sMsg("Fill all.");return;}if(users.find(u=>u.username===un)){sMsg("Taken.");return;}await setUsers([...users,{id:uid(),username:un,password:pw,role:"teacher",name:nm,profilePhoto:null}]);sNm("");sUn("");sPw("");sMsg("✓ Created!");sVw("list");}
  async function rem(id){const u2=users.filter(u=>u.id!==id&&u.teacherId!==id);await setUsers(u2);await setClasses(classes.filter(c=>c.teacherId!==id));await setAssigns(assignments.filter(a=>a.teacherId!==id));await setSubs(submissions.filter(s=>s.teacherId!==id));await setShadowSubs(shadowSubs.filter(s=>s.teacherId!==id));}
  return<div style={{maxWidth:960,margin:"0 auto",padding:"24px 22px"}}>
    <div style={{display:"flex",gap:8,marginBottom:24,borderBottom:`1px solid ${$.b}`,paddingBottom:16}}>{[["list","👨‍🏫 Teachers"],["create","➕ New Teacher"],["settings","⚙️ Settings"]].map(([id,lb])=><button key={id} onClick={()=>sVw(id)} style={{padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:fb,fontWeight:600,fontSize:14,background:vw===id?$.p:"transparent",color:vw===id?"#fff":$.m}}>{lb}</button>)}</div>
    {vw==="list"&&<div><h2 style={{fontFamily:fd,fontSize:20,color:$.p,margin:"0 0 16px"}}>Teacher Accounts</h2>{tch.length===0?<C style={{textAlign:"center",padding:48}}><p style={{color:$.m,margin:0}}>No teachers yet.</p></C>:
    <C style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse",fontFamily:fb}}><thead><tr style={{background:$.p}}>{["#","Teacher","Username","Password","",""].map(h=><th key={h} style={{textAlign:"left",padding:"12px 16px",color:"rgba(255,255,255,.75)",fontWeight:600,fontSize:12,textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{tch.map((t,i)=><tr key={t.id} style={{borderBottom:`1px solid ${$.b}`,background:i%2===0?$.c:$.bg}}>
      <td style={{padding:"14px 16px",color:$.m}}>{i+1}</td>
      <td style={{padding:"14px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><Av photo={t.profilePhoto} name={t.name} size={36}/><span style={{fontWeight:700,color:$.i}}>{t.name}</span></div></td>
      <td style={{padding:"14px 16px"}}><span style={{background:$.bb,color:$.bl,borderRadius:6,padding:"3px 10px",fontSize:13,fontWeight:600,fontFamily:"monospace"}}>{t.username}</span></td>
      <td style={{padding:"14px 16px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{background:"#FFF8EE",color:$.a,borderRadius:6,padding:"3px 10px",fontSize:13,fontWeight:600,fontFamily:"monospace",letterSpacing:sp[t.id]?0:2}}>{sp[t.id]?t.password:"•".repeat(Math.min(t.password?.length||8,10))}</span><button onClick={()=>sSp(p=>({...p,[t.id]:!p[t.id]}))} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:$.m}}>{sp[t.id]?"🙈":"👁️"}</button></div></td>
      <td style={{padding:"14px 16px"}}><Bg label={`${users.filter(u=>u.teacherId===t.id&&u.role==="student").length} 👨‍🎓`} color={$.bl}/></td>
      <td style={{padding:"14px 16px"}}><B v="danger" s onClick={()=>{if(window.confirm(`Remove "${t.name}" and ALL their data?`))rem(t.id);}}>🗑 Remove</B></td>
    </tr>)}</tbody></table></C>}</div>}
    {vw==="create"&&<C style={{maxWidth:480}}><h3 style={{fontFamily:fd,fontSize:18,margin:"0 0 18px",color:$.p}}>Create Teacher</h3><div style={{display:"flex",flexDirection:"column",gap:12}}><div><L>Full Name</L><I value={nm} onChange={sNm} placeholder="Name"/></div><div><L>Username</L><I value={un} onChange={sUn} placeholder="Username"/></div><div><L>Password</L><Pw value={pw} onChange={sPw}/></div><M t={msg}/><B v="teal" onClick={create} full>Create Teacher</B></div></C>}
    {vw==="settings"&&<div style={{maxWidth:520}}><C><h3 style={{fontFamily:fd,fontSize:17,margin:"0 0 16px",color:$.p}}>App Theme</h3><div><L>Choose Theme</L><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>{Object.entries(TH).map(([k,t])=><button key={k} onClick={()=>onTheme(k)} style={{border:`2px solid ${theme===k?t.a:t.b}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",background:t.bg,display:"flex",alignItems:"center",gap:8}}><div style={{width:18,height:18,borderRadius:"50%",background:t.n,border:`2px solid ${t.a}`,flexShrink:0}}/><span style={{fontSize:12,fontWeight:600,color:t.i}}>{t.l}</span>{theme===k&&<span style={{marginLeft:"auto"}}>✓</span>}</button>)}</div></div></C></div>}
  </div>;
}

/* ═══ TEACHER DASHBOARD ═══ */
function TD({tid,users,classes,assignments,submissions,onNav}){
  const my=users.filter(u=>u.teacherId===tid&&u.role==="student"),mS=submissions.filter(s=>s.teacherId===tid),mA=assignments.filter(a=>a.teacherId===tid),mC=classes.filter(c=>c.teacherId===tid);
  const stats=[{i:"🏫",l:"Classes",v:mC.length,c:$.t},{i:"👨‍🎓",l:"Students",v:my.length,c:$.bl},{i:"📝",l:"Assignments",v:mA.length,c:$.a},{i:"📬",l:"Today",v:mS.filter(s=>s.submittedAt?.startsWith(td())).length,c:$.p},{i:"✅",l:"Checked",v:mS.filter(s=>s.feedback).length,c:$.s}];
  const acts=[{i:"📅",l:"Today's Assignments",a:"daily",c:$.t},{i:"📝",l:"New Assignment",a:"assignments",c:$.a},{i:"🏫",l:"Manage Classes",a:"classes",c:$.bl},{i:"📬",l:"Submissions",a:"submissions",c:$.p},{i:"🔑",l:"Student Logins",a:"studentinfo",c:$.s}];
  return<div style={{display:"flex",flexDirection:"column",gap:22}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14}}>{stats.map(s=><C key={s.l} style={{padding:"16px 18px",borderTop:`4px solid ${s.c}`}}><div style={{fontSize:24,marginBottom:6}}>{s.i}</div><div style={{fontSize:24,fontWeight:800,color:s.c,fontFamily:fd}}>{s.v}</div><div style={{fontSize:12,color:$.m,marginTop:2}}>{s.l}</div></C>)}</div>
    <div><h3 style={{fontFamily:fd,fontSize:17,color:$.p,margin:"0 0 12px"}}>Quick Actions</h3><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>{acts.map(a=><div key={a.a} onClick={()=>onNav(a.a)} style={{background:$.c,borderRadius:12,border:`1.5px solid ${$.b}`,padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}} onMouseEnter={e=>e.currentTarget.style.borderColor=a.c} onMouseLeave={e=>e.currentTarget.style.borderColor=$.b}><div style={{width:44,height:44,borderRadius:10,background:a.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{a.i}</div><div style={{fontWeight:700,fontSize:14,color:$.i}}>{a.l}</div></div>)}</div></div>
  </div>;
}

/* ═══ TEACHER CLASSES ═══ */
const CC=["#0E7490","#2D7A4F","#6B3FA0","#C0392B","#C9963A","#3B6DC1","#E91E63","#FF5722"];
function TC({tid,users,setUsers,classes,setClasses}){
  const[cn,sCn]=useState("");const[cm,sCm]=useState("");const[sel,sSel]=useState(null);
  const[sn,sSn]=useState("");const[su,sSu]=useState("");const[sp,sSp]=useState("");const[sm,sSm]=useState("");
  const mc=classes.filter(c=>c.teacherId===tid),ms=users.filter(u=>u.teacherId===tid&&u.role==="student");
  async function ac(){if(!cn){sCm("Enter name.");return;}await setClasses([...classes,{id:uid(),name:cn,teacherId:tid,color:CC[mc.length%CC.length]}]);sCn("");sCm("✓ Created!");}
  async function dc(id){await setClasses(classes.filter(c=>c.id!==id));await setUsers(users.map(u=>u.classId===id?{...u,classId:null}:u));if(sel===id)sSel(null);}
  async function as(){if(!sn||!su||!sp){sSm("Fill all.");return;}if(!sel){sSm("Pick class.");return;}if(users.find(u=>u.username===su)){sSm("Taken.");return;}await setUsers([...users,{id:uid(),username:su,password:sp,role:"student",name:sn,teacherId:tid,classId:sel,profilePhoto:null}]);sSn("");sSu("");sSp("");sSm("✓ Added!");}
  async function ds(id){if(!window.confirm("Remove?"))return;await setUsers(users.filter(u=>u.id!==id));}
  const sc=sel?mc.find(c=>c.id===sel):null,cs=sel?ms.filter(u=>u.classId===sel):[];
  return<div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:20,alignItems:"start"}}>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <C style={{padding:16}}><h3 style={{fontFamily:fd,fontSize:15,margin:"0 0 10px",color:$.p}}>Create Class</h3><I value={cn} onChange={sCn} placeholder="e.g. Class A"/><M t={cm}/><B v="teal" onClick={ac} full style={{marginTop:10}}>+ Create</B></C>
      {mc.map(cl=><div key={cl.id} onClick={()=>sSel(cl.id===sel?null:cl.id)} style={{background:sel===cl.id?$.p:$.c,color:sel===cl.id?"#fff":$.i,borderRadius:12,border:`2px solid ${sel===cl.id?$.p:$.b}`,padding:"12px 14px",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:12,height:12,borderRadius:"50%",background:cl.color}}/><span style={{fontWeight:700,fontSize:14}}>{cl.name}</span></div><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:12,opacity:.8}}>{ms.filter(u=>u.classId===cl.id).length} 👥</span><button onClick={e=>{e.stopPropagation();dc(cl.id);}} style={{background:"rgba(192,57,43,.15)",border:"none",color:sel===cl.id?"#FF8A80":$.d,borderRadius:6,padding:"2px 7px",cursor:"pointer",fontSize:11,fontWeight:700}}>✕</button></div></div></div>)}
    </div>
    <div>{!sc?<C style={{textAlign:"center",padding:48}}><span style={{fontSize:36}}>🏫</span><p style={{color:$.m,margin:"12px 0 0"}}>Select a class.</p></C>:
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <C style={{padding:16,borderLeft:`4px solid ${sc.color}`}}><h3 style={{fontFamily:fd,fontSize:16,margin:"0 0 12px",color:$.p}}>Add Student to {sc.name}</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><div><L>Name</L><I value={sn} onChange={sSn}/></div><div><L>Username</L><I value={su} onChange={sSu}/></div><div><L>Password</L><Pw value={sp} onChange={sSp}/></div></div><M t={sm}/><B v="primary" onClick={as} style={{marginTop:8}}>+ Add</B></C>
        <C style={{padding:0,overflow:"hidden"}}><div style={{padding:"12px 18px",background:$.p,color:"#fff",fontWeight:700}}>{sc.name} — {cs.length} students</div>{cs.length===0?<div style={{padding:24,textAlign:"center",color:$.m}}>Empty.</div>:cs.map((s,i)=><div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",borderBottom:i<cs.length-1?`1px solid ${$.b}`:"none",background:i%2===0?$.c:$.bg}}><div style={{display:"flex",alignItems:"center",gap:10}}><Av photo={s.profilePhoto} name={s.name} size={34}/><div><div style={{fontWeight:700,fontSize:14,color:$.i}}>{s.name}</div><div style={{fontSize:11,color:$.m}}>@{s.username}</div></div></div><B v="danger" s onClick={()=>ds(s.id)}>Remove</B></div>)}</C>
      </div>}
    </div>
  </div>;
}

/* ═══ TEACHER STUDENT INFO ═══ */
function TI({tid,users,classes}){const[sp,sSp]=useState({});const mc=classes.filter(c=>c.teacherId===tid),stu=users.filter(u=>u.teacherId===tid&&u.role==="student");return<div><h2 style={{fontFamily:fd,fontSize:19,color:$.p,margin:"0 0 16px"}}>Student Login Info</h2>{stu.length===0?<C><p style={{color:$.m,margin:0}}>None.</p></C>:mc.map(cl=>{const cs=stu.filter(s=>s.classId===cl.id);if(!cs.length)return null;return<div key={cl.id} style={{marginBottom:20}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:10,height:10,borderRadius:"50%",background:cl.color}}/><span style={{fontWeight:700,fontSize:15,color:$.p}}>{cl.name}</span></div><C style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse",fontFamily:fb}}><thead><tr style={{background:$.p}}>{["#","Name","Username","Password",""].map(h=><th key={h} style={{textAlign:"left",padding:"11px 14px",color:"rgba(255,255,255,.75)",fontWeight:600,fontSize:11,textTransform:"uppercase"}}>{h}</th>)}</tr></thead><tbody>{cs.map((s,i)=><tr key={s.id} style={{borderBottom:`1px solid ${$.b}`,background:i%2===0?$.c:$.bg}}><td style={{padding:"12px 14px",color:$.m}}>{i+1}</td><td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><Av photo={s.profilePhoto} name={s.name} size={30}/><span style={{fontWeight:700,color:$.i}}>{s.name}</span></div></td><td style={{padding:"12px 14px"}}><span style={{background:$.bb,color:$.bl,borderRadius:6,padding:"3px 8px",fontSize:12,fontWeight:600,fontFamily:"monospace"}}>{s.username}</span></td><td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{background:"#FFF8EE",color:$.a,borderRadius:6,padding:"3px 8px",fontSize:12,fontWeight:600,fontFamily:"monospace",letterSpacing:sp[s.id]?0:2}}>{sp[s.id]?s.password:"•".repeat(Math.min(s.password?.length||8,10))}</span><button onClick={()=>sSp(p=>({...p,[s.id]:!p[s.id]}))} style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:$.m}}>{sp[s.id]?"🙈":"👁️"}</button></div></td><td/></tr>)}</tbody></table></C></div>;})}</div>;}

/* ═══ TEACHER DAILY LIST ═══ */
function TDL({tid,assignments,onOpen}){const daily=assignments.filter(a=>a.teacherId===tid&&a.daily).sort((a,b)=>new Date(b.dueDate)-new Date(a.dueDate));const grp={};daily.forEach(a=>{const k=a.dueDate||"?";if(!grp[k])grp[k]=[];grp[k].push(a);});const dates=Object.keys(grp).sort((a,b)=>new Date(b)-new Date(a));return<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><h2 style={{fontFamily:fd,fontSize:19,color:$.p,margin:0}}>Daily Assignments</h2><p style={{color:$.m,fontSize:13,margin:"4px 0 0"}}>Click a day to manage.</p></div><B v="teal" onClick={()=>onOpen(td())}>📅 Open Today</B></div>{dates.length===0?<C style={{textAlign:"center",padding:48}}><div style={{fontSize:40,marginBottom:10}}>📅</div><p style={{color:$.m,margin:0}}>No daily assignments yet.</p></C>:dates.map(dk=><div key={dk} onClick={()=>onOpen(dk)} style={{background:$.c,borderRadius:12,border:`1.5px solid ${$.b}`,padding:"14px 18px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}} onMouseEnter={e=>e.currentTarget.style.borderColor=$.t} onMouseLeave={e=>e.currentTarget.style.borderColor=$.b}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:44,height:44,borderRadius:10,background:dk===td()?$.t:$.p,color:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{fontSize:17,fontWeight:800,lineHeight:1}}>{new Date(dk).getDate()}</div><div style={{fontSize:9,opacity:.8,textTransform:"uppercase"}}>{new Date(dk).toLocaleDateString("en-GB",{month:"short"})}</div></div><div><div style={{fontWeight:700,fontSize:14,color:$.i}}>{fDy(dk)}{dk===td()?" ":"" }{dk===td()&&<Bg label="Today" color={$.t}/>}</div><div style={{fontSize:12,color:$.m,marginTop:2}}>{grp[dk].length} assignment{grp[dk].length!==1?"s":""}</div></div></div><span style={{color:$.m}}>→</span></div>)}</div>;}

/* ═══ TEACHER DAY PAGE (Regular + Shadowing toggle) ═══ */
function TDP({dateKey,tid,assignments,setAssigns,submissions,users,classes,onBack}){
  const[title,sTitle]=useState("");const[subj,sSubj]=useState("");const[desc,sDesc]=useState("");const[cid,sCid]=useState("all");const[att,sAtt]=useState([]);const[msg,sMsg]=useState("");const[selId,sSelId]=useState(null);
  const[isSh,sIsSh]=useState(false);const[vUrl,sVUrl]=useState("");const[tTxt,sTTxt]=useState("");const[busy,sBusy]=useState(false);
  const mc=classes.filter(c=>c.teacherId===tid),stAll=users.filter(u=>u.teacherId===tid&&u.role==="student");
  const dayA=assignments.filter(a=>a.teacherId===tid&&a.daily&&a.dueDate===dateKey);

  async function create(){if(!title){sMsg("Enter title.");return;}if(isSh&&!tTxt){sMsg("Enter target text.");return;}sBusy(true);const a={id:uid(),title,subject:subj,description:desc,dueDate:dateKey,teacherId:tid,classId:cid,attachments:att,daily:true,createdAt:new Date().toISOString(),type:isSh?"shadowing":"regular",videoUrl:isSh?vUrl:"",targetText:isSh?tTxt:""};await setAssigns([...assignments,a]);sTitle("");sSubj("");sDesc("");sCid("all");sAtt([]);sVUrl("");sTTxt("");sIsSh(false);sBusy(false);sMsg("✓ Added!");sSelId(a.id);setTimeout(()=>sMsg(""),2e3);}
  async function del(id){await setAssigns(assignments.filter(a=>a.id!==id));if(selId===id)sSelId(null);}
  const sel=selId?assignments.find(a=>a.id===selId):null;
  const stFor=a=>stAll.filter(s=>a.classId==="all"||s.classId===a.classId);

  return<div>
    <button onClick={onBack} style={{background:"none",border:"none",color:$.bl,fontFamily:fb,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:16,padding:0}}>← Back</button>
    <div style={{background:$.p,borderRadius:12,padding:"16px 20px",marginBottom:18,display:"flex",alignItems:"center",gap:14}}><div style={{width:50,height:50,borderRadius:12,background:$.t,color:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{fontSize:19,fontWeight:800,lineHeight:1}}>{new Date(dateKey).getDate()}</div><div style={{fontSize:10,opacity:.8,textTransform:"uppercase"}}>{new Date(dateKey).toLocaleDateString("en-GB",{month:"short"})}</div></div><div><h2 style={{fontFamily:fd,color:"#fff",fontSize:19,margin:0}}>{fDy(dateKey)}</h2><p style={{color:"rgba(255,255,255,.6)",fontSize:13,margin:"2px 0 0"}}>{dayA.length} assignment{dayA.length!==1?"s":""}</p></div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:18,alignItems:"start"}}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <C style={{borderTop:`4px solid ${$.t}`}}>
          <h3 style={{fontFamily:fd,fontSize:15,margin:"0 0 12px",color:$.p}}>+ Add Assignment</h3>
          <div style={{display:"flex",gap:8,marginBottom:14}}><button onClick={()=>sIsSh(false)} style={{flex:1,padding:10,borderRadius:8,border:`2px solid ${!isSh?$.t:$.b}`,background:!isSh?$.t+"18":$.c,cursor:"pointer",fontFamily:fb,fontWeight:600,fontSize:13,color:!isSh?$.t:$.m}}>📝 Regular</button><button onClick={()=>sIsSh(true)} style={{flex:1,padding:10,borderRadius:8,border:`2px solid ${isSh?$.pu:$.b}`,background:isSh?$.pu+"18":$.c,cursor:"pointer",fontFamily:fb,fontWeight:600,fontSize:13,color:isSh?$.pu:$.m}}>🎙️ Shadowing</button></div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><L>Title *</L><I value={title} onChange={sTitle} placeholder={isSh?"e.g. BBC Shadowing":"e.g. Reading task"}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><L>Subject</L><I value={subj} onChange={sSubj} placeholder="English"/></div><div><L>Class</L><select value={cid} onChange={e=>sCid(e.target.value)} style={{...SS(),width:"100%"}}><option value="all">All</option>{mc.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
            {isSh&&<><div><L>Video URL (YouTube or direct)</L><I value={vUrl} onChange={sVUrl} placeholder="https://youtube.com/watch?v=..."/>{vUrl.trim()&&<div style={{marginTop:8}}><VP url={vUrl}/></div>}</div><div><L>Target Text *</L><Tx value={tTxt} onChange={sTTxt} placeholder="Paste exact words to shadow…" rows={4}/></div></>}
            <div><L>Instructions{isSh?" (optional)":""}</L><Tx value={desc} onChange={sDesc} placeholder="Describe…" rows={isSh?2:3}/></div>
            {!isSh&&<div><L>Attach Files</L><FU at={att} setAt={sAtt}/></div>}
            <M t={msg}/>
            <B v={isSh?"purple":"teal"} onClick={create} full disabled={busy}>{busy?"⏳ Creating…":`${isSh?"🎙️":"📝"} Add`}</B>
          </div>
        </C>
        {dayA.map(a=>{const st=stFor(a);const done=submissions.filter(s=>s.assignmentId===a.id).length;const act=selId===a.id;return<div key={a.id} onClick={()=>sSelId(act?null:a.id)} style={{background:act?$.p:$.c,color:act?"#fff":$.i,borderRadius:10,border:`2px solid ${act?$.t:$.b}`,padding:"12px 16px",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:14}}>{a.type==="shadowing"?"🎙️":"📝"}</span><span style={{fontWeight:700,fontSize:13}}>{a.title}</span></div><div style={{fontSize:11,opacity:.7,marginTop:2}}>{a.classId==="all"?"All":mc.find(c=>c.id===a.classId)?.name||"?"}</div></div><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:11,fontWeight:700,color:act?"rgba(255,255,255,.7)":$.s}}>{done}/{st.length} ✓</span><button onClick={e=>{e.stopPropagation();del(a.id);}} style={{background:"rgba(192,57,43,.15)",border:"none",color:act?"#FF8A80":$.d,borderRadius:5,padding:"2px 7px",cursor:"pointer",fontSize:11,fontWeight:700}}>✕</button></div></div></div>;})}
        {dayA.length===0&&<C style={{textAlign:"center",padding:18}}><p style={{color:$.m,fontSize:13,margin:0}}>Add above.</p></C>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {sel?<><C style={{borderTop:`4px solid ${sel.type==="shadowing"?$.pu:$.t}`}}><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>{sel.type==="shadowing"&&<Bg label="🎙️ Shadowing" color={$.pu}/>}{sel.subject&&<Bg label={sel.subject} color={$.bl}/>}<Bg label={sel.classId==="all"?"All":mc.find(c=>c.id===sel.classId)?.name||"?"} color={$.t}/></div><h2 style={{fontFamily:fd,fontSize:18,color:$.p,margin:"0 0 8px"}}>{sel.title}</h2>{sel.description&&<p style={{fontSize:13,color:$.m,margin:"0 0 10px",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{sel.description}</p>}{sel.videoUrl&&sel.videoUrl.trim()&&<div style={{marginBottom:10}}><VP url={sel.videoUrl}/></div>}{sel.targetText&&<div style={{background:$.bg,borderRadius:9,padding:12,border:`1px solid ${$.b}`,marginBottom:10}}><L>Target Text</L><p style={{fontSize:14,color:$.i,lineHeight:1.8,margin:"4px 0 0",fontStyle:"italic",whiteSpace:"pre-wrap"}}>{sel.targetText}</p></div>}{(sel.attachments||[]).length>0&&<AV at={sel.attachments}/>}</C>
        <C><h3 style={{fontFamily:fd,fontSize:15,color:$.p,margin:"0 0 12px"}}>📋 Checklist</h3>{(()=>{const st=stFor(sel);if(!st.length)return<p style={{color:$.m}}>No students.</p>;const done=submissions.filter(s=>s.assignmentId===sel.id).length;const pct=st.length?Math.round(done/st.length*100):0;return<><div style={{display:"flex",flexDirection:"column",gap:6}}>{st.map(s=>{const sub=submissions.find(sb=>sb.studentId===s.id&&sb.assignmentId===sel.id);return<div key={s.id} style={{display:"grid",gridTemplateColumns:"1fr 110px",gap:8,alignItems:"center",padding:"8px 12px",background:sub?$.sb:$.db,borderRadius:9,border:`1px solid ${sub?$.s+"44":$.d+"22"}`}}><div style={{display:"flex",alignItems:"center",gap:8}}><Av photo={s.profilePhoto} name={s.name} size={26}/><span style={{fontWeight:700,fontSize:13,color:$.i}}>{s.name}</span></div><div style={{textAlign:"center"}}>{sub?sub.feedback?<span style={{fontSize:11,background:$.s+"22",color:$.s,padding:"2px 7px",borderRadius:7,fontWeight:700}}>✅</span>:<span style={{fontSize:11,background:$.a+"22",color:$.a,padding:"2px 7px",borderRadius:7,fontWeight:700}}>📤</span>:<span style={{fontSize:11,background:$.d+"18",color:$.d,padding:"2px 7px",borderRadius:7,fontWeight:700}}>❌</span>}</div></div>;})}</div><div style={{marginTop:10,padding:"10px 12px",background:$.bg,borderRadius:9,border:`1px solid ${$.b}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,fontWeight:700}}>Completion</span><span style={{fontSize:12,fontWeight:700,color:$.s}}>{done}/{st.length} ({pct}%)</span></div><div style={{height:6,background:$.b,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?$.s:$.a,borderRadius:3}}/></div></div></>;})()}</C></>:<C style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:180,flexDirection:"column",gap:10}}><span style={{fontSize:32}}>📋</span><p style={{color:$.m,fontSize:13,textAlign:"center",margin:0}}>Select an assignment.</p></C>}
      </div>
    </div>
  </div>;
}

/* ═══ TEACHER SUBMISSIONS ═══ */
function TS({tid,submissions,users,assignments,classes}){const[sel,sSel]=useState(null);const[fC,sFC]=useState("all");const[fA,sFA]=useState("all");const mc=classes.filter(c=>c.teacherId===tid);let fl=submissions.filter(s=>s.teacherId===tid);if(fC!=="all")fl=fl.filter(s=>{const st=users.find(u=>u.id===s.studentId);return st?.classId===fC;});if(fA!=="all")fl=fl.filter(s=>s.assignmentId===fA);fl=[...fl].sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));const ss=sel?submissions.find(s=>s.id===sel):null;
return<div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:18,alignItems:"start"}}><div><div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}><select value={fC} onChange={e=>sFC(e.target.value)} style={SS()}><option value="all">All Classes</option>{mc.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={fA} onChange={e=>sFA(e.target.value)} style={SS()}><option value="all">All Assignments</option>{assignments.filter(a=>a.teacherId===tid).map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></div>{fl.length===0?<C><p style={{color:$.m,margin:0}}>None.</p></C>:fl.map(sub=>{const st=users.find(u=>u.id===sub.studentId),as=assignments.find(a=>a.id===sub.assignmentId);return<div key={sub.id} onClick={()=>sSel(sub.id)} style={{padding:"12px 16px",background:sel===sub.id?$.p:$.c,color:sel===sub.id?"#fff":$.i,borderRadius:10,border:`1px solid ${sel===sub.id?$.p:$.b}`,cursor:"pointer",marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:13}}>{st?.name||"?"}</div><div style={{fontSize:11,opacity:.7}}>{as?.title||"?"}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:11,opacity:.7}}>{fD(sub.submittedAt)}</div>{sub.feedback?<Bg label="✓" color={$.s}/>:<Bg label="⏳" color={$.a}/>}</div></div></div>;})}</div>
{ss?<div style={{display:"flex",flexDirection:"column",gap:12}}><C><div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}><Av photo={users.find(u=>u.id===ss.studentId)?.profilePhoto} name={users.find(u=>u.id===ss.studentId)?.name} size={36}/><div><div style={{fontWeight:700,color:$.i}}>{users.find(u=>u.id===ss.studentId)?.name}</div><div style={{fontSize:12,color:$.m}}>{assignments.find(a=>a.id===ss.assignmentId)?.title} · {fD(ss.submittedAt)}</div></div></div>{ss.content&&<><L>Answer</L><div style={{background:$.bg,borderRadius:8,padding:12,fontSize:14,lineHeight:1.7,color:$.i,whiteSpace:"pre-wrap",border:`1px solid ${$.b}`,marginTop:4}}>{ss.content}</div></>}{ss.transcript&&<><L>Shadowing Transcript</L><div style={{background:$.bg,borderRadius:8,padding:12,fontSize:14,color:$.i,border:`1px solid ${$.b}`,marginTop:4,fontStyle:"italic"}}>{ss.transcript}</div></>}</C>{(ss.attachments||[]).length>0&&<C><AV at={ss.attachments}/></C>}{ss.feedback&&<C style={{background:$.sb,border:`1px solid ${$.s}44`}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:22}}>🤖</span><h3 style={{fontFamily:fd,fontSize:16,color:$.s,margin:0}}>AI Feedback</h3></div><FB text={ss.feedback}/></C>}</div>:<C style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:160}}><p style={{color:$.m}}>← Select a submission</p></C>}
</div>;}

/* ═══ SETTINGS ═══ */
function Sett({user,onPhoto,theme,onTheme}){const ref=useRef();return<div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:18}}><C><h3 style={{fontFamily:fd,fontSize:16,margin:"0 0 14px",color:$.p}}>Profile Photo</h3><div style={{textAlign:"center"}}><div style={{position:"relative",display:"inline-block",cursor:"pointer"}} onClick={()=>ref.current.click()}><Av photo={user.profilePhoto} name={user.name} size={80}/><div style={{position:"absolute",bottom:0,right:0,background:$.a,color:"#fff",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>📷</div></div><p style={{fontSize:12,color:$.m,margin:"6px 0 0"}}>Click to change</p><input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files?.[0];if(f)onPhoto(await cAv(f));}}/></div></C><C><h3 style={{fontFamily:fd,fontSize:16,margin:"0 0 14px",color:$.p}}>Theme</h3><div><L>Choose</L><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>{Object.entries(TH).map(([k,t])=><button key={k} onClick={()=>onTheme(k)} style={{border:`2px solid ${theme===k?t.a:t.b}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",background:t.bg,display:"flex",alignItems:"center",gap:8}}><div style={{width:18,height:18,borderRadius:"50%",background:t.n,border:`2px solid ${t.a}`}}/><span style={{fontSize:12,fontWeight:600,color:t.i}}>{t.l}</span>{theme===k&&<span style={{marginLeft:"auto"}}>✓</span>}</button>)}</div></div></C></div>;}

/* ═══ STUDENT: LIST ═══ */
function SL({user,assignments,submissions,onOpen}){
  const mine=submissions.filter(s=>s.studentId===user.id);
  function st(aId){const s=mine.find(s=>s.assignmentId===aId);if(!s)return"p";if(s.feedback)return"f";if(s.feedbackStatus==="loading")return"c";return"s";}
  const mt={p:{l:"Not submitted",c:$.m,i:"📋",st:$.p},s:{l:"Submitted",c:$.bl,i:"📤",st:$.bl},c:{l:"Checking…",c:$.a,i:"⏳",st:$.a},f:{l:"Feedback ✓",c:$.s,i:"✅",st:$.s}};
  const sorted=[...assignments.filter(a=>a.classId==="all"||a.classId===user.classId)].sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  return<div><h2 style={{fontFamily:fd,fontSize:20,color:$.p,margin:"0 0 18px"}}>My Assignments</h2>{sorted.length===0?<C><p style={{color:$.m,margin:0}}>None yet.</p></C>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>{sorted.map(a=>{const s=st(a.id),m=mt[s],od=a.dueDate<td()&&s==="p",sh=a.type==="shadowing";return<div key={a.id} onClick={()=>onOpen(a.id)} style={{background:$.c,borderRadius:13,border:`2px solid ${s==="f"?$.s:$.b}`,padding:18,cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,.06)",position:"relative",overflow:"hidden"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}><div style={{position:"absolute",top:0,left:0,right:0,height:4,background:sh?$.pu:m.st}}/>{a.daily&&<div style={{position:"absolute",top:10,right:10,background:$.t,color:"#fff",fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:8}}>DAILY</div>}<div style={{display:"flex",justifyContent:"space-between",marginBottom:8,marginTop:a.daily?6:0}}><span style={{fontSize:22}}>{sh?"🎙️":m.i}</span><div style={{display:"flex",gap:4,justifyContent:"flex-end",flexWrap:"wrap"}}><Bg label={`Due ${fD(a.dueDate)}`} color={od?$.d:$.s}/>{sh&&<Bg label="Shadowing" color={$.pu}/>}</div></div><h3 style={{fontFamily:fd,fontSize:15,fontWeight:700,color:$.i,margin:"0 0 3px"}}>{a.title}</h3>{a.subject&&<div style={{fontSize:11,fontWeight:700,color:$.bl,textTransform:"uppercase",marginBottom:5}}>{a.subject}</div>}<p style={{color:$.m,fontSize:12,margin:"0 0 10px",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{a.description||a.targetText||"No description."}</p><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontWeight:700,color:m.c}}>{m.l}</span><span style={{fontSize:12,color:$.bl,fontWeight:700}}>Open →</span></div></div>;})}</div>}</div>;
}

/* ═══ STUDENT: ASSIGNMENT PAGE ═══ */
function SP({assignment:a,user,submissions,setSubs,onBack}){
  const sh=a.type==="shadowing";const[ans,sAns]=useState("");const[att,sAtt]=useState([]);const[ld,sLd]=useState(false);const[msg,sMsg]=useState("");
  const cur=submissions.find(s=>s.studentId===user.id&&s.assignmentId===a.id);
  async function submit(){if(!ans.trim()&&!att.length){sMsg("Write answer or attach file.");return;}sLd(true);sMsg("Generating feedback…");const sub={id:uid(),studentId:user.id,assignmentId:a.id,teacherId:a.teacherId,content:ans.trim(),attachments:att,submittedAt:new Date().toISOString(),feedback:null,feedbackStatus:"loading",type:"regular"};const up=[...submissions,sub];await setSubs(up);try{const fb=await ai(HW,`Assignment: "${a.title}"\nSubject: ${a.subject||"General"}\nInstructions: ${a.description||"N/A"}\n\nAnswer:\n${ans.trim()||"(file only)"}`);await setSubs(up.map(s=>s.id===sub.id?{...s,feedback:fb,feedbackStatus:"done"}:s));sMsg("✓ Done!");}catch{await setSubs(up.map(s=>s.id===sub.id?{...s,feedbackStatus:"error"}:s));sMsg("Failed.");}sLd(false);}
  async function onSR(tr,fb){const sub={id:uid(),studentId:user.id,assignmentId:a.id,teacherId:a.teacherId,content:"",transcript:tr,feedback:fb,attachments:[],submittedAt:new Date().toISOString(),feedbackStatus:"done",type:"shadowing"};await setSubs([...submissions.filter(s=>!(s.studentId===user.id&&s.assignmentId===a.id)),sub]);}
  const eSh=sh?submissions.find(s=>s.studentId===user.id&&s.assignmentId===a.id):null;
  return<div>
    <button onClick={onBack} style={{background:"none",border:"none",color:$.bl,fontFamily:fb,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:14,padding:0}}>← Back</button>
    <C style={{marginBottom:14,borderTop:`5px solid ${sh?$.pu:a.daily?$.t:$.p}`}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>{a.daily&&<Bg label="📅 Daily" color={$.t}/>}{sh&&<Bg label="🎙️ Shadowing" color={$.pu}/>}{a.subject&&<Bg label={a.subject} color={$.bl}/>}<Bg label={a.dueDate<td()?`Overdue — ${fD(a.dueDate)}`:`Due ${fD(a.dueDate)}`} color={a.dueDate<td()?$.d:$.s}/></div>
      <h2 style={{fontFamily:fd,fontSize:21,color:$.p,margin:"0 0 12px"}}>{a.title}</h2>
      {sh&&a.videoUrl&&a.videoUrl.trim()&&<div style={{marginBottom:16}}><L>Video — Watch, then record yourself</L><div style={{marginTop:6}}><VP url={a.videoUrl}/></div></div>}
      {sh&&a.targetText&&<div style={{background:$.bg,borderRadius:9,padding:14,border:`1px solid ${$.b}`,marginBottom:a.description?14:0}}><L>Target Text — Listen, then imitate:</L><p style={{fontSize:15,color:$.i,lineHeight:1.9,margin:"8px 0 0",whiteSpace:"pre-wrap",fontStyle:"italic"}}>{a.targetText}</p></div>}
      {a.description&&<div style={{background:$.bg,borderRadius:9,padding:14,border:`1px solid ${$.b}`}}><L>Instructions</L><p style={{fontSize:14,color:$.i,lineHeight:1.75,margin:"6px 0 0",whiteSpace:"pre-wrap"}}>{a.description}</p></div>}
      {(a.attachments||[]).length>0&&<div style={{marginTop:12}}><L>Teacher's Files</L><div style={{marginTop:6}}><AV at={a.attachments}/></div></div>}
    </C>
    {sh&&<C><h3 style={{fontFamily:fd,fontSize:16,color:$.p,margin:"0 0 4px"}}>🎙️ Your Recording</h3><p style={{fontSize:13,color:$.m,margin:"0 0 14px"}}>Play the video, press Record, speak along.</p><VR targetText={a.targetText} onResult={onSR} eFb={eSh?.feedback} eTr={eSh?.transcript}/></C>}
    {!sh&&!cur&&<C><h3 style={{fontFamily:fd,fontSize:16,color:$.p,margin:"0 0 12px"}}>Your Submission</h3><L>Answer</L><Tx value={ans} onChange={sAns} placeholder="Write your answer…" rows={8} disabled={ld}/><div style={{marginTop:12}}><L>Attach Files (optional)</L><FU at={att} setAt={sAtt} dis={ld}/></div><M t={msg}/><div style={{marginTop:12}}><B v="accent" onClick={submit} disabled={ld}>{ld?"⏳ Generating…":"✦ Submit & Get Feedback"}</B></div></C>}
    {!sh&&cur&&<div style={{display:"flex",flexDirection:"column",gap:12}}><C><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}><h3 style={{fontFamily:fd,fontSize:16,color:$.p,margin:0}}>Your Answer</h3><div style={{display:"flex",gap:8}}><span style={{fontSize:12,color:$.m}}>{fD(cur.submittedAt)} {fT(cur.submittedAt)}</span>{cur.feedback?<Bg label="Checked ✓" color={$.s}/>:<Bg label="Checking…" color={$.a}/>}</div></div>{cur.content?<div style={{background:$.bg,borderRadius:9,padding:14,fontSize:14,lineHeight:1.7,color:$.i,whiteSpace:"pre-wrap",border:`1px solid ${$.b}`}}>{cur.content}</div>:<p style={{color:$.m,fontStyle:"italic"}}>File only.</p>}{(cur.attachments||[]).length>0&&<div style={{marginTop:10}}><AV at={cur.attachments}/></div>}</C>{cur.feedback?<C style={{background:$.sb,border:`1.5px solid ${$.s}55`}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:26}}>🤖</span><h3 style={{fontFamily:fd,fontSize:16,color:$.s,margin:0}}>AI Feedback</h3></div><FB text={cur.feedback}/></C>:<C style={{textAlign:"center",padding:28}}><div style={{fontSize:30,marginBottom:8}}>⏳</div><p style={{color:$.m,margin:0}}>Generating…</p></C>}</div>}
  </div>;
}

/* ═══ STUDENT: MY SUBMISSIONS ═══ */
function SM({user,submissions,assignments,onOpen}){const mine=[...submissions.filter(s=>s.studentId===user.id)].sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));return<div><h2 style={{fontFamily:fd,fontSize:20,color:$.p,margin:"0 0 18px"}}>My Submissions</h2>{mine.length===0?<C><p style={{color:$.m,margin:0}}>None yet.</p></C>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{mine.map(sub=>{const a=assignments.find(x=>x.id===sub.assignmentId);return<C key={sub.id} style={{padding:"12px 16px",cursor:"pointer"}} onClick={()=>onOpen(sub.assignmentId)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><div style={{fontWeight:700,fontSize:14,color:$.i,marginBottom:2}}>{sub.type==="shadowing"?"🎙️ ":""}{a?.title||"?"}</div><div style={{fontSize:12,color:$.m}}>{fD(sub.submittedAt)}</div></div><div style={{display:"flex",gap:8,alignItems:"center"}}>{sub.feedback?<Bg label="Feedback ✓" color={$.s}/>:<Bg label="Submitted" color={$.bl}/>}<span style={{fontSize:12,color:$.bl,fontWeight:700}}>Open →</span></div></div></C>;})}</div>}</div>;}

/* ═══ ROOT APP ═══ */
export default function App(){
  const[users,sU]=useState(null);const[classes,sC]=useState(null);const[assigns,sA]=useState(null);const[subs,sS]=useState(null);const[shSubs,sSS]=useState(null);
  const[cur,sCur]=useState(null);const[theme,sTh]=useState("default");const[dw,sDw]=useState(false);const[aN,sAN]=useState({v:"dashboard"});const[sN,sSN]=useState({v:"list",t:"assignments"});
  $=TH[theme]||TH.default;
  useEffect(()=>{(async()=>{const st=await ld("hw_users",[SA]);const w=st.find(x=>x.id==="super_admin")?st.map(x=>x.id==="super_admin"?{...x,username:SA.username,password:SA.password}:x):[SA,...st.filter(x=>x.id!=="super_admin")];await sv("hw_users",w);sU(w);sC(await ld("hw_classes",[]));sA(await ld("hw_assignments",[]));sS(await ld("hw_submissions",[]));sSS(await ld("hw_shadow_subs",[]));sTh(await ld("hw_theme","default"));})();},[]);
  const setU=useCallback(async u=>{sU(u);await sv("hw_users",u);},[]);
  const setC=useCallback(async c=>{sC(c);await sv("hw_classes",c);},[]);
  const setA=useCallback(async a=>{sA(a);await sv("hw_assignments",a);},[]);
  const setS=useCallback(async s=>{sS(s);await sv("hw_submissions",s);},[]);
  const setSS2=useCallback(async s=>{sSS(s);await sv("hw_shadow_subs",s);},[]);
  const setTh=useCallback(async t=>{sTh(t);await sv("hw_theme",t);},[]);
  async function uPh(id,ph){const u=users.map(x=>x.id===id?{...x,profilePhoto:ph}:x);await setU(u);if(cur?.id===id)sCur(p=>({...p,profilePhoto:ph}));}
  function logout(){sCur(null);sAN({v:"dashboard"});sSN({v:"list",t:"assignments"});sDw(false);}
  if(!users||!classes||!assigns||!subs||!shSubs)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:$.bg,fontFamily:fb,color:$.m}}>Loading…</div>;
  if(!cur)return<Login onLogin={sCur} users={users}/>;

  /* SUPER ADMIN */
  if(cur.role==="super_admin"){
    return<div style={{minHeight:"100vh",background:$.bg,fontFamily:fb}}>
      <Dr open={dw} onClose={()=>sDw(false)} tab="admin" setTab={()=>{}} items={[{id:"admin",label:"Management",icon:"👨‍🏫"}]} onLogout={logout} user={cur}/>
      <NB user={cur} onLogout={logout} onHam={()=>sDw(o=>!o)} open={dw} label="Super Admin"/>
      <div style={{display:"flex",justifyContent:"flex-end",padding:"14px 22px 0",maxWidth:1200,margin:"0 auto"}}><B v="logout" onClick={logout} style={{gap:8}}>⏏ Log Out</B></div>
      <Admin users={users} setUsers={setU} classes={classes} setClasses={setC} assignments={assigns} setAssigns={setA} submissions={subs} setSubs={setS} shadowSubs={shSubs} setShadowSubs={setSS2} theme={theme} onTheme={setTh}/>
    </div>;
  }

  /* TEACHER */
  if(cur.role==="teacher"){
    const tid=cur.id;const menu=[{id:"dashboard",label:"Dashboard",icon:"🏠"},{id:"daily",label:"Daily Assignments",icon:"📅"},{id:"classes",label:"My Classes",icon:"🏫"},{id:"studentinfo",label:"Student Logins",icon:"🔑"},{id:"submissions",label:"Submissions",icon:"📬"},{id:"settings",label:"Settings",icon:"⚙️"}];
    const curL=aN.v==="daypage"?`📅 ${fDy(aN.dk)}`:menu.find(m=>m.id===aN.v)?.label||"";
    return<div style={{minHeight:"100vh",background:$.bg,fontFamily:fb}}>
      <Dr open={dw} onClose={()=>sDw(false)} tab={aN.v==="daypage"?"daily":aN.v} setTab={id=>sAN({v:id})} items={menu} onLogout={logout} user={cur}/>
      <NB user={cur} onLogout={logout} onHam={()=>sDw(o=>!o)} open={dw} label={curL}/>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"22px 20px"}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><B v="logout" onClick={logout} style={{gap:8}}>⏏ Log Out</B></div>
        {aN.v==="dashboard"&&<TD tid={tid} users={users} classes={classes} assignments={assigns} submissions={subs} onNav={id=>sAN({v:id})}/>}
        {aN.v==="daily"&&<TDL tid={tid} assignments={assigns} onOpen={dk=>sAN({v:"daypage",dk})}/>}
        {aN.v==="daypage"&&<TDP dateKey={aN.dk} tid={tid} assignments={assigns} setAssigns={setA} submissions={subs} users={users} classes={classes} onBack={()=>sAN({v:"daily"})}/>}
        {aN.v==="classes"&&<TC tid={tid} users={users} setUsers={setU} classes={classes} setClasses={setC}/>}
        {aN.v==="studentinfo"&&<TI tid={tid} users={users} classes={classes}/>}
        {aN.v==="submissions"&&<TS tid={tid} submissions={subs} users={users} assignments={assigns} classes={classes}/>}
        {aN.v==="settings"&&<Sett user={cur} onPhoto={p=>uPh(cur.id,p)} theme={theme} onTheme={setTh}/>}
      </div>
    </div>;
  }

  /* STUDENT */
  const sMn=[{id:"assignments",label:"Assignments",icon:"📋"},{id:"mywork",label:"My Submissions",icon:"📤"},{id:"settings",label:"Settings",icon:"⚙️"}];
  const myA=assigns.filter(a=>a.teacherId===cur.teacherId);const myS=subs.filter(s=>s.studentId===cur.id);
  const nL=sN.v==="assignment"?assigns.find(a=>a.id===sN.aId)?.title:"";
  return<div style={{minHeight:"100vh",background:$.bg,fontFamily:fb}}>
    <Dr open={dw} onClose={()=>sDw(false)} tab={sN.t} setTab={t=>sSN({v:"list",t})} items={sMn} onLogout={logout} user={cur}/>
    <NB user={cur} onLogout={logout} onHam={()=>sDw(o=>!o)} open={dw} label={nL}/>
    <div style={{maxWidth:960,margin:"0 auto",padding:"22px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexWrap:"wrap",gap:10}}><div><h2 style={{fontFamily:fd,fontSize:21,margin:0,color:$.p}}>Welcome, {cur.name}! 👋</h2><p style={{color:$.m,fontSize:13,margin:"3px 0 0"}}>{fD(td())}</p></div><B v="logout" onClick={logout} style={{gap:8}}>⏏ Log Out</B></div>
      {sN.v==="assignment"&&(()=>{const a=assigns.find(x=>x.id===sN.aId);if(!a)return<p style={{color:$.d}}>Not found.</p>;return<SP assignment={a} user={cur} submissions={subs} setSubs={setS} onBack={()=>sSN({v:"list",t:"assignments"})}/>;})()}
      {sN.v==="list"&&sN.t==="assignments"&&<SL user={cur} assignments={myA} submissions={myS} onOpen={id=>sSN({v:"assignment",aId:id,t:"assignments"})}/>}
      {sN.v==="list"&&sN.t==="mywork"&&<SM user={cur} submissions={myS} assignments={myA} onOpen={id=>sSN({v:"assignment",aId:id,t:"mywork"})}/>}
      {sN.v==="list"&&sN.t==="settings"&&<Sett user={cur} onPhoto={p=>uPh(cur.id,p)} theme={theme} onTheme={setTh}/>}
    </div>
  </div>;
}
