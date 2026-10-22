import { env } from 'cloudflare:workers';
import {InputError} from './security';

export function db():D1Database { const d=(env as unknown as {DB?:D1Database}).DB;if(!d)throw new Error('저장소가 준비되지 않았습니다.');return d; }
export async function put(key:string,value:unknown,ttl:number){await db().prepare('INSERT INTO records (key,value,expires) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,expires=excluded.expires').bind(key,JSON.stringify(value),Date.now()+ttl).run();}
export async function get<T>(key:string):Promise<T|null>{const r=await db().prepare('SELECT value FROM records WHERE key=? AND expires>?').bind(key,Date.now()).first<{value:string}>();return r?JSON.parse(r.value):null;}
export async function consume<T>(key:string):Promise<T|null>{const r=await db().prepare('DELETE FROM records WHERE key=? AND expires>? RETURNING value').bind(key,Date.now()).first<{value:string}>();return r?JSON.parse(r.value):null;}
export async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');}
export async function limit(key:string,max:number,ttl:number){
  // Atomic increment also bounds concurrent requests across Worker isolates.
  const now=Date.now();
  const r=await db().prepare("INSERT INTO records (key,value,expires) VALUES (?,'1',?) ON CONFLICT(key) DO UPDATE SET value=CASE WHEN records.expires<=? THEN '1' ELSE CAST(CAST(records.value AS INTEGER)+1 AS TEXT) END,expires=CASE WHEN records.expires<=? THEN excluded.expires ELSE records.expires END RETURNING value").bind(key,now+ttl,now,now).first<{value:string}>();
  if(Number(r?.value)>max)throw new InputError('요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',429);
}
export async function clean(){await db().prepare('DELETE FROM records WHERE expires<?').bind(Date.now()).run();}
