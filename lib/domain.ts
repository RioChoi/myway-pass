import { z } from 'zod';

export const profileSchema = z.object({
  version: z.literal(1),
  font: z.enum(['small', 'normal', 'large', 'xlarge']),
  buttons: z.enum(['normal', 'large']),
  contrast: z.boolean(),
  easy: z.boolean(),
  voice: z.boolean(),
  rate: z.number().min(0.5).max(1.5),
  touch: z.boolean(),
}).strict();
export type Profile = z.infer<typeof profileSchema>;
export const defaults: Profile = {version:1,font:'normal',buttons:'normal',contrast:false,easy:false,voice:false,rate:0.85,touch:false};
export const friendlyProfile: Profile = {...defaults,font:'large',buttons:'large',easy:true,touch:true};
export const needs = {
  font: '글씨 크기', buttons: '큰 버튼 사용', contrast: '높은 대비',
  easy: '쉬운 말 안내', voice: '소리로 읽기', touch: '터치 실수 줄이기',
} as const;
export type Need = keyof typeof needs;
export type Sector = 'hospital' | 'cafe';
export type Mode = 'baseline' | 'rules' | 'ai';
export const fontNames:Record<Profile['font'],string>={small:'작게',normal:'기본',large:'크게',xlarge:'아주 크게'};
export const fontScales:Record<Profile['font'],number>={small:.9,normal:1,large:1.22,xlarge:1.5};
export const modeNames = {baseline:'기본 화면',rules:'설정 적용',ai:'AI 화면'};
export {screens,planScreenSchema,planSchema,rulePlan,validatePlan,type Plan} from './workflows.ts';
export {transactionSchema,makeTransaction} from './business.ts';
export {products as menu} from './catalog.ts';
export function encodeProfile(profile:Profile){return 'myway:1:'+btoa(unescape(encodeURIComponent(JSON.stringify(profileSchema.parse(profile)))));}
export function decodeProfile(value:string):Profile {
 if(value.length>1500||!value.startsWith('myway:1:'))throw Error('내 방식 QR이 아닙니다.');
 try{return profileSchema.parse(JSON.parse(decodeURIComponent(escape(atob(value.slice(8))))));}catch{throw Error('QR 설정이 올바르지 않습니다.');}
}
