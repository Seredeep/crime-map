// src/lib/services/chat/chatValidation.ts

/**
 * Valida y normaliza un chatId para asegurar que tenga el formato correcto
 */
export function validateAndNormalizeChatId(neighborhood: string): string {
  if (!neighborhood || typeof neighborhood !== 'string') {
    throw new Error('Neighborhood debe ser una cadena válida');
  }

  // Normalizar el nombre del barrio a un chatId
  const normalizedNeighborhood = neighborhood.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  const chatId = `chat_${normalizedNeighborhood}`;

  return chatId;
}

/**
 * Verifica si un chatId tiene el formato correcto
 */
export function isValidChatId(chatId: string): boolean {
  if (!chatId || typeof chatId !== 'string') {
    return false;
  }

  // El formato correcto es: chat_[nombre_normalizado]
  return /^chat_[a-z0-9_]+$/i.test(chatId);
}

/**
 * Detecta si un chatId es de la lógica antigua (ObjectId de MongoDB)
 */
export function isOldChatId(chatId: string): boolean {
  if (!chatId || typeof chatId !== 'string') {
    return false;
  }

  // Los chatIds antiguos eran ObjectIds de MongoDB (24 caracteres hexadecimales)
  return /^[0-9a-f]{24}$/i.test(chatId);
}

/**
 * Valida que un usuario tenga la configuración correcta de chat
 */
export function validateUserChatConfiguration(user: {
  neighborhood?: string;
  chatId?: string;
  onboarded?: boolean;
}): {
  isValid: boolean;
  issues: string[];
  suggestedChatId?: string;
} {
  const issues: string[] = [];

  // Verificar que tenga onboarding completo
  if (!user.onboarded) {
    issues.push('Usuario no ha completado el onboarding');
  }

  // Verificar que tenga barrio asignado
  if (!user.neighborhood) {
    issues.push('Usuario no tiene barrio asignado');
  }

  // Verificar que tenga chatId
  if (!user.chatId) {
    issues.push('Usuario no tiene chatId asignado');
  }

  // Verificar formato del chatId
  if (user.chatId && isOldChatId(user.chatId)) {
    issues.push('Usuario tiene chatId en formato antiguo (ObjectId)');
  }

  if (user.chatId && !isValidChatId(user.chatId) && !isOldChatId(user.chatId)) {
    issues.push('Usuario tiene chatId en formato inválido');
  }

  // Generar chatId sugerido si hay barrio
  let suggestedChatId: string | undefined;
  if (user.neighborhood) {
    suggestedChatId = validateAndNormalizeChatId(user.neighborhood);
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestedChatId
  };
}

/**
 * Logs de validación para debugging
 */
export function logChatValidation(user: {
  email?: string;
  neighborhood?: string;
  chatId?: string;
  onboarded?: boolean;
}): void {
  const validation = validateUserChatConfiguration(user);

  console.log(`🔍 Validación de chat para ${user.email || 'usuario desconocido'}:`);
  console.log(`   Barrio: ${user.neighborhood || 'No asignado'}`);
  console.log(`   ChatId: ${user.chatId || 'No asignado'}`);
  console.log(`   Onboarded: ${user.onboarded || false}`);
  console.log(`   Válido: ${validation.isValid ? '✅' : '❌'}`);

  if (!validation.isValid) {
    console.log(`   Problemas: ${validation.issues.join(', ')}`);
    if (validation.suggestedChatId) {
      console.log(`   ChatId sugerido: ${validation.suggestedChatId}`);
    }
  }
}
