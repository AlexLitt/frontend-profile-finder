const { exec } = require('child_process');
const proxy = exec('lcp --proxyUrl https://real-cats-hide.loca.lt --port 8010');

proxy.stdout.on('data', (data) => {
  console.log(`proxy stdout: ${data}`);
});

proxy.stderr.on('data', (data) => {
  console.error(`proxy stderr: ${data}`);
});

proxy.on('close', (code) => {
  console.log(`proxy process exited with code ${code}`);
});
