import {z} from 'zod';
import {defaults,profileSchema,type Profile,type Sector} from '@/lib/domain';
import {rulePlan} from '@/lib/workflows';
import {makeTransaction} from '@/lib/business';
import {readiness,recommend,generatePlan} from '@/lib/ai';
import {get,put,consume,hash,limit,clean,db} from '@/lib/store';
import {env} from 'cloudflare:workers';
import {InputError,readJsonObject,readSessionToken} from '@/lib/security';

const minute=60000;
const allowed=(origin:string,url:URL)=>origin===url.origin||['http://localhost','https://localhost','capacitor://localhost'].includes(origin)||(env as unknown as Record<string,string>).MOBILE_ORIGIN===origin;
function response(data:unknown,status:number,origin:string|null){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':origin||'null','Vary':'Origin','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'POST, GET, OPTIONS'}});}
export async function OPTIONS(req:Request){const o=req.headers.get('origin');return response({},o&&allowed(o,new URL(req.url))?200:403,o);}
export async function GET(req:Request){const o=req.headers.get('origin');if(o&&!allowed(o,new URL(req.url)))return response({error:'허용되지 않은 출처'},403,null);if(new URL(req.url).pathname!=='/api/status')return response({error:'없는 기능입니다.'},404,o);const {openai,jev,enabled}=readiness();return response({service:'내 방식 QR',providers:{openai,jev,enabled}},200,o);}
type Session={profile:Profile;sector:Sector;created:number};
export async function POST(req:Request){
  const url=new URL(req.url),origin=req.headers.get('origin');
  if(origin&&!allowed(origin,url))return response({error:'허용되지 않은 출처'},403,null);
  try{
    const body=await readJsonObject(req);
    const ip=req.headers.get('cf-connecting-ip')||'local';
    await limit('request:'+await hash(ip),90,minute);
    const action=url.pathname.split('/').at(-1);
    if(action==='recommend'){
      await limit('recommend:'+await hash(ip),10,minute);
      const text=z.string().trim().min(2).max(600).parse(body.text);
      const version=z.union([z.literal(1),z.literal(2)]).default(1).parse(body.recommendationVersion);
      return response(await recommend(text,version),200,origin);
    }
    if(action==='link'){
      await limit('link:'+await hash(ip),10,minute);await clean();
      const p=profileSchema.parse(body.profile);
      // Insert-only avoids overwriting an existing active code on a random collision.
      for(let i=0;i<8;i++){
        const code=String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000);
        const r=await db().prepare('INSERT OR IGNORE INTO records (key,value,expires) VALUES (?,?,?)').bind('code:'+await hash(code),JSON.stringify(p),Date.now()+3*minute).run();
        if(r.meta.changes)return response({code,expiresAt:Date.now()+3*minute},200,origin);
      }
      throw new InputError('연결번호를 만들지 못했습니다. 다시 시도해 주세요.');
    }
    if(action==='session'){
      const sector=z.enum(['hospital','cafe']).parse(body.sector),mode=z.enum(['baseline','rules','ai']).parse(body.mode);
      let p:Profile;
      if(Object.hasOwn(body,'code')){
        await limit('code-attempt:'+await hash(ip),5,minute);
        const code=z.string().regex(/^\d{6}$/).parse(body.code);
        const stored=await consume<Profile>('code:'+await hash(code));
        if(!stored)throw new InputError('연결번호가 없거나 만료·사용되었습니다. 앱에서 새로 만들어 주세요.');
        p=profileSchema.parse(stored);
      }else p=profileSchema.parse(body.profile);
      if(mode==='ai')await limit('session-ai:'+await hash(ip),5,minute);
      const effective=mode==='baseline'?defaults:p;
      const device=z.object({width:z.number().min(240).max(8000),height:z.number().min(240).max(8000)}).parse(body.device);
      const token=crypto.randomUUID();
      const config=mode==='ai'?await generatePlan(sector,effective,device):{plan:rulePlan(sector,effective),source:mode,reason:'검수된 화면 구성',latencyMs:0};
      await put('session:'+await hash(token),{profile:effective,sector,created:Date.now()},15*minute);
      return response({token,profile:effective,...config},200,origin);
    }
    const token=readSessionToken(req);const sessionKey='session:'+await hash(token);
    const s=await get<Session>(sessionKey);if(!s)throw new InputError('이용 시간이 끝났습니다. 다시 연결해 주세요.');
    if(action==='complete'||action==='payment'){
      if(body.transaction?.sector!==s.sector)throw new InputError('업무가 일치하지 않습니다.');
      if(s.sector==='cafe'&&action!=='payment')throw new InputError('결제 확인이 필요합니다.');
      if(s.sector==='hospital'&&action!=='complete')throw new InputError('보험 청구 업무입니다.');
      if(action==='payment')z.enum(['approved','declined']).default('approved').parse(body.simulationResult);
      const resultKey='result:'+await hash(token);
      const existing=await get<unknown>(resultKey);if(existing)return response(existing,200,origin);
      const receipt=makeTransaction(s.sector==='cafe'?{...body.transaction,paymentStatus:'simulated_approved'}:body.transaction,crypto.randomUUID());
      if(action==='payment'&&body.simulationResult==='declined')return response({status:'declined',message:'가상 결제가 승인되지 않았습니다. 결제수단을 바꾸거나 다시 시도해 주세요.'},200,origin);
      // Atomic insert preserves one business id; the bearer token is never exported.
      await db().prepare('INSERT OR IGNORE INTO records (key,value,expires) VALUES (?,?,?)').bind(resultKey,JSON.stringify(receipt),Date.now()+15*minute).run();
      return response(await get(resultKey),200,origin);
    }
    if(action==='end'){
      await consume(sessionKey);await consume('result:'+await hash(token));return response({ended:true},200,origin);
    }
    return response({error:'없는 기능입니다.'},404,origin);
  }catch(e){const message=e instanceof z.ZodError?'입력 형식을 확인해 주세요.':e instanceof InputError?e.message:'요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';return response({error:message},e instanceof z.ZodError?400:e instanceof InputError?e.status:500,origin);}
}
