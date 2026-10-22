import type {CapacitorConfig} from '@capacitor/cli';
const config:CapacitorConfig={appId:'kr.myway.pass',appName:'내 방식 QR',webDir:'mobile/dist',server:{androidScheme:'https',cleartext:false},android:{allowMixedContent:false},plugins:{SystemBars:{insetsHandling:'css',style:'LIGHT'}}};
export default config;
