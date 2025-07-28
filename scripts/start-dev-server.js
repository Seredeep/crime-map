const { spawn } = require('child_process');
const { getLocalIPWithPort } = require('./get-local-ip');

function startDevServer(port = 3000) {
  const localIP = getLocalIPWithPort(port);

  console.log('🚀 Iniciando servidor de desarrollo para Capacitor...');
  console.log(`📱 URL local: ${localIP}`);
  console.log(`🌐 URL externa: http://0.0.0.0:${port}`);
  console.log('');

  // Configurar variables de entorno para desarrollo
  const env = {
    ...process.env,
    CAPACITOR_BUILD: 'true',
    HOSTNAME: '0.0.0.0',
    PORT: port.toString()
  };

  // Iniciar Next.js con configuración para desarrollo móvil
  const child = spawn('npm', ['run', 'dev', '--', '--port', port, '--hostname', '0.0.0.0'], {
    stdio: 'inherit',
    env,
    shell: true
  });

  child.on('error', (error) => {
    console.error('❌ Error iniciando servidor:', error.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Servidor terminado con código: ${code}`);
      process.exit(code);
    }
  });

  // Manejar señales de terminación
  process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo servidor...');
    child.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Deteniendo servidor...');
    child.kill('SIGTERM');
  });
}

// Si se ejecuta directamente
if (require.main === module) {
  const port = parseInt(process.argv[2]) || 3000;
  startDevServer(port);
}

module.exports = { startDevServer };
