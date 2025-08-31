// #region Imports
import admin, { firestore } from '@/lib/config/db/firebase';
import { updateIncidentMessageInChat } from '@/lib/services/chat/firestoreChatService';
import { ai, ax, AxAIGoogleGeminiModel, AxAIOpenAIModel, AxAIService, f } from "@ax-llm/ax";
import { NextRequest, NextResponse } from 'next/server';
// #endregion

// #region AX Flow for Incident Updates
const IncidentUpdateProcessor = f()
  .description('Analyze new information and decide whether to update an existing incident. When updating descriptions, create a single, neutral, coherent summary that combines all relevant information without self-references. Example: "Armed individual, suspect wearing black sweatshirt and grey pants" not "Follow-up: additional information about suspect clothing"')
  // Inputs
  .input('newMessage', f.string('new message content'))
  .input('newSummary', f.string('summary of new message'))
  .input('existingIncident', f.string('existing incident data as JSON'))
  .input('messageIntent', f.optional(f.string('intent analysis of new message')))
  .input('messageCategories', f.optional(f.string('categories of new message')))
  // Structured outputs
  .output('shouldUpdate', f.boolean('whether the incident should be updated'))
  .output('updateType', f.class(['modify_description', 'add_tags', 'change_type', 'extend_duration', 'no_change']))
  .output('updatedDescription', f.optional(f.string('new description if modifying - must be a clean, neutral summary combining all relevant information without self-references')))
  .output('additionalTags', f.optional(f.array(f.string('additional tags to add'))))
  .output('newType', f.optional(f.string('new incident type if changing')))
  .output('extendMinutes', f.optional(f.number('minutes to extend incident duration')))
  .output('confidence', f.class(['high', 'medium', 'low']))
  .output('reasoning', f.string('explanation for the decision'))
  .build();

async function getLLMProvider(): Promise<AxAIService> {
  const spec = process.env.MESSAGE_PROCESSOR_MODEL ?? "google-vertex/gemini-2.5-flash-lite";
  const [provider, model] = spec.split("/", 2);
  if (!provider || !model) {
    throw new Error(`Invalid MESSAGE_PROCESSOR_MODEL: "${spec}"`);
  }

  if (provider === "google-vertex") {
    return ai({
      name: "google-gemini",
      config: {
        model: AxAIGoogleGeminiModel.Gemini25FlashLite,
      },
      apiKey: process.env.GOOGLE_AI_API_KEY!
    });
  }

  if (provider === "openai") {
    return ai({name: "openai", config:{model: AxAIOpenAIModel.GPT5Mini}, apiKey: process.env.OPENAI_API_KEY!})
  }

  throw new Error(`Unsupported provider "${provider}" in MESSAGE_PROCESSOR_MODEL`);
}
// #endregion

// #region Types
interface UpdateIncidentBody {
  incidentId: string;
  newMessage: string;
  newSummary: string;
  messageIntent: string;
  messageCategories: string[];
}
// #endregion

// #region Validation
function validateBody(body: any): { ok: true; data: UpdateIncidentBody } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') return { ok: false, message: 'Payload inválido' };

  const required = ['incidentId', 'newMessage', 'newSummary', 'messageIntent', 'messageCategories'];
  for (const key of required) {
    if (!(key in body)) return { ok: false, message: `Falta el campo requerido: ${key}` };
  }

  const data: UpdateIncidentBody = {
    incidentId: String(body.incidentId),
    newMessage: String(body.newMessage),
    newSummary: String(body.newSummary),
    messageIntent: String(body.messageIntent),
    messageCategories: body.messageCategories ? typeof body.messageCategories === 'string' ? [body.messageCategories] : body.messageCategories.map(String) : undefined
  };

  return { ok: true, data };
}
// #endregion

// #region Handler
export async function POST(request: NextRequest) {
  try {
    // #region Request Processing
    const json = await request.json().catch(() => null);
    const validation = validateBody(json);
    if (!('ok' in validation) || validation.ok === false) {
      return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
    }
    const body = validation.data;

    // #region Fetch Existing Incident
    const incidentDoc = await firestore.collection('incidents').doc(body.incidentId).get();
    if (!incidentDoc.exists) {
      return NextResponse.json({ success: false, message: 'Incidente no encontrado' }, { status: 404 });
    }
    const existingIncident = incidentDoc.data();

    // #region Execute Incident Update Analysis
    const llm = await getLLMProvider();
    const updateAnalysis = await ax(IncidentUpdateProcessor).forward(llm, {
      newMessage: body.newMessage,
      newSummary: body.newSummary,
      existingIncident: JSON.stringify(existingIncident),
      messageIntent: body.messageIntent,
      messageCategories: body.messageCategories.join(', '),
    });

    if (!updateAnalysis.shouldUpdate) {
      console.log('Incident update analysis determined no update needed:', updateAnalysis.reasoning);
      return NextResponse.json({
        success: true,
        updated: false,
        reasoning: updateAnalysis.reasoning
      });
    }

    console.log('Updating incident with analysis:', {
      updateType: updateAnalysis.updateType,
      confidence: updateAnalysis.confidence,
      reasoning: updateAnalysis.reasoning
    });

    // #region Update Incident in Firestore
    const updateData: any = {
      updatedAt: admin.firestore.Timestamp.fromDate(new Date())
    };

    switch (updateAnalysis.updateType) {
      case 'modify_description':
        if (updateAnalysis.updatedDescription) {
          updateData.description = updateAnalysis.updatedDescription;
        }
        break;
      case 'add_tags':
        if (updateAnalysis.additionalTags && updateAnalysis.additionalTags.length > 0) {
          updateData.tags = [...(existingIncident?.tags || []), ...updateAnalysis.additionalTags];
        }
        break;
      case 'change_type':
        if (updateAnalysis.newType) {
          updateData.type = updateAnalysis.newType;
        }
        break;
      case 'extend_duration':
        if (updateAnalysis.extendMinutes) {
          const currentExpiry = existingIncident?.activeUntil?.toDate ? existingIncident.activeUntil.toDate() : new Date();
          const newExpiry = new Date(currentExpiry.getTime() + updateAnalysis.extendMinutes * 60_000);
          updateData.activeUntil = admin.firestore.Timestamp.fromDate(newExpiry);
        }
        break;
    }

    await firestore.collection('incidents').doc(body.incidentId).update(updateData);

    // #region Update Original Incident Message in Chat
    if (existingIncident?.chatId) {
      const messageUpdated = await updateIncidentMessageInChat(
        existingIncident.chatId,
        body.incidentId,
        {
          description: updateAnalysis.updatedDescription || existingIncident.description,
          type: updateAnalysis.newType || existingIncident.type,
          tags: existingIncident.tags || [],
          activeUntil: updateData.activeUntil || existingIncident.activeUntil,
          updatedAt: admin.firestore.Timestamp.fromDate(new Date())
        }
      );

      if (messageUpdated) {
        console.log('✅ Incident message updated in chat successfully');
      } else {
        console.log('⚠️ Could not find incident message to update in chat');
      }
    }

    // #region Update Chat ActiveIncidents Array
    if (existingIncident?.chatId && updateAnalysis.updateType !== 'no_change') {
      // First, get the current chat document to find the incident in the array
      const chatDoc = await firestore.collection('chats').doc(existingIncident.chatId).get();
      const chatData = chatDoc.data();

      if (chatData?.activeIncidents) {
        const incidentIndex = chatData.activeIncidents.findIndex(
          (inc: any) => inc.id === body.incidentId
        );

        if (incidentIndex !== -1) {
          const updatePath = `activeIncidents.${incidentIndex}`;
          const chatUpdateData: any = {
            updatedAt: admin.firestore.Timestamp.fromDate(new Date())
          };

          // Update only the fields that have new values
          if (updateData.description) {
            chatUpdateData[`${updatePath}.description`] = updateData.description;
          }
          if (updateData.type) {
            chatUpdateData[`${updatePath}.type`] = updateData.type;
          }
          if (updateData.activeUntil) {
            chatUpdateData[`${updatePath}.expiresAt`] = updateData.activeUntil;
          }

          await firestore.collection('chats').doc(existingIncident.chatId).update(chatUpdateData);
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: true,
      updateType: updateAnalysis.updateType,
      confidence: updateAnalysis.confidence,
      reasoning: updateAnalysis.reasoning
    });

  } catch (error: any) {
    console.error('Error updating incident:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Internal error' }, { status: 500 });
  }
}
// #endregion
