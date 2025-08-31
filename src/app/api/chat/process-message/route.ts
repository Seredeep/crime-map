import { firestore } from '@/lib/config/db/firebase';
import { getIncidentTypesForRegion } from '@/lib/services/incidents/utils';
import { MessageMetadata } from '@/lib/types/global';
import { ai, ax, AxAIGoogleGeminiModel, AxAIOpenAIModel, AxAIService, f } from "@ax-llm/ax";
import { NextRequest, NextResponse } from 'next/server';

// #region AX Message Types
type AxMessage = {
  role: "system" | "user" | "assistant" | "function";
  name?: string;
  userId?: string;
  content: { type: "text"; text: string }[];
};
// #endregion

/**
 * Ax signature for message processing — declare inputs and structured outputs
 */
const MessageProcessor = f()
  .description('Analyze a chat message for safety and intent. When creating summaries for incidents, focus on facts only: avoid mentioning reporters, names, or self-referential language. Example: "Suspicious person near the park" not "User reports seeing suspicious person"')
  // Inputs you pass to forward(...)
  .input('message', f.string('user message'))
  .input('userName', f.string('sender display name'))
  .input('chatId', f.string('chat/thread id'))
  .input('messageType', f.string('message type (normal, panic, system, incident)'))
  .input('timestamp', f.string('ISO timestamp'))
  .input('context', f.optional(f.string('system/app context')))
  .input('participants', f.optional(f.array(f.string())))
  .input('threadHistory', f.optional(f.array(f.string())))
  // Structured outputs
  .output('sentiment', f.class(['positive','negative','neutral','fear','concerned']))
  .output('intent', f.class(['emergency', 'report', 'general', 'support']))
  .output('priority', f.class(['high', 'medium', 'low']))
  .output('categories', f.class(['safety', 'neighborhood', 'personal', 'suspicious']))
  .output('actionRequired', f.boolean("action required if providing additional information to an incident"))
  .output('summary', f.string('brief, factual summary without mentioning the reporter - focus on what happened/observed'))
  .output('riskLevel', f.class(['high', 'medium', 'low', 'none']))
  .build();

/**
 * Provider selection based on env: MESSAGE_PROCESSOR_MODEL = "<provider>/<model>"
 * Supports: google-vertex/* (via VertexAIAdapter), openai/* (inline adapter)
 */
async function getLLMProvider(): Promise<AxAIService> {
  const spec = process.env.MESSAGE_PROCESSOR_MODEL ?? "google-vertex/gemini-2.5-flash-lite";
  const [provider, model] = spec.split("/", 2);
  if (!provider || !model) {
    throw new Error(`Invalid MESSAGE_PROCESSOR_MODEL: "${spec}"`);
  }

  if (provider === "google-vertex") {
    // Use Ax Google Gemini provider with the generated token
    return ai({
      name: "google-gemini",
      config: {
        model: AxAIGoogleGeminiModel.Gemini25FlashLite,
      },
      apiKey: process.env.GOOGLE_AI_API_KEY! // Pass the access token as apiKey
    });
  }

  if (provider === "openai") {
    return ai({name: "openai", config:{model: AxAIOpenAIModel.GPT5Mini}, apiKey: process.env.OPENAI_API_KEY!})
  }

  throw new Error(`Unsupported provider "${provider}" in MESSAGE_PROCESSOR_MODEL`);
}

// #region Helper Functions for Context Gathering

/**
 * Gather chat participants information
 */
async function getChatParticipants(chatId: string): Promise<{ userId: string; name: string; role: string }[]> {
  try {
    const chatDoc = await firestore.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) return [];

    const chatData = chatDoc.data();
    const participantIds = chatData?.participants || [];

    if (participantIds.length === 0) return [];

    // Get participant details from users collection
    const usersSnapshot = await firestore.collection('users')
      .where('__name__', 'in', participantIds.slice(0, 10)) // Firestore 'in' limit is 10
      .get();

    const participants = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        name: data.name || data.email?.split('@')[0] || 'Unknown',
        role: data.role || 'user'
      };
    });

    return participants;
  } catch (error) {
    console.warn('Error fetching chat participants:', error);
    return [];
  }
}

/**
 * Gather thread history for context
 * When threadId is provided, includes both the root message and all replies
 * @param limit - Number of messages to fetch (0 = no limit, get all messages)
 */
async function getThreadHistory(chatId: string, threadId?: string, currentMessageId?: string, limit: number = 10): Promise<{
  userId: string;
  name: string;
  isAssistant: boolean;
  text: string;
  timestamp: string;
}[]> {
  try {
    const allMessages: {
      userId: string;
      name: string;
      isAssistant: boolean;
      text: string;
      timestamp: string;
    }[] = [];

    // If we have a threadId, we need to fetch both:
    // 1. The root message (the message that started the thread)
    // 2. All messages that are replies to this thread
    if (threadId) {
      // 1. Fetch the root message (thread starter)
      const rootMessageDoc = await firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc(threadId)
        .get();

      if (rootMessageDoc.exists) {
        const rootData = rootMessageDoc.data();
        allMessages.push({
          userId: rootData?.userId || 'unknown',
          name: rootData?.userName || 'Unknown',
          isAssistant: rootData?.type === 'system' || rootData?.type === 'incident',
          text: rootData?.message || '',
          timestamp: rootData?.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      }

      // 2. Fetch all messages that are replies to this thread
      let query = firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .where('metadata.threadId', '==', threadId)
        .orderBy('timestamp', 'asc'); // Ascending for chronological order

      const replySnapshot = await query.get();
      replySnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Skip if this is the current message being analyzed
        if (currentMessageId && doc.id === currentMessageId) {
          return;
        }
        allMessages.push({
          userId: data.userId || 'unknown',
          name: data.userName || 'Unknown',
          isAssistant: data.type === 'system' || data.type === 'incident',
          text: data.message || '',
          timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });

      // Sort all messages by timestamp to ensure chronological order
      allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return allMessages;
    }

    // For non-thread messages, use the original logic with limit
    let query = firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc');

    // Only apply limit if it's greater than 0
    if (limit > 0) {
      query = query.limit(limit);
    }

    // If we have current message ID, exclude it from history
    if (currentMessageId) {
      const messagesSnapshot = await query.get();
      const messages = messagesSnapshot.docs
        .filter(doc => doc.id !== currentMessageId)
        .map(doc => {
          const data = doc.data();
          return {
            userId: data.userId || 'unknown',
            name: data.userName || 'Unknown',
            isAssistant: data.type === 'system' || data.type === 'incident',
            text: data.message || '',
            timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
          };
        })
        .reverse(); // Reverse to get chronological order

      return messages;
    }

    const messagesSnapshot = await query.get();
    const messages = messagesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: data.userId || 'unknown',
        name: data.userName || 'Unknown',
        isAssistant: data.type === 'system' || data.type === 'incident',
        text: data.message || '',
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    }).reverse(); // Reverse to get chronological order

    return messages;
  } catch (error) {
    console.warn('Error fetching thread history:', error);
    return [];
  }
}

/**
 * Create AxMessages array with full conversation context
 */
function createAxMessages(
  participants: { userId: string; name: string; role: string }[],
  threadHistory: { userId: string; name: string; isAssistant: boolean; text: string; timestamp: string }[],
  currentMessage: { userId: string; name: string; text: string }
): AxMessage[] {
  // System message with context
  const systemMessage: AxMessage = {
    role: "system",
    content: [{
      type: "text",
      text: `You are analyzing a multi-user neighborhood chat for safety and incident detection.

Chat Participants:
${participants.map(p => `- ${p.name} (id=${p.userId}, role=${p.role})`).join('\n')}

Recent conversation history (${threadHistory.length} messages):
${threadHistory.slice(-5).map(h => `[${h.timestamp}] ${h.name}: ${h.text}`).join('\n')}

Analyze the current message in this context and return ONLY the structured outputs defined by the signature.`
    }]
  };

  // Convert thread history to AxMessages
  const historyMessages: AxMessage[] = threadHistory.map(h => ({
    role: h.isAssistant ? "assistant" : "user",
    name: h.name,
    userId: h.userId,
    content: [{ type: "text", text: h.text }]
  }));

  // Current message
  const currentMsg: AxMessage = {
    role: "user",
    name: currentMessage.name,
    userId: currentMessage.userId,
    content: [{ type: "text", text: currentMessage.text }]
  };

  return [systemMessage, ...historyMessages, currentMsg];
}

// #endregion

/**
 * Execute analysis using Ax structured outputs with enhanced context
 */
async function executeMessageAnalysis(input: {
  message: string;
  userName: string;
  userId: string;
  chatId: string;
  messageType: 'normal' | 'panic';
  timestamp: string;
  context?: string;
  metadata?: MessageMetadata;
  messageId?: string;
}) {
  const llm = await getLLMProvider();

  // Gather context
  const participants = await getChatParticipants(input.chatId);

  // Determine history limit based on thread participation
  // If message is part of a thread, get ALL thread history for complete context
  // If message is not part of a thread (thread starter or regular message), limit to recent history
  const isPartOfThread = !!input.metadata?.threadId;
  const historyLimit = isPartOfThread ? 0 : 20; // 0 = no limit (all thread messages), 20 = last 20 messages

  const threadHistory = await getThreadHistory(
    input.chatId,
    input.metadata?.threadId,
    input.messageId,
    historyLimit
  );

  // Log context for debugging
  console.log('Message analysis context:', {
    participantsCount: participants.length,
    historyMessages: threadHistory.length,
    threadId: input.metadata?.threadId,
    isPartOfThread,
    historyLimit: historyLimit === 0 ? 'unlimited' : historyLimit,
    includesThreadRoot: !!input.metadata?.threadId,
    messageType: input.messageType
  });

  // Execute analysis with enhanced context
  const result = await ax(MessageProcessor).forward(llm, {
    message: input.message,
    userName: input.userName,
    chatId: input.chatId,
    messageType: input.messageType,
    timestamp: input.timestamp,
    context: input.context ?? 'No context provided',
    participants: participants.map(p => JSON.stringify(p)),
    threadHistory: threadHistory.map(h => JSON.stringify(h))
  });

  return result;
}

/**
 * Check if a message is part of a thread
 */
function isMessageInThread(metadata: MessageMetadata): boolean {
  return !!(metadata?.threadId || metadata?.parentId || metadata?.threadStarterId);
}

/**
 * Check if a thread is related to an incident by examining the thread root message
 */
async function isThreadRelatedToIncident(chatId: string, threadId: string): Promise<{ isIncident: boolean; incidentData?: any }> {
  try {
    const threadRootDoc = await firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(threadId)
      .get();

    if (!threadRootDoc.exists) {
      return { isIncident: false };
    }

    const threadRootData = threadRootDoc.data();
    if (threadRootData?.metadata?.kind === 'incident') {
      return {
        isIncident: true,
        incidentData: threadRootData.metadata.incident
      };
    }

    return { isIncident: false };
  } catch (error) {
    console.error('Error checking thread incident relationship:', error);
    return { isIncident: false };
  }
}

/**
 * Create a new incident from message analysis
 */
async function createIncidentFromMessage(
  chatId: string,
  userId: string,
  userName: string,
  message: string,
  analysis: any,
  neighborhood: string
): Promise<string | null> {
  try {
    // Determine incident type based on analysis
    const incidentTypes = getIncidentTypesForRegion('general');
    let incidentType = 'general_safety'; // default

    // Map analysis categories to incident types
    if (analysis.categories?.includes('safety')) {
      incidentType = 'safety_concern';
    } else if (analysis.categories?.includes('personal')) {
      incidentType = 'personal_safety';
    } else if (analysis.categories?.includes('suspicious')) {
      incidentType = 'suspicious_activity';
    }

    // Validate incident type exists
    const validType = incidentTypes.find(type => type.id === incidentType);
    if (!validType) {
      incidentType = incidentTypes[0]?.id || 'general_safety';
    }

    // Create incident data
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60_000); // 1 hour default

    const incidentData = {
      type: incidentType,
      description: analysis.summary, // Use clean summary without adding "Reported by"
      neighborhood,
      chatId,
      location: {
        type: 'Point',
        coordinates: [0, 0] // Default coordinates, could be enhanced with user location
      },
      createdBy: userId,
      activeForMinutes: 60
    };

    // Call incident creation API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/incidents/firestore/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incidentData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Incident created successfully:', result.incidentId);
      return result.incidentId;
    } else {
      console.error('Failed to create incident:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Error creating incident:', error);
    return null;
  }
}

/**
 * Update an existing incident with new information using the dedicated API
 */
async function updateIncidentWithNewInfo(
  incidentId: string,
  newMessage: string,
  analysis: any
): Promise<boolean> {
  try {
    const updateData = {
      incidentId,
      newMessage,
      newSummary: analysis.summary,
      messageIntent: analysis.intent,
      messageCategories: analysis.categories || []
    };

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/incidents/firestore/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Incident update result:', result);
      return result.success && result.updated;
    } else {
      console.error('Failed to update incident:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error updating incident:', error);
    return false;
  }
}

/**
 * POST /api/chat/process-message
 * Processes a new message asynchronously for safety and intent analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messageId,
      chatId,
      userId,
      userName,
      message,
      type,
      metadata,
      timestamp
    }: {
      messageId: string;
      chatId: string;
      userId: string;
      userName: string;
      message: string;
      type: 'normal' | 'panic';
      metadata: MessageMetadata;
      timestamp: string;
    } = body;

    // Validate required fields
    if (!messageId || !chatId || !userId || !userName || !message || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Execute message analysis asynchronously with enhanced context
    const analysis = await executeMessageAnalysis({
      message,
      userName,
      userId,
      chatId,
      messageType: type,
      timestamp,
      context: metadata?.context,
      metadata,
      messageId
    });

    console.log('Message analysis:', {
      messageId,
      sentiment: analysis.sentiment, // positive, negative, neutral, fear, concerned
      intent: analysis.intent, // emergency, report, general, support
      priority: analysis.priority, // high, medium, low
      categories: analysis.categories, // safety, neighborhood, personal, suspicious
      actionRequired: analysis.actionRequired, // true, false
      riskLevel: analysis.riskLevel, // high, medium, low, none
      summary: analysis.summary, // brief summary of the message
    });

    // Handle incident creation/updates based on thread status and analysis
    if (analysis.actionRequired) {
      console.log('Action required for message - checking thread/incident relationship');

      // Get chat information to determine neighborhood
      let neighborhood = 'unknown';
      try {
        const chatDoc = await firestore.collection('chats').doc(chatId).get();
        if (chatDoc.exists) {
          const chatData = chatDoc.data();
          neighborhood = chatData?.neighborhood || 'unknown';
        }
      } catch (error) {
        console.warn('Could not fetch chat information:', error);
      }

      // Check if message is part of a thread
      const isInThread = isMessageInThread(metadata);

      if (!isInThread) {
        // Message is NOT in a thread - create new incident
        console.log('Message not in thread - creating new incident');
        const incidentId = await createIncidentFromMessage(
          chatId,
          userId,
          userName,
          message,
          analysis,
          neighborhood
        );

        if (incidentId) {
          console.log('New incident created successfully:', incidentId);
        } else {
          console.error('Failed to create incident for high-priority message');
        }
      } else {
        // Message IS in a thread - check if thread is related to an incident
        const threadId = metadata?.threadId || metadata?.threadStarterId || metadata?.parentId;

        if (threadId) {
          console.log('Message in thread - checking if thread is incident-related:', threadId);
          const { isIncident, incidentData } = await isThreadRelatedToIncident(chatId, threadId);

          if (isIncident && incidentData) {
            // Thread is related to an incident - update the incident
            console.log('Thread is incident-related - updating existing incident:', incidentData.id);
            const updateSuccess = await updateIncidentWithNewInfo(
              incidentData.id,
              message,
              analysis
            );

            if (updateSuccess) {
              console.log('Incident updated successfully');
            } else {
              console.error('Failed to update incident');
            }
          } else {
            // Thread is NOT incident-related - this is just a regular thread conversation
            console.log('Thread is not incident-related - no incident action needed');
          }
        } else {
          console.warn('Message marked as threaded but no threadId found in metadata');
        }
      }
    } else {
      console.log('No action required for message');
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        analysis: {
          sentiment: analysis.sentiment,
          intent: analysis.intent,
          priority: analysis.priority,
          categories: analysis.categories,
          actionRequired: analysis.actionRequired,
          riskLevel: analysis.riskLevel,
          summary: analysis.summary,
        }
      }
    });

  } catch (error) {
    console.error('Error in message processing API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during message processing' },
      { status: 500 }
    );
  }
}
