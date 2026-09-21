import { spawn } from 'node:child_process';

const child = spawn(
  process.execPath,
  ['node_modules/vinext/dist/cli.js', 'dev'],
  { stdio: 'inherit' },
);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill('SIGTERM'));
}
child.on('exit', (code) => {
  process.exitCode = code ?? 0;
});
