// src/lib/utils/chatFormatting.ts

/**
 * Formats a chat message with indentation and visual structure
 */
export function formatChatMessage(message: string): string {
  // Detect if it's a structured message (with emojis and lists)
  if (message.includes('📱') || message.includes('📊') || message.includes('✅')) {
    return formatStructuredMessage(message);
  }

  // Detect if it's an alert message
  if (message.includes('🚨') || message.includes('ALERTA') || message.includes('ALERT')) {
    return formatAlertMessage(message);
  }

  // Detect if it's a statistics message
  if (message.includes('📊') || message.includes('ESTADÍSTICAS') || message.includes('STATISTICS')) {
    return formatStatsMessage(message);
  }

  return message;
}

/**
 * Formats structured messages with lists and sections
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

    // Main titles (with emoji at the beginning)
    if (line.match(/^[🚨📱📊✅❌⚠️🎉🔧👥🔍💡]/)) {
      formattedLines.push(`\n${line}`);
      continue;
    }

    // Sections with titles (like "AVAILABLE FEATURES:", "SYSTEM STATUS:")
    if (line.match(/^[A-Z\s]+:$/)) {
      formattedLines.push(`\n${line}`);
      continue;
    }

    // List items with bullet points
    if (line.match(/^[•\-]/)) {
      formattedLines.push(`    ${line}`);
      continue;
    }

    // List items with checkmarks
    if (line.match(/^✅/)) {
      formattedLines.push(`    ${line}`);
      continue;
    }

    // List items with emoji
    if (line.match(/^[📱🔔📊⏱️📍🎯🔧]/)) {
      formattedLines.push(`    ${line}`);
      continue;
    }

    // Questions or calls to action
    if (line.includes('?')) {
      formattedLines.push(`\n${line}`);
      continue;
    }

    // Normal lines
    formattedLines.push(line);
  }

  return formattedLines.join('\n');
}

/**
 * Formats alert messages
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

    // Alert title
    if (trimmedLine.includes('ALERTA') || trimmedLine.includes('ALERT')) {
      formattedLines.push(`\n🚨 ${trimmedLine.replace('🚨', '').trim()}`);
      continue;
    }

    // Location information
    if (trimmedLine.includes('📍') || trimmedLine.includes('Ubicación') || trimmedLine.includes('Location')) {
      formattedLines.push(`  📍 ${trimmedLine.replace('📍', '').trim()}`);
      continue;
    }

    // Time information
    if (trimmedLine.includes('⏰') || trimmedLine.includes('Hora') || trimmedLine.includes('Time')) {
      formattedLines.push(`  ⏰ ${trimmedLine.replace('⏰', '').trim()}`);
      continue;
    }

    // Report information
    if (trimmedLine.includes('📱') || trimmedLine.includes('Reportado') || trimmedLine.includes('Reported')) {
      formattedLines.push(`  📱 ${trimmedLine.replace('📱', '').trim()}`);
      continue;
    }

    // System status
    if (trimmedLine.includes('✅')) {
      formattedLines.push(`    ✅ ${trimmedLine.replace('✅', '').trim()}`);
      continue;
    }

    // Normal lines
    formattedLines.push(line);
  }

  return formattedLines.join('\n');
}

/**
 * Formats statistics messages
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

    // Statistics title
    if (trimmedLine.includes('📊') && (trimmedLine.includes('ESTADÍSTICAS') || trimmedLine.includes('STATISTICS'))) {
      formattedLines.push(`\n📊 ${trimmedLine.replace('📊', '').trim()}`);
      continue;
    }

    // Period information
    if (trimmedLine.includes('📅') || trimmedLine.includes('Período') || trimmedLine.includes('Period')) {
      formattedLines.push(`  📅 ${trimmedLine.replace('📅', '').trim()}`);
      continue;
    }

    // Participants information
    if (trimmedLine.includes('👥') || trimmedLine.includes('Participantes') || trimmedLine.includes('Participants')) {
      formattedLines.push(`  👥 ${trimmedLine.replace('👥', '').trim()}`);
      continue;
    }

    // Breakdown by type
    if (trimmedLine.includes('🔍') || trimmedLine.includes('DESGLOSE') || trimmedLine.includes('BREAKDOWN')) {
      formattedLines.push(`\n  🔍 ${trimmedLine.replace('🔍', '').trim()}`);
      continue;
    }

    // Breakdown elements
    if (trimmedLine.includes('•') && (trimmedLine.includes('incidentes') || trimmedLine.includes(':'))) {
      formattedLines.push(`    ${trimmedLine}`);
      continue;
    }

    // Affected zones
    if (trimmedLine.includes('📍') || trimmedLine.includes('ZONAS') || trimmedLine.includes('ZONES')) {
      formattedLines.push(`\n  📍 ${trimmedLine.replace('📍', '').trim()}`);
      continue;
    }

    // Response time
    if (trimmedLine.includes('⏱️') || trimmedLine.includes('TIEMPO') || trimmedLine.includes('TIME')) {
      formattedLines.push(`  ⏱️ ${trimmedLine.replace('⏱️', '').trim()}`);
      continue;
    }

    // Recommendations
    if (trimmedLine.includes('💡') || trimmedLine.includes('RECOMENDACIONES') || trimmedLine.includes('RECOMMENDATIONS')) {
      formattedLines.push(`\n  💡 ${trimmedLine.replace('💡', '').trim()}`);
      continue;
    }

    // Normal lines
    formattedLines.push(line);
  }

  return formattedLines.join('\n');
}

/**
 * Creates a well-formatted system presentation message
 */
export function createSystemPresentationMessage(): string {
  return `🚨 CITIZEN SECURITY SYSTEM - ZACAGNINI JOSE MANUEL

Hello neighbors! 👋

This is the official chat of our neighborhood to report incidents and stay informed about the security of our community.

📱 AVAILABLE FEATURES:
  • Report incidents in real time
  • Panic button for emergencies
  • Neighborhood statistics
  • Interactive incident map
  • Automatic notifications

✅ SYSTEM STATUS:
  ✅ Chat working correctly
  ✅ 3 active participants
  ✅ Notifications enabled
  ✅ Map updated

📊 RECENT STATISTICS:
  • Incidents reported this month: 12
  • Average response time: 3 min
  • Active neighbors: 3/15

Does anyone have any questions about how to use the system? 🤔`;
}

/**
 * Creates a well-formatted test alert message
 */
export function createTestAlertMessage(): string {
  return `🚨 TEST ALERT - NOT A REAL EMERGENCY

  📍 Location: Block 15, Lot 8
  ⏰ Time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
  📱 Reported by: Valentin (Admin)

This is a test message to verify the alert system functionality.

    ✅ System working correctly
    ✅ Notifications sent to all participants
    ✅ Location registered on the map

In case of real emergency, use the red panic button in the application.

Thank you for your attention. 🙏`;
}

/**
 * Creates a well-formatted statistics message
 */
export function createStatsMessage(): string {
  return `📊 WEEKLY REPORT - ZACAGNINI JOSE MANUEL

  📅 Period: July 20-26, 2025
  👥 Active participants: 3
  📈 Incidents reported: 5

  🔍 BREAKDOWN BY TYPE:
    • Robbery: 2 incidents
    • Vandalism: 1 incident
    • Suspicious: 1 incident
    • Others: 1 incident

  📍 MOST AFFECTED ZONES:
    • Block 12-15: 3 incidents
    • Block 8-11: 2 incidents

  ⏱️ AVERAGE RESPONSE TIME: 2.5 minutes

  💡 RECOMMENDATIONS:
    • Keep lights on at night
    • Report any suspicious activity
    • Use the panic button in emergencies

Let's keep taking care of our neighborhood! 🏘️`;
}
