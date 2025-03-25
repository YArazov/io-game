const http = require('http');
const { exec } = require('child_process');

const PORT = 3001; // Webhook server port

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error running command: ${command}\n${stderr}`);
        reject(stderr);
        return;
      }
      console.log(`Command Success: ${command}\n${stdout}`);
      resolve(stdout);
    });
  });
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    console.log('Received GitHub webhook, updating...');

    try {
      await runCommand('cd /var/www/io-game && git pull');

      // Delay restart to ensure all changes are applied
      setTimeout(async () => {
        await runCommand('pm2 restart all');
      }, 5000); // 5-second delay

      res.writeHead(200);
      res.end('Update successful');
    } catch (error) {
      res.writeHead(500);
      res.end('Update failed');
    }
  } else {
    res.writeHead(405);
    res.end('Method Not Allowed');
  }
});

server.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
