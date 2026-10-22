import {readFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {parseEnv} from 'node:util';
import path from 'node:path';
const cfg=existsSync('.env.local')?parseEnv(readFileSync('.env.local','utf8')):{},keys=[cfg.OPENAI_API_KEY,cfg.TYPESAFE_API_KEY].filter(Boolean);
let checked=0,leaks=0;
function walk(dir){if(!existsSync(dir))return;for(const n of readdirSync(dir)){const p=path.join(dir,n);if(statSync(p).isDirectory())walk(p);else{checked++;const bytes=readFileSync(p);if(keys.some(k=>bytes.includes(Buffer.from(k)))||/\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{24,}|ghp_[A-Za-z0-9]{30,}|npm_[A-Za-z0-9]{32,})/.test(bytes.toString('utf8')))leaks++;}}}
for(const d of ['app','components','lib','public','dist','mobile/dist'])walk(d);
console.log(JSON.stringify({checkedFiles:checked,knownSecretComparisonAvailable:keys.length>0,secretOccurrences:leaks}));if(leaks)process.exitCode=1;
