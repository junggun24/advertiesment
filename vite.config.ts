import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig, loadEnv } from 'vite';

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

export default defineConfig(async ({ command, mode }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  const localSecrets = command === 'serve' ? loadEnv(mode, '.', '') : {};
  const localVars: Record<string, string> =
    command === 'serve'
      ? {
          ADMIN_LOGIN_ID: localSecrets.ADMIN_LOGIN_ID,
          ADMIN_LOGIN_PASSWORD: localSecrets.ADMIN_LOGIN_PASSWORD,
          ADMIN_SESSION_SECRET: localSecrets.ADMIN_SESSION_SECRET,
        }
      : {};

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: {
      // Listen on the LAN interface so the site is reachable through the
      // router's port-forwarding rule, not only from this Mac.
      host: '0.0.0.0',
      // Allow requests forwarded from the configured public DDNS hostname.
      allowedHosts: ['domob.ddns.net'],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        configPath: './wrangler.jsonc',
        config: { vars: localVars },
        persistState: { path: '.wrangler/state' },
      }),
    ],
  };
});
