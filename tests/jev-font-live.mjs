// Paid Jev calls. Run explicitly; never part of the default unit suite.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const base=process.env.TEST_BASE||'http://127.0.0.1:4173';
const cases=[
 {text:'작은 글씨로 보고 싶다',font:'small'},
 {text:'글씨 작게',font:'small'},
 {text:'글씨가 너무 커요',font:'small'},
 {text:'글씨 크게',font:'large'},
 {text:'기본 글씨 크기로 돌려줘',font:'normal'},
 {text:'글씨 아주 크게',font:'xlarge'},
 {text:'글씨는 크게 하지 말고 소리로 읽어줘',font:undefined,include:['voice'],exclude:['font']},
 {text:'작은 글씨가 잘 안 보여서 크게 보고 싶어요. 손이 떨려서 자꾸 두 번 눌러요. 소리로 읽는 건 원하지 않아요.',font:'large',include:['font','touch'],exclude:['voice']},
];
const results=[];
for(const c of cases){let data;try{const r=await fetch(base+'/api/recommend',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:c.text,recommendationVersion:2})});data=await r.json();assert.equal(r.status,200);assert.equal(data.source,'jev');assert.equal(data.fontPreference,c.font);if(c.font)assert(data.suggestions.includes('font'));for(const k of c.include||[])assert(data.suggestions.includes(k));for(const k of c.exclude||[])assert(!data.suggestions.includes(k));results.push({text:c.text,expectedFont:c.font||null,passed:true,result:data});}catch(e){results.push({text:c.text,expectedFont:c.font||null,passed:false,error:e.message,result:data});}console.log(JSON.stringify(results.at(-1)));}
writeFileSync(process.env.TEST_OUTPUT||'deliverables/jev-font-after-fix.json',JSON.stringify({base,at:new Date().toISOString(),results},null,2));if(results.some(r=>!r.passed))process.exitCode=1;
