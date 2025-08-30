import { loadGoogleCloudCredentials } from "@/lib/config/firebase-service-account";
import {
  AxAIFeatures,
  AxAIModelList,
  AxAIService,
  AxAIServiceMetrics,
  AxAIServiceOptions,
  AxChatRequest,
  AxChatResponse,
  AxEmbedRequest,
  AxEmbedResponse,
  AxLoggerData,
  AxLoggerFunction,
  AxModelConfig
} from "@ax-llm/ax";
import { GoogleGenAI } from "@google/genai";

type AxCompleteOpts = {
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
};

export class VertexAIAdapter implements AxAIService<string, undefined, string> {
  public readonly provider = "google-vertex";
  public readonly model: string;
  private readonly client: GoogleGenAI;
  private options: AxAIServiceOptions = {};
  private lastUsedModel?: string;
  private lastUsedModelConfig?: AxModelConfig;
  private readonly logger: AxLoggerFunction = (data: AxLoggerData) => {
    console.log(`[${data.name}]`, data);
  };

  constructor(opts: { model: string; project: string; location?: string }) {
    this.model = opts.model;

    // Load Google Cloud credentials (base64 or fallback to Firebase service account)
    const credentials = loadGoogleCloudCredentials();

    this.client = new GoogleGenAI({
      vertexai: true,
      project: opts.project,
      location: opts.location ?? "global",
      googleAuthOptions: {
        credentials: {
          type: credentials.type,
          project_id: credentials.project_id,
          private_key: credentials.private_key,
          client_email: credentials.client_email
        }
      }
    });
  }

  // Required AxAIService methods
  getId(): string {
    return `vertex-${this.model}`;
  }

  getName(): string {
    return "Google Vertex AI";
  }

  getFeatures(model?: string): AxAIFeatures {
    return {
      functions: false,
      streaming: false,
      functionCot: false,
      hasThinkingBudget: false,
      hasShowThoughts: false,
      multiTurn: true,
      media: {
        images: {
          supported: true,
          formats: ['image/jpeg', 'image/png', 'image/webp'],
          maxSize: 20 * 1024 * 1024, // 20MB
          detailLevels: ['low', 'high', 'auto']
        },
        audio: {
          supported: false,
          formats: [],
          maxDuration: 0
        },
        files: {
          supported: false,
          formats: [],
          maxSize: 0,
          uploadMethod: 'none'
        },
        urls: {
          supported: false,
          webSearch: false,
          contextFetching: false
        }
      },
      caching: {
        supported: false,
        types: []
      },
      thinking: false
    };
  }

  getModelList(): AxAIModelList<string> | undefined {
    return [{
      key: this.model,
      description: `Google Vertex AI ${this.model}`,
      model: this.model
    }];
  }

  getMetrics(): AxAIServiceMetrics {
    return {
      latency: {
        chat: {
          mean: 0,
          p95: 0,
          p99: 0,
          samples: []
        },
        embed: {
          mean: 0,
          p95: 0,
          p99: 0,
          samples: []
        }
      },
      errors: {
        chat: {
          count: 0,
          rate: 0,
          total: 0
        },
        embed: {
          count: 0,
          rate: 0,
          total: 0
        }
      }
    };
  }

  getLogger(): AxLoggerFunction {
    return this.logger;
  }

  getLastUsedChatModel(): string | undefined {
    return this.lastUsedModel;
  }

  getLastUsedEmbedModel(): undefined {
    return undefined; // Vertex AI doesn't support embeddings in this adapter
  }

  getLastUsedModelConfig(): AxModelConfig | undefined {
    return this.lastUsedModelConfig;
  }

  async chat(
    req: Readonly<AxChatRequest<string>>,
    options?: Readonly<AxAIServiceOptions>
  ): Promise<AxChatResponse> {
    this.lastUsedModel = req.model || this.model;
    this.lastUsedModelConfig = req.modelConfig;

    // Extract the last user message content
    const lastUserMessage = req.chatPrompt
      .filter(msg => msg.role === 'user')
      .pop();

    if (!lastUserMessage) {
      throw new Error('No user message found in chat request');
    }

    let prompt: string;
    if (typeof lastUserMessage.content === 'string') {
      prompt = lastUserMessage.content;
    } else if (Array.isArray(lastUserMessage.content)) {
      // Handle multimodal content - for now just extract text
      const textParts = lastUserMessage.content
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join(' ');
      prompt = textParts || 'No text content provided';
    } else {
      prompt = 'No content provided';
    }

    const response = await this.generate(prompt);

    const result: AxChatResponse = {
      results: [{
        index: 0,
        content: response,
        finishReason: 'stop'
      }],
      modelUsage: {
        ai: this.getName(),
        model: this.model,
        tokens: undefined // Could implement token counting if needed
      }
    };

    return result;
  }

  async embed(
    req: Readonly<AxEmbedRequest<string>>,
    options?: Readonly<AxAIServiceOptions>
  ): Promise<AxEmbedResponse> {
    throw new Error('Embedding not supported by VertexAIAdapter');
  }

  setOptions(options: Readonly<AxAIServiceOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getOptions(): Readonly<AxAIServiceOptions> {
    return this.options;
  }

  // Original generate method (kept for backward compatibility)
  async generate(text: string): Promise<string> {
    const resp = await this.client.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text }]}],
      config: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    const out = resp.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text ?? "")
      .join("") ?? "";
    return out.trim();
  }
}
