import { spawn } from 'child_process';

console.log('🚀 Starting Memorial Story Book Generator Backend...');
console.log('Server will be available at: http://localhost:3001');

const serverProcess = spawn('node', ['./backend/server.js'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

serverProcess.on('close', (code) => {
  console.log(`\nBackend server exited with code ${code}`);
});

serverProcess.on('error', (err) => {
  console.error('Failed to start backend server:', err);
});