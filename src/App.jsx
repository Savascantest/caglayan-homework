import React,{useEffect,useState} from 'react';

const icons={notes:'✦',grammar:'Aa',vocabulary:'↻',reading:'▤',listening:'♪',conversation:'●',quiz:'✓'};

function Exercise({q,id,onMistake}){
 const [answer,setAnswer]=useState('');
 const correct=answer===q.a;
 const choose=value=>{setAnswer(value);onMistake(id,value===q.a?null:{q:q.q,a:q.a});};
 return <div className={'exercise '+(answer?(correct?'right':'wrong'):'')}>
  <p><b>{q.q}</b></p>
  <div className="options">{q.opt.map(x=><button key={x} onClick={()=>choose(x)} className={answer===x?'chosen':''}>{x}</button>)}</div>
  {answer&&<p className="feedback">{correct?'Correct — nicely done.':<>Try again. Hint: {q.hint||'Look at the rule or text once more.'}</>}</p>}
 </div>;
}

function Questions({items,prefix,onDone,onMistake}){
 return <><div className="stack">{items.map((q,i)=><Exercise key={i} q={q} id={`${prefix}-${i}`} onMistake={onMistake}/>)}</div><button className="primary" onClick={onDone}>Mark section complete</button></>;
}

function Flashcard({card}){
 const [flipped,setFlipped]=useState(false);
 const side=flipped?card.back:card.front;
 return <button className={'flashcard '+(flipped?'flipped':'')} onClick={()=>setFlipped(!flipped)} aria-label={`${card.front.word}: flip to ${flipped?'English':'Turkish'}`}>
  <span className="flash-language">{flipped?'TÜRKÇE':'ENGLISH'} · tap to flip</span>
  <strong>{side.word}</strong>
  <span>{side.definition}</span>
  <em>{side.example}</em>
 </button>;
}

function ConversationScenario({scenario,index,onDone}){
 const [step,setStep]=useState(0);
 const [messages,setMessages]=useState([{from:'them',text:scenario.opening}]);
 const current=scenario.turns[step];
 const choose=option=>{
  setMessages([...messages,{from:'you',text:option.text},{from:'them',text:option.response}]);
  const nextStep=step+1;
  setStep(nextStep);
  if(nextStep===scenario.turns.length)onDone();
 };
 const reset=()=>{setStep(0);setMessages([{from:'them',text:scenario.opening}]);};
 return <article className="chat-card">
  <div className="chat-head"><div className="avatar">{index+1}</div><div><h3>{scenario.title}</h3><small>{scenario.context}</small></div><span>{Math.min(step,scenario.turns.length)}/{scenario.turns.length}</span></div>
  <div className="messages" aria-live="polite">{messages.map((m,i)=><div key={i} className={'bubble '+m.from}>{m.text}</div>)}</div>
  {current?<div className="reply-panel"><p>Choose your reply</p>{current.options.map((o,i)=><button key={i} onClick={()=>choose(o)}>{o.text}</button>)}</div>:<div className="chat-finished"><b>Conversation complete.</b><button onClick={reset}>Replay this situation</button></div>}
 </article>;
}

export default function App(){
 const [index,setIndex]=useState([]),[lesson,setLesson]=useState(null),[tab,setTab]=useState('notes'),[dark,setDark]=useState(false),[progress,setProgress]=useState({}),[mistakes,setMistakes]=useState({});
 useEffect(()=>{fetch('./homeworks/index.json').then(r=>r.json()).then(async list=>{setIndex(list);const r=await fetch(`./homeworks/${list[0].id}/homework.json`);setLesson(await r.json())})},[]);
 useEffect(()=>{if(!lesson)return;try{setProgress(JSON.parse(localStorage.getItem(`hw-progress-${lesson.id}`)||'{}'));setMistakes(JSON.parse(localStorage.getItem(`hw-mistakes-${lesson.id}`)||'{}'))}catch{}},[lesson]);
 const open=async item=>{const r=await fetch(`./homeworks/${item.id}/homework.json`);setLesson(await r.json());setTab('notes')};
 const complete=id=>{const next={...progress,[id]:true};setProgress(next);localStorage.setItem(`hw-progress-${lesson.id}`,JSON.stringify(next))};
 const mistake=(id,value)=>{const next={...mistakes};if(value)next[id]=value;else delete next[id];setMistakes(next);localStorage.setItem(`hw-mistakes-${lesson.id}`,JSON.stringify(next))};
 const sections=lesson?.sections||[];
 const isComplete=id=>{
  if(progress[id])return true;
  const section=sections.find(s=>s.id===id);
  if(section?.scenarios)return section.scenarios.every((_,i)=>progress[`${id}-${i}`]);
  if(section?.readings)return section.readings.every((_,i)=>progress[`${id}-${i}`]);
  return false;
 };
 const pct=sections.length?Math.round(sections.filter(s=>isComplete(s.id)).length/sections.length*100):0;
 if(!lesson)return <main className="loading">Loading homework…</main>;
 const sec=sections.find(x=>x.id===tab)||sections[0];
 return <div className={dark?'app dark':'app'}>
  <header><div><b>{lesson.student}'s English Workspace</b><small>{lesson.dateLabel} · Homework</small></div><div className="top-actions">{index.map((x,i)=><button key={x.id} className={x.id===lesson.id?'active':''} onClick={()=>open(x)}>{i===0?'Current lesson':x.dateLabel}</button>)}<button aria-label="Toggle dark mode" onClick={()=>setDark(!dark)}>{dark?'☀':'☾'}</button></div></header>
  <main><section className="hero"><div><span className="eyebrow">LESSON-BASED PRACTICE</span><h1>{lesson.title}</h1><p>{lesson.subtitle}</p></div><div className="score">{pct}%<small>complete</small></div></section>
   <nav>{sections.map(s=><button key={s.id} className={tab===s.id?'active':''} onClick={()=>setTab(s.id)}><span>{icons[s.id]||'•'}</span>{s.label}{isComplete(s.id)&&' ✓'}</button>)}</nav>
   <section className="content"><h2>{sec.title}</h2>{sec.intro&&<p className="intro">{sec.intro}</p>}
    {sec.cards&&<div className="cards">{sec.cards.map((c,i)=><article key={i}><h3>{c.title}</h3>{c.text&&<p>{c.text}</p>}{c.examples&&<ul>{c.examples.map(x=><li key={x}>{x}</li>)}</ul>}</article>)}</div>}
    {sec.flashcards&&<div className="flash-grid">{sec.flashcards.map((c,i)=><Flashcard key={i} card={c}/>)}</div>}
    {sec.scenarios&&<div className="scenario-grid">{sec.scenarios.map((s,i)=><ConversationScenario key={i} scenario={s} index={i} onDone={()=>complete(`${sec.id}-${i}`)}/>)}</div>}
    {sec.readings&&sec.readings.map((r,i)=><article className="reading" key={i}><span className="tag">Reading {i+1} · {r.level}</span><h3>{r.title}</h3>{r.text.split('\n\n').map((p,j)=><p key={j}>{p}</p>)}<Questions items={r.questions} prefix={`${sec.id}-${i}`} onDone={()=>complete(`${sec.id}-${i}`)} onMistake={mistake}/></article>)}
    {sec.external&&<article className="external"><span className="tag">{sec.external.level} · external listening</span><h3>{sec.external.title}</h3><p>{sec.external.instructions}</p><a className="primary link" href={sec.external.url} target="_blank" rel="noreferrer">Open trusted listening lesson ↗</a></article>}
    {sec.questions&&<Questions items={sec.questions} prefix={sec.id} onDone={()=>complete(sec.id)} onMistake={mistake}/>}
    {!sec.questions&&!sec.readings&&!sec.scenarios&&<button className="primary" onClick={()=>complete(sec.id)}>Mark section complete</button>}
   </section>
   {Object.keys(mistakes).length>0&&<aside><h3>Mistake review</h3>{Object.values(mistakes).map((m,i)=><p key={i}>{m.q} <b>Answer: {m.a}</b></p>)}</aside>}
  </main><footer>Progress stays in this browser. Nothing is sent to anyone.</footer>
 </div>;
}
