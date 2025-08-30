import { MessageMetadata } from '@/lib/types/global';
import { ai, ax, AxAIGoogleGeminiModel, AxAIOpenAIModel, AxAIService, f } from "@ax-llm/ax";
import { NextRequest, NextResponse } from 'next/server';

/**
 * Ax signature for message processing — declare inputs and structured outputs
 */
const MessageProcessor = f()
  .description('Analyze a chat message for safety and intent')
  // Inputs you pass to forward(...)
  .input('message', f.string('user message'))
  .input('userName', f.string('sender display name'))
  .input('chatId', f.string('chat/thread id'))
  .input('messageType', f.string('message type (normal, panic, system, incident)'))
  .input('timestamp', f.string('ISO timestamp'))
  .input('context', f.optional(f.string('system/app context')))
  // Structured outputs
  .output('sentiment', f.class(['positive','negative','neutral','fear','concerned']))
  .output('intent', f.class(['emergency', 'report', 'general', 'support']))
  .output('priority', f.class(['high', 'medium', 'low']))
  .output('categories', f.array(f.class(['safety', 'neighborhood', 'personal', 'suspicious'])))
  .output('actionRequired', f.boolean())
  .output('summary', f.string('brief summary'))
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

/**
 * Execute analysis using Ax structured outputs (no ad-hoc parsing)
 */
async function executeMessageAnalysis(input: {
  message: string;
  userName: string;
  chatId: string;
  messageType: 'normal' | 'panic';
  timestamp: string;
  context?: string;
}) {
  const llm = await getLLMProvider();
  // Ax will render a prompt from the signature and return typed structured data
  const AX = ax(MessageProcessor).getSignature().toString();
  console.log('AX', AX);
  const result = await ax(MessageProcessor).forward(llm, {
    message: input.message,
    userName: input.userName,
    chatId: input.chatId,
    messageType: input.messageType,
    timestamp: input.timestamp,
    context: input.context ?? 'No context provided',
  });
  return result;
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

    // Execute message analysis asynchronously
    const analysis = await executeMessageAnalysis({
      message,
      userName,
      chatId,
      messageType: type,
      timestamp,
      context: metadata?.context
    });

    console.log('Message analysis:', {
      messageId,
      sentiment: analysis.sentiment,
      intent: analysis.intent,
      priority: analysis.priority,
      categories: analysis.categories,
      actionRequired: analysis.actionRequired,
      riskLevel: analysis.riskLevel,
      summary: analysis.summary,
    });

    if (analysis.actionRequired && analysis.priority === 'high') {
      console.log('High priority message detected - triggering response protocol');
      // TODO: Implement response protocol for high-priority messages
      // This could include:
      // - Sending notifications to moderators
      // - Escalating to emergency services
      // - Flagging for human review
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
