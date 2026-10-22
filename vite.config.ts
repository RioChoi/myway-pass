import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { sites } from "./build/sites-vite-plugin";
import { connectorPreview } from "./build/connector-preview-plugin.mjs";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const managedLinux = readExecutionProfile() === "managed-linux";
// Vite's default env deny list does not include Wrangler .dev.vars files.
const privateFiles = ['**/.env*','**/.dev.vars*','**/.git/**','**/.sites-runtime/**','**/.tools/**','**/*.{key,jks,keystore,p12,pfx,sqlite,sqlite3,db}'];
const privateFileGuard = () => ({
  name: 'myway-private-files', enforce: 'pre' as const,
  configureServer(server:import('vite').ViteDevServer) {
    server.middlewares.use((req,res,next)=>{
      let pathname:string;try{pathname=decodeURIComponent((req.url||'/').split('?')[0]).replaceAll('\\','/');}catch{res.statusCode=400;res.end();return;}
      if(pathname.split('/').some(p=>/^\.(env|dev\.vars)(\.|$)/i.test(p)||['.git','.sites-runtime','.tools'].includes(p.toLowerCase()))||/\.(key|jks|keystore|p12|pfx|sqlite3?|db)$/i.test(pathname)){res.statusCode=404;res.end();return;}next();
    });
  },
});

const localBindingConfig = {
  main: "./build/sites-worker.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async ({ command }) => {
  if (process.env.MYWAY_NODE_PREVIEW === '1') {
    Object.assign(process.env, loadEnv('development', process.cwd(), ''));
    return {
      server: {host:'127.0.0.1',port:4173,fs:{deny:privateFiles},watch:{ignored:['**/.sites-runtime/**','**/.tools/**','**/android/**','**/mobile/dist/**','**/deliverables/**']}},
      resolve: {alias:{'cloudflare:workers':new URL('./lib/local-env.ts',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')}},
      plugins:[privateFileGuard(),vinext(),sites({mockAuth:true})],
    };
  }
  // Use Miniflare's local Request.cf placeholder unless fetching is requested.
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      fs: {deny:privateFiles},
      ...(managedLinux
        ? { host: "0.0.0.0", allowedHosts: ["terminal.local"] }
        : {}),
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      privateFileGuard(),
      vinext(),
      sites({ mockAuth: command === 'serve' && !managedLinux }),
      connectorPreview(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          ...localBindingConfig,
          ...(command === "serve"
            ? {
                services: [
                  {
                    binding: "CONNECTORS",
                    service: "sites-connector-preview",
                    entrypoint: "ConnectorPreview",
                  },
                ],
              }
            : {}),
        },
        ...(command === "serve"
          ? {
              auxiliaryWorkers: [
                {
                  config: {
                    name: "sites-connector-preview",
                    main: "./build/connector-preview-worker.mjs",
                    compatibility_date: "2026-05-15",
                  },
                },
              ],
            }
          : {}),
      }),
    ],
  };
});
