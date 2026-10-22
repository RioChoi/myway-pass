import path from 'node:path';
process.env.PATH=path.dirname(process.execPath)+path.delimiter+process.env.PATH;
process.env.MYWAY_NODE_PREVIEW='1';
process.argv=[process.execPath,process.argv[1],'dev','--port','4173','--host','127.0.0.1',...process.argv.slice(2)];
await import('./run-framework.mjs');
