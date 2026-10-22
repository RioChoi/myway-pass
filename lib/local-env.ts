// Node-only development adapter. Production builds use cloudflare:workers + D1.
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
mkdirSync('.sites-runtime',{recursive:true});
const sqlite=new DatabaseSync(path.resolve('.sites-runtime/local.sqlite'));
sqlite.exec('CREATE TABLE IF NOT EXISTS _local_migrations(name TEXT PRIMARY KEY)');
for(const name of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort()){
  if(!sqlite.prepare('SELECT name FROM _local_migrations WHERE name=?').get(name)){
    sqlite.exec('BEGIN');try{sqlite.exec(readFileSync(path.join('drizzle',name),'utf8'));sqlite.prepare('INSERT INTO _local_migrations VALUES (?)').run(name);sqlite.exec('COMMIT');}catch(e){sqlite.exec('ROLLBACK');throw e;}
  }
}
class Statement {
  constructor(private sql:string,private values:any[]=[]){ }
  bind(...values:any[]){return new Statement(this.sql,values);}
  async first(){return sqlite.prepare(this.sql).get(...this.values)||null;}
  async run(){const result=sqlite.prepare(this.sql).run(...this.values);return {success:true,meta:{changes:Number(result.changes)}};}
}
export const env={...process.env,DB:{prepare:(sql:string)=>new Statement(sql)}};
