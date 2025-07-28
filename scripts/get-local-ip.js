const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Ignorar interfaces no IPv4 y loopback
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }

  return 'localhost';
}

function getLocalIPWithPort(port = 3000) {
  const ip = getLocalIP();
  return `http://${ip}:${port}`;
}

// Si se ejecuta directamente
if (require.main === module) {
  const port = process.argv[2] || 3000;
  console.log(getLocalIPWithPort(port));
}

module.exports = { getLocalIP, getLocalIPWithPort };
