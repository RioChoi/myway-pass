import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({root:'mobile',base:'./',plugins:[react()],resolve:{alias:{'@':path.resolve('.')}},build:{outDir:'dist',emptyOutDir:true},server:{port:5174}});
