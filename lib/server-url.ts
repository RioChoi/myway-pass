export function normalizeServerAddress(input:string,allowLocalHttp=false){
 if(input.length>200)throw Error('서버 주소가 너무 깁니다.');
 const value=input.trim();if(!value)return '';
 let u:URL;try{u=new URL(value);}catch{throw Error('올바른 HTTPS 서버 주소를 입력해 주세요.');}
 const local=u.hostname==='localhost'||u.hostname==='127.0.0.1'||u.hostname==='[::1]'||/^192\.168\.\d{1,3}\.\d{1,3}$/.test(u.hostname)||/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(u.hostname)||/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(u.hostname);
 if(u.protocol!=='https:'&&!(allowLocalHttp&&u.protocol==='http:'&&local))throw Error('HTTPS 서버 주소를 사용해 주세요.');
 if(u.username||u.password||u.search||u.hash||(u.pathname!=='/'&&u.pathname!==''))throw Error('계정·비밀번호·경로가 없는 서버 주소만 입력해 주세요.');
 return u.origin;
}
