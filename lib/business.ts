import {InputError} from './security.ts';
import {z} from 'zod';
import {priceCart,paymentSchema,insurers,visits} from './catalog.ts';
export const cafeTransaction=z.object({sector:z.literal('cafe'),lines:z.array(z.unknown()).min(1).max(30),service:z.enum(['here','takeout']),points:z.enum(['skip','earn']),paymentMethod:paymentSchema,paymentStatus:z.literal('simulated_approved')}).strict();
export const claimTransaction=z.object({sector:z.literal('hospital'),patientId:z.literal('demo-patient'),insurerId:z.enum(['hanbit','saerom']),visitIds:z.array(z.enum(['visit-a','visit-b','visit-c'])).min(1).max(3),reason:z.enum(['illness','injury']),documentsConfirmed:z.literal(true),consent:z.literal(true)}).strict();
export const transactionSchema=z.discriminatedUnion('sector',[cafeTransaction,claimTransaction]);
export function makeTransaction(input:unknown,id:string){
 const t=transactionSchema.parse(input),common={schema:'myway.handoff.v2',id,simulation:true,createdAt:new Date().toISOString()};
 if(t.sector==='cafe'){
  const items=priceCart(t.lines),total=items.reduce((sum,l)=>sum+l.total,0);
  return {...common,type:'order' as const,items,service:t.service,total,currency:'KRW',loyalty:{requested:t.points==='earn',earned:t.points==='earn'?Math.floor(total/100):0},payment:{method:t.paymentMethod,status:'simulated_approved',charged:false}};
 }
 if(new Set(t.visitIds).size!==t.visitIds.length)throw new InputError('같은 진료가 중복 선택되었습니다.');
 const selected=visits.filter(v=>t.visitIds.includes(v.id));
 return {...common,type:'insurance_claim' as const,hospital:'한결병원',patientRef:t.patientId,insurer:insurers.find(i=>i.id===t.insurerId),visits:selected,reason:t.reason,medicalExpenseTotal:selected.reduce((sum,v)=>sum+v.paid,0),consent:true,documentsConfirmed:true,transferStatus:'simulated_sent',actualTransmission:false,payoutStatus:'not_determined'};
}
