import { spawn } from 'node:child_process';

const node = process.execPath;
const children = [
  spawn(node, ['scripts/db-api.mjs'], { stdio: 'inherit' }),
  spawn(node, ['node_modules/vinext/dist/cli.js', 'dev'], { stdio: 'inherit' }),
];
const stop = () => children.forEach((child) => child.kill('SIGTERM'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop);
for (const child of children) child.on('exit', (code) => { if (code) { stop(); process.exitCode = code; } });
