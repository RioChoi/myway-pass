import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const base=process.env.TEST_BASE||'http://127.0.0.1:4173';
const profile={version:1,font:'small',buttons:'normal',contrast:true,easy:false,voice:true,rate:.7,touch:false};
const post=async(action,body,token)=>{const r=await fetch(base+'/api/'+action,{method:'POST',headers:{'content-type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;};
const code=await post('link',{profile});
const checks=[];
for(const sector of ['cafe','hospital']){const s=await post('session',{sector,mode:'rules',...(sector==='cafe'?{code:code.code}:{profile}),device:{width:800,height:1280}});assert.deepEqual(s.profile,profile);await post('end',{},s.token);checks.push({sector,font:s.profile.font,passed:true});}
writeFileSync(process.env.TEST_OUTPUT||'deliverables/font-transfer.json',JSON.stringify({base,checks},null,2));console.log(checks);
