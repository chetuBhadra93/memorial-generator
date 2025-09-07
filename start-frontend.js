import { spawn } from 'child_process';
import * as path from 'path';

console.log('🌟 Starting Memorial Story Book Generator Frontend...');
console.log('React app will be available at: http://localhost:3000');

const frontendPath = path.join(process.cwd(), 'frontend', 'memorial-generator');

const frontendProcess = spawn('npm', ['start'], {
  stdio: 'inherit',
  cwd: frontendPath,
  shell: true
});

frontendProcess.on('close', (code) => {
  console.log(`\nFrontend app exited with code ${code}`);
});

frontendProcess.on('error', (err) => {
  console.error('Failed to start frontend app:', err);
});