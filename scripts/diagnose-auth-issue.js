// scripts/diagnose-auth-issue.js
require('dotenv').config({ path: '../.env.local' });
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');
const { promisify } = require('util');

const pbkdf2 = promisify(crypto.pbkdf2);

const MONGO_URI = process.env.MONGODB_URI;

/**
 * Función para verificar contraseña (réplica de la función en el código)
 */
async function verifyPassword(password, hashed) {
  try {
    const [algo, iterations, salt, key, digest] = hashed.split('$');
    if (algo !== 'pbkdf2') return false;
    const derivedKey = await pbkdf2(password, salt, parseInt(iterations, 10), key.length / 2, digest);
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
  } catch (error) {
    console.error('Error verificando contraseña:', error);
    return false;
  }
}

/**
 * Función para hash de contraseña (réplica de la función en el código)
 */
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 310000;
  const keylen = 32;
  const digest = 'sha256';
  const derivedKey = await pbkdf2(password, salt, iterations, keylen, digest);
  return [
    'pbkdf2',
    iterations,
    salt,
    derivedKey.toString('hex'),
    digest
  ].join('$');
}

async function diagnoseAuthIssue(email, password) {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN');
    console.log('================================');
    console.log(`Email: ${email}`);
    console.log(`Contraseña proporcionada: ${password ? 'Sí' : 'No'}`);
    console.log('');

    // 1. Verificar conexión a MongoDB
    console.log('1️⃣ Verificando conexión a MongoDB...');
    await client.connect();
    console.log('✅ Conexión a MongoDB exitosa');
    console.log('');

    const db = client.db();

    // 2. Buscar el usuario
    console.log('2️⃣ Buscando usuario en la base de datos...');
    const user = await db.collection('users').findOne({ email: email });

    if (!user) {
      console.log('❌ USUARIO NO ENCONTRADO');
      console.log('   Posibles causas:');
      console.log('   - Email incorrecto');
      console.log('   - Usuario no registrado');
      console.log('   - Problema con la base de datos');
      return;
    }

    console.log('✅ Usuario encontrado');
    console.log(`   ID: ${user._id}`);
    console.log(`   Nombre: ${user.name || 'No especificado'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role || 'default'}`);
    console.log(`   Enabled: ${user.enabled}`);
    console.log(`   Onboarded: ${user.onboarded}`);
    console.log(`   isOnboarded: ${user.isOnboarded}`);
    console.log(`   Proveedor: ${user.provider || 'credentials'}`);
    console.log(`   Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleString('es-ES') : 'No especificado'}`);
    console.log('');

    // 3. Verificar estado del usuario
    console.log('3️⃣ Verificando estado del usuario...');
    if (user.enabled === false) {
      console.log('❌ PROBLEMA: Usuario deshabilitado');
      console.log('   Solución: Ejecutar node authorize-user.js --email ' + email);
    } else if (user.enabled === undefined) {
      console.log('❌ PROBLEMA: Campo enabled no definido');
      console.log('   Solución: Actualizar usuario en la base de datos');
    } else {
      console.log('✅ Usuario habilitado');
    }
    console.log('');

    // 4. Verificar contraseña (si se proporcionó)
    if (password && user.password) {
      console.log('4️⃣ Verificando contraseña...');
      const isPasswordValid = await verifyPassword(password, user.password);

      if (isPasswordValid) {
        console.log('✅ Contraseña válida');
      } else {
        console.log('❌ PROBLEMA: Contraseña incorrecta');
        console.log('   Posibles causas:');
        console.log('   - Contraseña mal escrita');
        console.log('   - Problema con el hash de la contraseña');
        console.log('   - Formato de hash incorrecto');
      }
      console.log('');
    } else if (!user.password) {
      console.log('4️⃣ Verificando contraseña...');
      console.log('❌ PROBLEMA: Usuario no tiene contraseña');
      console.log('   Posible causa: Usuario registrado con Google OAuth');
      console.log('');
    }

    // 5. Verificar formato del hash de contraseña
    if (user.password) {
      console.log('5️⃣ Verificando formato del hash de contraseña...');
      const hashParts = user.password.split('$');
      if (hashParts.length === 5 && hashParts[0] === 'pbkdf2') {
        console.log('✅ Formato de hash correcto');
        console.log(`   Algoritmo: ${hashParts[0]}`);
        console.log(`   Iteraciones: ${hashParts[1]}`);
        console.log(`   Salt: ${hashParts[2].substring(0, 8)}...`);
        console.log(`   Hash: ${hashParts[3].substring(0, 8)}...`);
        console.log(`   Digest: ${hashParts[4]}`);
      } else {
        console.log('❌ PROBLEMA: Formato de hash incorrecto');
        console.log(`   Hash actual: ${user.password.substring(0, 50)}...`);
      }
      console.log('');
    }

    // 6. Verificar cuentas OAuth
    console.log('6️⃣ Verificando cuentas OAuth...');
    const accounts = await db.collection('accounts').find({
      userId: user._id.toString()
    }).toArray();

    if (accounts.length > 0) {
      console.log(`✅ ${accounts.length} cuenta(s) OAuth encontrada(s):`);
      accounts.forEach((acc, index) => {
        console.log(`   ${index + 1}. Provider: ${acc.provider}, Type: ${acc.type}`);
      });
    } else {
      console.log('ℹ️  No se encontraron cuentas OAuth');
    }
    console.log('');

    // 7. Verificar sesiones activas
    console.log('7️⃣ Verificando sesiones activas...');
    const sessions = await db.collection('sessions').find({
      userId: user._id.toString()
    }).toArray();

    if (sessions.length > 0) {
      console.log(`ℹ️  ${sessions.length} sesión(es) activa(s):`);
      sessions.forEach((session, index) => {
        const expires = new Date(session.expires);
        const isExpired = expires < new Date();
        console.log(`   ${index + 1}. Expira: ${expires.toLocaleString('es-ES')} ${isExpired ? '(EXPIRADA)' : '(ACTIVA)'}`);
      });
    } else {
      console.log('ℹ️  No se encontraron sesiones activas');
    }
    console.log('');

    // 8. Resumen y recomendaciones
    console.log('📋 RESUMEN Y RECOMENDACIONES');
    console.log('=============================');

    const issues = [];

    if (user.enabled === false) {
      issues.push('Usuario deshabilitado');
    }

    if (password && user.password) {
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        issues.push('Contraseña incorrecta');
      }
    }

    if (issues.length === 0) {
      console.log('✅ No se detectaron problemas evidentes');
      console.log('   Recomendaciones:');
      console.log('   - Limpiar cookies del navegador');
      console.log('   - Verificar variables de entorno');
      console.log('   - Revisar logs del servidor');
    } else {
      console.log('❌ Problemas detectados:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      console.log('');
      console.log('🔧 Soluciones:');
      if (user.enabled === false) {
        console.log('   - Ejecutar: node authorize-user.js --email ' + email);
      }
      if (password && user.password) {
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
          console.log('   - Verificar que la contraseña sea correcta');
          console.log('   - Considerar restablecer la contraseña');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.close();
  }
}

// Función para crear un usuario de prueba
async function createTestUser(email, password) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log('🔧 Creando usuario de prueba...');

    const hashedPassword = await hashPassword(password);

    const testUser = {
      name: 'Usuario de Prueba',
      email: email,
      password: hashedPassword,
      role: 'user',
      enabled: true,
      onboarded: false,
      createdAt: new Date(),
      notificationsEnabled: true,
      privacyPublic: true,
      autoLocationEnabled: true
    };

    const result = await db.collection('users').insertOne(testUser);

    console.log('✅ Usuario de prueba creado exitosamente');
    console.log(`   ID: ${result.insertedId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${password}`);
    console.log('');
    console.log('🔑 Credenciales de prueba:');
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${password}`);

  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error.message);
  } finally {
    await client.close();
  }
}

// Función para restablecer contraseña
async function resetPassword(email, newPassword) {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log('🔧 Restableciendo contraseña...');

    const hashedPassword = await hashPassword(newPassword);

    const result = await db.collection('users').updateOne(
      { email: email },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    if (result.modifiedCount === 0) {
      console.log('ℹ️  No se realizaron cambios');
      return;
    }

    console.log('✅ Contraseña restablecida exitosamente');
    console.log(`   Email: ${email}`);
    console.log(`   Nueva contraseña: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error restableciendo contraseña:', error.message);
  } finally {
    await client.close();
  }
}

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log('Uso del script:');
  console.log('  node diagnose-auth-issue.js <email> [password]                    // Diagnosticar problema');
  console.log('  node diagnose-auth-issue.js --create-test <email> <password>      // Crear usuario de prueba');
  console.log('  node diagnose-auth-issue.js --reset-password <email> <password>   // Restablecer contraseña');
  process.exit(1);
}

if (command === '--create-test') {
  const email = args[1];
  const password = args[2];
  if (!email || !password) {
    console.error('Error: Debe proporcionar email y contraseña para crear usuario de prueba');
    process.exit(1);
  }
  createTestUser(email, password);
} else if (command === '--reset-password') {
  const email = args[1];
  const password = args[2];
  if (!email || !password) {
    console.error('Error: Debe proporcionar email y nueva contraseña');
    process.exit(1);
  }
  resetPassword(email, password);
} else {
  // Diagnóstico normal
  const email = command;
  const password = args[1];
  diagnoseAuthIssue(email, password);
}
