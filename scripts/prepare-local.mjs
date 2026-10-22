import {readFileSync,writeFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
const config=parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8'));
const allowed=['OPENAI_API_KEY','TYPESAFE_API_KEY','AI_ENABLED','AI_CALL_LIMIT','OPENAI_MODEL','TYPESAFE_MODEL','MOBILE_ORIGIN'];
writeFileSync(new URL('../.dev.vars',import.meta.url),allowed.filter(k=>config[k]!==undefined).map(k=>`${k}=${JSON.stringify(config[k])}`).join('\n')+'\n');
console.log('로컬 서버 환경 설정 완료. 키 값은 출력하지 않았습니다.');
