// src/lib/utils/chatFormatting.ts

/**
 * Formatea un mensaje de chat con sangrías y estructura visual
 */
export function formatChatMessage(message: string): string {
  // Detectar si es un mensaje estructurado (con emojis y listas)
  if (message.includes('📱') || message.includes('📊') || message.includes('✅')) {
    return formatStructuredMessage(message);
  }

  // Detectar si es un mensaje de alerta
  if (message.includes('🚨') || message.includes('ALERTA')) {
    return formatAlertMessage(message);
  }

  // Detectar si es un mensaje de estadísticas
  if (message.includes('📊') || message.includes('ESTADÍSTICAS')) {
    return formatStatsMessage(message);
  }

  return message;
}

/**
 * Formatea mensajes estructurados con listas y secciones
 */
function formatStructuredMessage(message: string): string {
  const lines = message.split('\n');
  const formattedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      formattedLines.push('');
      continue;
    }

    // Títulos principales (con emoji al inicio)
    if (line.match(/^[🚨📱📊✅❌⚠️🎉🔧👥🔍💡]/)) {
      formattedLines.push(`\n${line}`);
      continue;
    }

    // Secciones con títulos (como "AVAILABLE FEATURES:", "SYSTEM STATUS:")
    if (line.match(/^[A-Z\s]+:$/)) {
      formattedLines.push(`\n${line}`);
      continue;
    }

    // Elementos de lista con bullet points
    if (line.match(/^[•\-]/)) {
      formattedLines.push(`    ${line}`);
      continue;
    }

    // Elementos de lista con checkmarks
    if (line.match(/^✅/)) {
      formattedLines.push(`    ${line}`);
      continue;
    }

    // Elementos de lista con emoji
    if (line.match(/^[📱🔔📊⏱️📍🎯🔧]/)) {
      formattedLines.push(`    ${line}`);
      continue;
    }

    // Preguntas o llamadas a la acción
    if (line.includes('?')) {
      formattedLines.push(`\n${line}`);
      continue;
    }

    // Líneas normales
    formattedLines.push(line);
  }

  return formattedLines.join('\n');
}

/**
 * Formatea mensajes de alerta
 */
function formatAlertMessage(message: string): string {
  const lines = message.split('\n');
  const formattedLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      formattedLines.push('');
      continue;
    }

    // Título de alerta
    if (trimmedLine.includes('ALERTA')) {
      formattedLines.push(`\n🚨 ${trimmedLine.replace('🚨', '').trim()}`);
      continue;
    }

    // Información de ubicación
    if (trimmedLine.includes('📍') || trimmedLine.includes('Ubicación')) {
      formattedLines.push(`  📍 ${trimmedLine.replace('📍', '').trim()}`);
      continue;
    }

    // Información de tiempo
    if (trimmedLine.includes('⏰') || trimmedLine.includes('Hora')) {
      formattedLines.push(`  ⏰ ${trimmedLine.replace('⏰', '').trim()}`);
      continue;
    }

    // Información de reporte
    if (trimmedLine.includes('📱') || trimmedLine.includes('Reportado')) {
      formattedLines.push(`  📱 ${trimmedLine.replace('📱', '').trim()}`);
      continue;
    }

    // Estados del sistema
    if (trimmedLine.includes('✅')) {
      formattedLines.push(`    ✅ ${trimmedLine.replace('✅', '').trim()}`);
      continue;
    }

    // Líneas normales
    formattedLines.push(line);
  }

  return formattedLines.join('\n');
}

/**
 * Formatea mensajes de estadísticas
 */
function formatStatsMessage(message: string): string {
  const lines = message.split('\n');
  const formattedLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      formattedLines.push('');
      continue;
    }

    // Título de estadísticas
    if (trimmedLine.includes('📊') && trimmedLine.includes('ESTADÍSTICAS')) {
      formattedLines.push(`\n📊 ${trimmedLine.replace('📊', '').trim()}`);
      continue;
    }

    // Información de período
    if (trimmedLine.includes('📅') || trimmedLine.includes('Período')) {
      formattedLines.push(`  📅 ${trimmedLine.replace('📅', '').trim()}`);
      continue;
    }

    // Información de participantes
    if (trimmedLine.includes('👥') || trimmedLine.includes('Participantes')) {
      formattedLines.push(`  👥 ${trimmedLine.replace('👥', '').trim()}`);
      continue;
    }

    // Desglose por tipo
    if (trimmedLine.includes('🔍') || trimmedLine.includes('DESGLOSE')) {
      formattedLines.push(`\n  🔍 ${trimmedLine.replace('🔍', '').trim()}`);
      continue;
    }

    // Elementos de desglose
    if (trimmedLine.includes('•') && (trimmedLine.includes('incidentes') || trimmedLine.includes(':'))) {
      formattedLines.push(`    ${trimmedLine}`);
      continue;
    }

    // Zonas afectadas
    if (trimmedLine.includes('📍') || trimmedLine.includes('ZONAS')) {
      formattedLines.push(`\n  📍 ${trimmedLine.replace('📍', '').trim()}`);
      continue;
    }

    // Tiempo de respuesta
    if (trimmedLine.includes('⏱️') || trimmedLine.includes('TIEMPO')) {
      formattedLines.push(`  ⏱️ ${trimmedLine.replace('⏱️', '').trim()}`);
      continue;
    }

    // Recomendaciones
    if (trimmedLine.includes('💡') || trimmedLine.includes('RECOMENDACIONES')) {
      formattedLines.push(`\n  💡 ${trimmedLine.replace('💡', '').trim()}`);
      continue;
    }

    // Líneas normales
    formattedLines.push(line);
  }

  return formattedLines.join('\n');
}

/**
 * Crea un mensaje de presentación del sistema bien formateado
 */
export function createSystemPresentationMessage(): string {
  return `🚨 SISTEMA DE SEGURIDAD CIUDADANA - ZACAGNINI JOSE MANUEL

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

¿Alguien tiene alguna pregunta sobre cómo usar el sistema? 🤔`;
}

/**
 * Crea un mensaje de alerta de prueba bien formateado
 */
export function createTestAlertMessage(): string {
  return `🚨 ALERTA DE PRUEBA - NO ES UNA EMERGENCIA REAL

  📍 Ubicación: Manzana 15, Lote 8
  ⏰ Hora: ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
  📱 Reportado por: Valentin (Admin)

Este es un mensaje de prueba para verificar el funcionamiento del sistema de alertas.

    ✅ Sistema funcionando correctamente
    ✅ Notificaciones enviadas a todos los participantes
    ✅ Ubicación registrada en el mapa

En caso de emergencia real, usa el botón de pánico rojo en la aplicación.

Gracias por tu atención. 🙏`;
}

/**
 * Crea un mensaje de estadísticas bien formateado
 */
export function createStatsMessage(): string {
  return `📊 REPORTE SEMANAL - ZACAGNINI JOSE MANUEL

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

¡Sigamos cuidando nuestro barrio! 🏘️`;
}
