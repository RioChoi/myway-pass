export class InputError extends Error {
 status:number;
 constructor(message:string,status=400){super(message);this.name='InputError';this.status=status;}
}
export async function readJsonObject(req:Request,maxBytes=8000):Promise<Record<string,any>>{
 if(req.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new InputError('JSON 형식으로 요청해 주세요.',415);
 const declared=req.headers.get('content-length');
 if(declared&&(!/^\d+$/.test(declared)||Number(declared)>maxBytes))throw new InputError('입력이 너무 깁니다.',413);
 if(!req.body)throw new InputError('입력 내용을 확인해 주세요.');
 const reader=req.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new InputError('입력이 너무 깁니다.',413);}chunks.push(value);}}finally{reader.releaseLock();}
 if(!size)throw new InputError('입력 내용을 확인해 주세요.');
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 let value:unknown;
 try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new InputError('입력을 읽지 못했습니다.');}
 if(!value||typeof value!=='object'||Array.isArray(value))throw new InputError('입력 형식을 확인해 주세요.');
 function check(v:unknown,depth=0){if(depth>40)throw new InputError('입력 구조가 너무 복잡합니다.');if(v&&typeof v==='object')for(const [key,child] of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(key))throw new InputError('허용되지 않은 입력입니다.');check(child,depth+1);}}
 check(value);return value as Record<string,any>;
}
export function readSessionToken(req:Request){const header=req.headers.get('authorization')||'';const match=/^Bearer ([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.exec(header);if(!match)throw new InputError('이용 세션을 다시 연결해 주세요.');return match[1];}
