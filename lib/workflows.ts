import {z} from 'zod';
import type {Profile,Sector} from './domain';
export type ScreenDefinition={id:string;title:string;easyTitle:string;guide:string;easyGuide:string;actions:Record<string,{normal:string;easy:string}>};
const a=(normal:string,easy=normal)=>({normal,easy});
export const screens:Record<Sector,ScreenDefinition[]>={
 cafe:[
  {id:'menu',title:'메뉴 선택',easyTitle:'드실 메뉴를 골라 주세요',guide:'카테고리와 상품을 선택하여 주문 내역에 추가해 주세요.',easyGuide:'위에서 종류를 고르고, 원하는 메뉴를 눌러 주세요.',actions:{select:a('상품 선택','메뉴 고르기'),checkout:a('결제하기','주문 확인하기'),edit:a('옵션 변경','선택 바꾸기'),remove:a('삭제'),quantity:a('수량 변경','개수 바꾸기'),clear:a('전체 삭제','모두 지우기')}},
  {id:'options',title:'상품 옵션 선택',easyTitle:'어떻게 만들어 드릴까요?',guide:'온도·사이즈 및 추가 옵션을 선택해 주세요.',easyGuide:'차갑게 또는 따뜻하게 고르고, 크기와 추가할 것을 정해 주세요.',actions:{add:a('주문에 담기','담기'),cancel:a('취소')}},
  {id:'service',title:'매장 이용 구분',easyTitle:'어디서 드시나요?',guide:'매장 취식 또는 포장을 선택해 주세요.',easyGuide:'여기서 드시면 매장, 가져가시면 포장을 눌러 주세요.',actions:{here:a('매장 이용','여기서 먹기'),takeout:a('포장','가져가기'),back:a('이전')}},
  {id:'points',title:'멤버십 포인트 적립',easyTitle:'포인트를 모으시겠어요?',guide:'적립 여부를 선택해 주세요. 테스트 회원번호로 적립을 체험할 수 있습니다.',easyGuide:'포인트를 모으려면 적립을 누르세요. 원하지 않으면 건너뛰세요.',actions:{earn:a('포인트 적립','적립하기'),skip:a('적립 안 함','건너뛰기'),back:a('이전')}},
  {id:'payment',title:'결제수단 선택',easyTitle:'어떤 방법으로 결제할까요?',guide:'카드·간편결제·모바일 상품권 중 결제수단을 선택해 주세요.',easyGuide:'사용할 카드나 휴대전화 결제 방법을 눌러 주세요.',actions:{select:a('결제수단 선택','결제 방법 고르기'),back:a('이전')}},
  {id:'authorize',title:'결제 승인 요청',easyTitle:'주문을 확인하고 결제해 주세요',guide:'주문 내역과 최종 결제금액을 확인한 후 승인 요청을 눌러 주세요.',easyGuide:'메뉴와 금액이 맞는지 보고 결제 버튼을 눌러 주세요.',actions:{approve:a('승인 요청','결제하기'),cancel:a('결제 취소','돌아가기'),retry:a('재시도','다시 결제하기')}},
  {id:'done',title:'주문 완료',easyTitle:'주문이 끝났어요',guide:'주문번호를 확인해 주세요.',easyGuide:'이 번호로 부르면 음료를 받아 가세요.',actions:{finish:a('이용 종료','마치기'),receipt:a('확인증 출력','확인증 인쇄')}},
 ],
 hospital:[
  {id:'patient',title:'청구인 확인',easyTitle:'청구할 분을 확인해 주세요',guide:'가상 환자 정보를 확인한 후 본인 청구를 진행해 주세요.',easyGuide:'화면의 가상 이용자로 보험 청구를 시작해 주세요.',actions:{confirm:a('본인 청구 진행','이 정보로 시작')}},
  {id:'insurer',title:'실손보험 계약 선택',easyTitle:'가입한 보험을 골라 주세요',guide:'보험금을 청구할 보험계약을 선택해 주세요.',easyGuide:'병원비를 돌려받을 보험을 눌러 주세요.',actions:{select:a('보험계약 선택','보험 고르기'),back:a('이전')}},
  {id:'visits',title:'진료내역 조회·선택',easyTitle:'청구할 진료를 골라 주세요',guide:'청구할 진료일자와 납부내역을 선택해 주세요. 복수 선택이 가능합니다.',easyGuide:'병원에 온 날짜를 골라 주세요. 여러 날짜를 골라도 됩니다.',actions:{toggle:a('진료내역 선택','날짜 고르기'),next:a('선택 완료','다음'),back:a('이전')}},
  {id:'details',title:'보험금 청구서 작성',easyTitle:'청구 내용을 확인해 주세요',guide:'청구 사유와 수익자·수령계좌 정보를 확인해 주세요.',easyGuide:'아파서 진료받았는지, 다쳐서 진료받았는지 골라 주세요. 계좌는 가상 계좌입니다.',actions:{illness:a('질병','아파서 진료받음'),injury:a('상해','다쳐서 진료받음'),next:a('작성 완료','다음'),back:a('이전')}},
  {id:'documents',title:'청구서류 확인',easyTitle:'함께 보낼 서류를 확인해 주세요',guide:'선택한 진료내역의 전송 대상 서류를 확인해 주세요.',easyGuide:'영수증과 병원비 내역을 함께 보냅니다. 아래 목록을 확인해 주세요.',actions:{next:a('서류 확인 완료','확인했어요'),back:a('이전')}},
  {id:'consent',title:'정보 제공 동의 및 전송 확인',easyTitle:'보험사에 보내도 될까요?',guide:'전송 대상·청구내역·정보 제공 내용을 확인하고 동의해 주세요.',easyGuide:'선택한 보험사에 진료내역과 서류를 보내는 데 동의해 주세요.',actions:{consent:a('정보 제공 동의','보내는 데 동의해요'),submit:a('청구서류 전송','확인하고 보내기'),back:a('이전')}},
  {id:'done',title:'청구서류 전송 완료',easyTitle:'서류 보내기가 끝났어요',guide:'전송 결과를 확인해 주세요. 보험금 심사·지급은 별도 절차입니다.',easyGuide:'서류를 보냈어요. 보험금을 받을 수 있는지와 금액은 보험사가 확인합니다.',actions:{finish:a('이용 종료','마치기'),receipt:a('전송 확인증 출력','확인증 인쇄')}},
 ],
};
export const planScreenSchema=z.object({id:z.string().max(24),template:z.enum(['grid','list','step']),title:z.string().min(1).max(60),guide:z.string().min(1).max(200),actionIds:z.array(z.string().max(24)).max(12),actionLabels:z.record(z.string().min(1).max(35))}).strict();
export const planSchema=z.object({screens:z.array(planScreenSchema).min(1).max(12)}).strict();
export type Plan=z.infer<typeof planSchema>;
export function rulePlan(sector:Sector,p:Profile):Plan{return {screens:screens[sector].map(s=>({id:s.id,template:p.font==='xlarge'||p.buttons==='large'?'list':'grid',title:p.easy?s.easyTitle:s.title,guide:p.easy?s.easyGuide:s.guide,actionIds:Object.keys(s.actions),actionLabels:Object.fromEntries(Object.entries(s.actions).map(([id,v])=>[id,p.easy?v.easy:v.normal]))}))};}
export function validatePlan(input:unknown,sector:Sector):Plan{
 const plan=planSchema.parse(input),original=screens[sector];if(plan.screens.length!==original.length)throw Error('화면 수가 다릅니다.');
 plan.screens.forEach((s,i)=>{const o=original[i],ids=Object.keys(o.actions);if(s.id!==o.id||s.actionIds.length!==ids.length||new Set(s.actionIds).size!==ids.length||ids.some(id=>!s.actionIds.includes(id))||Object.keys(s.actionLabels).length!==ids.length||ids.some(id=>!s.actionLabels[id]))throw Error('필수 화면 또는 동작이 변경되었습니다.');
 for(const id of ids)if(![o.actions[id].normal,o.actions[id].easy].includes(s.actionLabels[id]))throw Error('버튼 의미가 변경되었습니다.');
 const text=[s.title,s.guide,...Object.values(s.actionLabels)].join(' ');if(/[0-9₩$]|https?:|주민등록|진단명|비밀번호|자동.{0,8}(주문|결제|청구)|지급.{0,5}(확정|완료)|실제.{0,5}전송/.test(text))throw Error('허용되지 않은 안내입니다.');});return plan;
}
