const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Excalidraw with Project Workspace Management...\n');

// Start the workspace API server
const apiServer = spawn('node', ['workspaces.js'], {
  cwd: path.join(__dirname, 'excalidraw-app', 'api'),
  stdio: 'inherit',
  shell: true
});

apiServer.on('error', (error) => {
  console.error('Failed to start API server:', error);
});

apiServer.on('close', (code) => {
  console.log(`API server exited with code ${code}`);
});

// Start the main Excalidraw application
const mainApp = spawn('yarn', ['start'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

mainApp.on('error', (error) => {
  console.error('Failed to start main application:', error);
});

mainApp.on('close', (code) => {
  console.log(`Main application exited with code ${code}`);
  // Kill the API server when main app closes
  apiServer.kill();
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  apiServer.kill();
  mainApp.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  apiServer.kill();
  mainApp.kill();
  process.exit(0);
});
