import {InputError} from './security.ts';
import {z} from 'zod';

export const categories=[{id:'coffee',label:'커피',easy:'커피'},{id:'decaf',label:'디카페인',easy:'카페인 없는 커피'},{id:'latte',label:'라테',easy:'우유 음료'},{id:'ade',label:'에이드',easy:'과일 탄산음료'},{id:'smoothie',label:'스무디·프라페',easy:'갈아 만든 음료'},{id:'tea',label:'티',easy:'차'},{id:'food',label:'디저트·베이커리',easy:'빵과 간식'}] as const;
export type Product={id:string;category:string;name:string;price:number;color:string;kind:'coffee'|'drink'|'food';hot:boolean;image:string};
const rows:[string,string,string,number,string,Product['kind'],boolean,string][]=[
 ['americano','coffee','아메리카노',2000,'#4b2514','coffee',true,'coffee'],['latte','coffee','카페라테',3000,'#b67a46','coffee',true,'latte'],['vanilla','coffee','바닐라라테',3500,'#d6b17f','coffee',true,'latte'],['caramel','coffee','카라멜마키아토',3800,'#bc8144','coffee',true,'latte'],['mocha','coffee','카페모카',3800,'#72503d','coffee',true,'chocolate'],['cappuccino','coffee','카푸치노',3000,'#b19378','coffee',true,'latte'],
 ['decaf-americano','decaf','디카페인 아메리카노',3000,'#4b2514','coffee',true,'coffee'],['decaf-latte','decaf','디카페인 카페라테',4000,'#c39162','coffee',true,'latte'],
 ['chocolate','latte','초콜릿라테',3500,'#6b3b28','drink',true,'chocolate'],['matcha','latte','녹차라테',3500,'#859c42','drink',true,'matcha'],['strawberry','latte','딸기라테',4000,'#df8390','drink',false,'berry'],['sweetpotato','latte','고구마라테',3500,'#d0b777','drink',true,'mango'],
 ['lemon','ade','레몬에이드',3500,'#e4cb43','drink',false,'lemon'],['grapefruit','ade','자몽에이드',3500,'#ee8657','drink',false,'berry'],['bluelemon','ade','블루레몬에이드',3800,'#57b7d7','drink',false,'blue'],['lime','ade','라임모히또',4000,'#9fb454','drink',false,'matcha'],
 ['mango','smoothie','망고스무디',4000,'#f0ba35','drink',false,'mango'],['berry-smoothie','smoothie','딸기스무디',4000,'#d97989','drink',false,'berry'],['yogurt','smoothie','플레인요거트스무디',4000,'#eee9d6','drink',false,'latte'],['cookie','smoothie','쿠키프라페',4500,'#afa197','drink',false,'chocolate'],
 ['tea','tea','캐모마일',2800,'#d4ad53','drink',true,'lemon'],['earlgrey','tea','얼그레이',2800,'#b27b32','drink',true,'coffee'],['peach','tea','복숭아아이스티',3000,'#ac632c','drink',false,'coffee'],['citron','tea','유자차',3300,'#e3be46','drink',true,'lemon'],
 ['croffle','food','플레인 크로플',3000,'#ae6c2c','food',false,'bread'],['sandwich','food','햄치즈 샌드위치',4800,'#d4a85b','food',false,'bread'],['cookie-food','food','초코칩 쿠키',2000,'#ad7445','food',false,'cookie'],['cake','food','치즈케이크',4500,'#ead59e','food',false,'cake'],
];
export const products:Product[]=rows.map(([id,category,name,price,color,kind,hot,image])=>({id,category,name,price,color,kind,hot,image:'/menu/'+image+'.svg'}));
export const lineSchema=z.object({productId:z.string(),quantity:z.number().int().min(1).max(20),temperature:z.enum(['hot','iced','none']),size:z.enum(['regular','large']),shots:z.number().int().min(0).max(3),syrup:z.number().int().min(0).max(2)}).strict();
export type CartLine=z.infer<typeof lineSchema>;
export const paymentMethods=[{id:'card',name:'신용·체크카드',easy:'카드로 결제'},{id:'samsung',name:'삼성페이',easy:'삼성페이'},{id:'naver',name:'네이버페이',easy:'네이버페이'},{id:'kakao',name:'카카오페이',easy:'카카오페이'},{id:'payco',name:'PAYCO',easy:'페이코'},{id:'gift',name:'모바일 상품권',easy:'휴대전화 상품권'}] as const;
export const paymentSchema=z.enum(['card','samsung','naver','kakao','payco','gift']);
export function defaultLine(p:Product):CartLine{return {productId:p.id,quantity:1,temperature:p.kind==='food'?'none':'iced',size:'regular',shots:0,syrup:0};}
export function priceLine(input:unknown){
 const l=lineSchema.parse(input),p=products.find(p=>p.id===l.productId);if(!p)throw new InputError('없는 상품입니다.');
 if(p.kind==='food'&&(l.temperature!=='none'||l.size!=='regular'||l.shots||l.syrup))throw new InputError('이 상품에는 음료 옵션을 적용할 수 없습니다.');
 if(p.kind!=='food'&&(l.temperature==='none'||(l.temperature==='hot'&&!p.hot)))throw new InputError('지원하지 않는 온도입니다.');
 if(p.kind!=='coffee'&&l.shots)throw new InputError('이 상품에는 샷을 추가할 수 없습니다.');
 const optionPrice=(l.size==='large'?700:0)+l.shots*500+l.syrup*300;
 return {...l,name:p.name,basePrice:p.price,optionPrice,unitPrice:p.price+optionPrice,total:(p.price+optionPrice)*l.quantity};
}
export function priceCart(lines:unknown){return z.array(lineSchema).min(1).max(30).parse(lines).map(priceLine);}

export const insurers=[{id:'hanbit',name:'한빛손해보험',contract:'무배당 실손의료비보험',masked:'****-2041'},{id:'saerom',name:'새롬손해보험',contract:'실손의료비 보장보험',masked:'****-7382'}] as const;
export const visits=[{id:'visit-a',date:'2026-10-08',department:'내과',type:'통원',paid:36800,documents:['진료비 영수증','진료비 세부내역서','처방전']},{id:'visit-b',date:'2026-10-15',department:'정형외과',type:'통원',paid:72500,documents:['진료비 영수증','진료비 세부내역서']},{id:'visit-c',date:'2026-10-20',department:'내과',type:'통원',paid:18400,documents:['진료비 영수증','진료비 세부내역서','처방전']}] as const;
export const demoPatient={id:'demo-patient',name:'가상 이용자',birth:'1980.01.01',patientNumber:'TEST-1001'};
