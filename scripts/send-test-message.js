// scripts/send-test-message.js
require('dotenv').config({ path: '../.env.local' });
const admin = require('firebase-admin');

// Inicializar Firebase si no está inicializado
const { initializeFirebaseAdmin } = require('./firebase-service-account');

// Inicializar Firebase
initializeFirebaseAdmin();

const firestore = admin.firestore();

// Mensajes de prueba con formato mejorado
const testMessages = {
  presentation: `🚨 SISTEMA DE SEGURIDAD CIUDADANA - ZACAGNINI JOSE MANUEL

¡Hola vecinos! 👋

Este es el chat oficial de nuestro barrio para reportar incidentes y mantenernos informados sobre la seguridad de nuestra comunidad.

📱 FUNCIONALIDADES DISPONIBLES:
  • Reportar incidentes en tiempo real
  • Botón de pánico para emergencias
  • Estadísticas del barrio
  • Mapa interactivo de incidentes
  • Notificaciones automáticas

✅ ESTADO DEL SISTEMA:
  ✅ Chat funcionando correctamente
  ✅ 3 participantes activos
  ✅ Notificaciones habilitadas
  ✅ Mapa actualizado

📊 ESTADÍSTICAS RECIENTES:
  • Incidentes reportados este mes: 12
  • Tiempo promedio de respuesta: 3 min
  • Vecinos activos: 3/15

¿Alguien tiene alguna pregunta sobre cómo usar el sistema? 🤔`,

  alert: `🚨 ALERTA DE PRUEBA - NO ES UNA EMERGENCIA REAL

  📍 Ubicación: Manzana 15, Lote 8
  ⏰ Hora: ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
  📱 Reportado por: Valentin (Admin)

Este es un mensaje de prueba para verificar el funcionamiento del sistema de alertas.

    ✅ Sistema funcionando correctamente
    ✅ Notificaciones enviadas a todos los participantes
    ✅ Ubicación registrada en el mapa

En caso de emergencia real, usa el botón de pánico rojo en la aplicación.

Gracias por tu atención. 🙏`,

  stats: `📊 REPORTE SEMANAL - ZACAGNINI JOSE MANUEL

  📅 Período: 20-26 de Julio 2025
  👥 Participantes activos: 3
  📈 Incidentes reportados: 5

  🔍 DESGLOSE POR TIPO:
    • Robo: 2 incidentes
    • Vandalismo: 1 incidente
    • Sospechoso: 1 incidente
    • Otros: 1 incidente

  📍 ZONAS MÁS AFECTADAS:
    • Manzana 12-15: 3 incidentes
    • Manzana 8-11: 2 incidentes

  ⏱️ TIEMPO PROMEDIO DE RESPUESTA: 2.5 minutos

  💡 RECOMENDACIONES:
    • Mantener luces encendidas por la noche
    • Reportar cualquier actividad sospechosa
    • Usar el botón de pánico en emergencias

¡Sigamos cuidando nuestro barrio! 🏘️`,

  welcome: `🎉 ¡BIENVENIDO AL CHAT DE ZACAGNINI JOSE MANUEL!

Hola! Soy Valentin, administrador del sistema de seguridad de nuestro barrio.

🏘️ NUESTRO BARRIO:
  • 15 manzanas
  • 45 familias registradas
  • Sistema de vigilancia activo 24/7

📱 CÓMO USAR EL SISTEMA:
  1️⃣ Para reportar incidentes: Usa el botón "Reportar" en la app
  2️⃣ Para emergencias: Presiona el botón rojo de pánico
  3️⃣ Para ver estadísticas: Ve a la pestaña "Estadísticas"
  4️⃣ Para ver el mapa: Ve a la pestaña "Mapa"

🔔 NOTIFICACIONES:
Recibirás alertas automáticas cuando:
  • Se reporte un incidente cerca de tu ubicación
  • Se active una alerta de pánico
  • Se actualicen las estadísticas del barrio

¿Tienes alguna pregunta? ¡No dudes en preguntar! 😊`,

  technical: `🛠️ PRUEBA TÉCNICA DEL SISTEMA

🔧 Configuración actual:
  • Chat ID: chat_zacagnini_jose_manuel
  • Participantes: 3 usuarios
  • Base de datos: MongoDB + Firestore
  • Tiempo real: ✅ Activo
  • Notificaciones: ✅ Funcionando

👥 Datos de prueba:
  • Usuario 1: Valentin (Admin)
  • Usuario 2: Eladio Carrio
  • Usuario 3: Seinmola de maíz

🎯 Funcionalidades probadas:
  ✅ Envío de mensajes
  ✅ Recepción en tiempo real
  ✅ Lista de participantes
  ✅ Roles de usuario
  ✅ Geolocalización

El sistema está funcionando perfectamente! 🎉`
};

async function sendTestMessage(messageType, chatId = 'chat_zacagnini_jose_manuel') {
  try {
    console.log(`📤 Enviando mensaje de prueba: ${messageType}`);
    console.log('==========================================');

    // Buscar el usuario admin
    const userSnapshot = await firestore.collection('users').where('email', '==', 'sanchezguevaravalentin@gmail.com').limit(1).get();

    if (userSnapshot.empty) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    console.log(`✅ Usuario encontrado: ${userData.name} (${userData.role})`);

    // Obtener el mensaje
    const message = testMessages[messageType];
    if (!message) {
      console.log('❌ Tipo de mensaje no válido');
      console.log('Tipos disponibles:', Object.keys(testMessages).join(', '));
      return;
    }

    // Crear el mensaje en Firestore
    const messageData = {
      userId: userId,
      userName: userData.name,
      message: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type: 'normal',
      metadata: {}
    };

    // Agregar el mensaje a la subcolección del chat
    await firestore.collection('chats').doc(chatId).collection('messages').add(messageData);

    // Actualizar el chat con el último mensaje
    await firestore.collection('chats').doc(chatId).update({
      lastMessage: message.substring(0, 100) + '...',
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Mensaje enviado exitosamente');
    console.log(`📝 Tipo: ${messageType}`);
    console.log(`💬 Chat: ${chatId}`);
    console.log(`👤 Usuario: ${userData.name}`);

  } catch (error) {
    console.error('❌ Error enviando mensaje:', error.message);
  }
}

const messageType = process.argv[2];
if (!messageType) {
  console.log('Uso: node send-test-message.js <tipo>');
  console.log('Tipos disponibles:');
  console.log('  presentation - Mensaje de presentación del sistema');
  console.log('  alert - Alerta de prueba');
  console.log('  stats - Reporte de estadísticas');
  console.log('  welcome - Mensaje de bienvenida');
  console.log('  technical - Información técnica');
  process.exit(1);
}

sendTestMessage(messageType);
