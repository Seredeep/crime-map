#!/usr/bin/env node

const { spawn } = require('child_process');
const { existsSync } = require('fs');

console.log('🚀 Iniciando Crime Map...\n');

// Verificar que los archivos necesarios existen
const requiredFiles = [
  'server.js',
  'package.json',
  'next.config.mjs'
];

const missingFiles = requiredFiles.filter(file => !existsSync(file));
if (missingFiles.length > 0) {
  console.error('❌ Archivos faltantes:', missingFiles.join(', '));
  process.exit(1);
}

// Función para ejecutar comando
function runCommand(command, args, name) {
  return new Promise((resolve, reject) => {
    console.log(`⚡ Iniciando ${name}...`);

    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('error', (error) => {
      console.error(`❌ Error ejecutando ${name}:`, error.message);
      reject(error);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ ${name} terminó exitosamente`);
        resolve(code);
      } else {
        console.error(`❌ ${name} terminó con código ${code}`);
        reject(new Error(`${name} failed with code ${code}`));
      }
    });

    // Manejar Ctrl+C
    process.on('SIGINT', () => {
      console.log(`\n🛑 Deteniendo ${name}...`);
      child.kill('SIGINT');
      process.exit(0);
    });
  });
}

// Intentar servidor con WebSockets primero
async function startWithWebSockets() {
  try {
    console.log('🔌 Intentando iniciar con WebSockets...\n');
    await runCommand('node', ['server.js'], 'Servidor con WebSockets');
  } catch (error) {
    console.log('\n⚠️ El servidor con WebSockets falló');
    console.log('🔄 Cambiando a servidor estándar de Next.js...\n');

    try {
      await runCommand('npx', ['next', 'dev'], 'Next.js estándar');
    } catch (nextError) {
      console.error('\n❌ Ambos servidores fallaron');
      console.log('\n💡 Soluciones posibles:');
      console.log('1. Verificar que MongoDB esté corriendo');
      console.log('2. Verificar variables de entorno en .env.local');
      console.log('3. Ejecutar: npm install');
      console.log('4. Verificar que el puerto 3000 esté libre');
      process.exit(1);
    }
  }
}

// Verificar dependencias
console.log('📦 Verificando dependencias...');
try {
  require('socket.io');
  require('next');
  require('mongodb');
  console.log('✅ Dependencias verificadas\n');
} catch (depError) {
  console.error('❌ Dependencia faltante:', depError.message);
  console.log('💡 Ejecuta: npm install\n');
  process.exit(1);
}

// Iniciar servidor
startWithWebSockets().catch((error) => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
