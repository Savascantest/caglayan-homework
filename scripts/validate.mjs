import{readFile}from'node:fs/promises';

const index=JSON.parse(await readFile('public/homeworks/index.json','utf8'));
if(index.length<2)throw Error('Expected current and historical dated packages');
if(index[0].id!=='2026-09-02-61B62FCA')throw Error('Latest lesson must open first');

const packages=[];
for(const entry of index){
 const lesson=JSON.parse(await readFile(`public/homeworks/${entry.id}/homework.json`,'utf8'));
 if(lesson.id!==entry.id)throw Error(`Folder/id mismatch: ${entry.id}`);
 if(!lesson.id.startsWith(`${lesson.date}-${lesson.meetingUuid.slice(0,8)}`))throw Error(`Non-idempotent lesson key: ${lesson.id}`);
 if(lesson.student!=='Güner')throw Error(`Learner identity mismatch: ${lesson.id}`);
 if(!lesson.teacherNote?.detected||!lesson.teacherNote?.applied)throw Error(`Teacher note missing: ${lesson.id}`);
 const learnerContent=JSON.stringify(lesson.sections).toLocaleLowerCase('tr');
 if(/caglayan|çağlayan/.test(learnerContent))throw Error(`Real-name reference in learner content: ${lesson.id}`);
 packages.push(lesson);
}

const keys=packages.map(x=>`${x.date}|${x.meetingUuid}`);
if(new Set(keys).size!==keys.length)throw Error('Duplicate lesson date + meeting UUID');

const current=packages.find(x=>x.meetingUuid==='61B62FCA-36AC-41EA-A3CD-7BF332861086');
if(!current)throw Error('Assigned meeting package missing');
const byId=Object.fromEntries(current.sections.map(x=>[x.id,x]));
for(const id of['notes','grammar','vocabulary','conversation','reading','listening','quiz'])if(!byId[id])throw Error(`Missing ${id}`);
if(byId.practice)throw Error('Practice tab must be removed from current lesson');
if(byId.grammar.questions?.length!==10)throw Error('Expected 10 grammar questions');
if(byId.vocabulary.flashcards?.length!==10||byId.vocabulary.questions?.length!==10)throw Error('Expected 10 bilingual flashcards and 10 vocabulary questions');
for(const card of byId.vocabulary.flashcards)for(const side of['front','back'])for(const field of['word','definition','example'])if(!card[side]?.[field])throw Error(`Incomplete ${side} of vocabulary card`);
if(byId.conversation.scenarios?.length!==3)throw Error('Expected three Daily Use situations');
for(const scenario of byId.conversation.scenarios)if(scenario.turns?.length<5||scenario.turns.some(t=>!t.options?.length||t.options.some(o=>!o.text||!o.response)))throw Error(`Incomplete branching conversation: ${scenario.title}`);
if(byId.reading.readings?.length!==1||byId.reading.readings[0].questions?.length<5)throw Error('Expected one same-level reading with questions');
if(!byId.listening.external?.url||byId.listening.questions?.length<5)throw Error('Updated listening is incomplete');
if(byId.quiz.questions?.length!==15)throw Error('Expected 15 final-quiz questions');
const counts=byId.quiz.questions.reduce((all,q)=>(all[q.category]=(all[q.category]||0)+1,all),{});
for(const [category,count] of Object.entries({grammar:5,vocabulary:5,conversation:3,notes:2}))if(counts[category]!==count)throw Error(`Final quiz needs ${count} ${category} questions`);

console.log(`Validated ${packages.length} dated packages: history, identity, idempotency, interactions and the 5/5/3/2 final quiz.`);
