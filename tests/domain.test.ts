import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,friendlyProfile,encodeProfile,decodeProfile,profileSchema,rulePlan,validatePlan,makeTransaction} from '../lib/domain.ts';
test('기능만 담은 QR을 반복해서 읽을 수 있다',()=>{const qr=encodeProfile(friendlyProfile);assert.deepEqual(decodeProfile(qr),friendlyProfile);assert.deepEqual(decodeProfile(qr),friendlyProfile);});
test('개인정보와 지원하지 않는 설정을 프로필에서 거부한다',()=>{assert.throws(()=>profileSchema.parse({...defaults,name:'가상 이름'}));assert.throws(()=>profileSchema.parse({...defaults,rate:9}));assert.throws(()=>decodeProfile('https://example.com'));assert.throws(()=>decodeProfile('myway:1:INVALID'));});
test('화면 동작 삭제·복제·신규 실행과 잘못된 안내를 거부한다',()=>{
  const valid=rulePlan('cafe',friendlyProfile);assert.deepEqual(validatePlan(valid,'cafe'),valid);
  for(const mutate of [(p:any)=>p.screens[0].actionIds.pop(),(p:any)=>p.screens[0].actionIds.push('pay'),(p:any)=>p.screens[0].actionIds[0]='checkout',(p:any)=>p.screens[1].guide='자동으로 결제 완료',(p:any)=>p.screens[0].title='무료 0원 주문']){const p=structuredClone(valid);mutate(p);assert.throws(()=>validatePlan(p,'cafe'));}
});
test('주문 금액은 서버 카탈로그에서 생성하고 전달된 가격은 거부한다',()=>{
  const line={productId:'latte',quantity:1,temperature:'iced',size:'regular',shots:0,syrup:0};
  const t={sector:'cafe',lines:[line],service:'here',points:'skip',paymentMethod:'card',paymentStatus:'simulated_approved'};
  const result=makeTransaction(t,'test-order');assert.equal('total' in result&&result.total,3000);assert.equal(result.simulation,true);assert.throws(()=>makeTransaction({...t,total:1},'test'));assert.throws(()=>makeTransaction({...t,lines:[{...line,productId:'injected'}]},'test'));
});
test('실손 청구는 가상 환자·확인된 서류·동의만 수락한다',()=>{const t={sector:'hospital',patientId:'demo-patient',insurerId:'hanbit',visitIds:['visit-a'],reason:'illness',documentsConfirmed:true,consent:true};assert.equal(makeTransaction(t,'test').type,'insurance_claim');assert.throws(()=>makeTransaction({...t,consent:false},'test'));assert.throws(()=>makeTransaction({...t,patientId:'real-patient'},'test'));});
