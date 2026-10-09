/**
 * L2 Local Model Runtime Probe & Inference Engine
 * Discovers and connects to local inference servers (Ollama, LM Studio) on loopback.
 * Strictly ZERO hardcoded model names or canned responses.
 * Why: C5 & §5.4b. Local-only inference protects privacy; runtime discovery adapts to any user's machine.
 */

import { RuntimeProbeResult, Message, Item, IdentityProfile } from '../types/schema';
import { AppConfig } from '../config';

export class ModelRuntime {
  private static instance: ModelRuntime;
  private currentStatus: RuntimeProbeResult = {
    engineType: 'none',
    endpoint: '',
    availableModels: [],
    isOnline: false,
  };

  private constructor() {}

  public static getInstance(): ModelRuntime {
    if (!ModelRuntime.instance) {
      ModelRuntime.instance = new ModelRuntime();
    }
    return ModelRuntime.instance;
  }

  /**
   * Probes localhost loopback endpoints for Ollama (11434) and LM Studio (1234)
   * Why: ZERO hardcoded model names; queries what the user's local machine actually has installed.
   */
  public async probeRuntime(timeoutMs = 1500): Promise<RuntimeProbeResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // 1. Try Ollama on 127.0.0.1:11434
    try {
      const ollamaRes = await fetch('http://127.0.0.1:11434/api/tags', {
        signal: controller.signal,
      });

      if (ollamaRes.ok) {
        clearTimeout(timer);
        const data = await ollamaRes.json();
        const models = (data.models || []).map((m: { name: string; size?: number }) => ({
          name: m.name,
          sizeBytes: m.size,
        }));

        this.currentStatus = {
          engineType: 'ollama',
          endpoint: 'http://127.0.0.1:11434',
          availableModels: models,
          activeModel: models[0]?.name,
          isOnline: true,
        };
        return this.currentStatus;
      }
    } catch {
      // Ollama not reachable, proceed to LM Studio
    }

    // 2. Try LM Studio on 127.0.0.1:1234
    try {
      const lmRes = await fetch('http://127.0.0.1:1234/v1/models', {
        signal: controller.signal,
      });

      if (lmRes.ok) {
        clearTimeout(timer);
        const data = await lmRes.json();
        const models = (data.data || []).map((m: { id: string }) => ({
          name: m.id,
        }));

        this.currentStatus = {
          engineType: 'lmstudio',
          endpoint: 'http://127.0.0.1:1234',
          availableModels: models,
          activeModel: models[0]?.name,
          isOnline: true,
        };
        return this.currentStatus;
      }
    } catch {
      // LM Studio not reachable
    } finally {
      clearTimeout(timer);
    }

    // 3. Fallback: No local model server running
    this.currentStatus = {
      engineType: 'none',
      endpoint: '',
      availableModels: [],
      isOnline: false,
    };
    return this.currentStatus;
  }

  public getStatus(): RuntimeProbeResult {
    return this.currentStatus;
  }

  public setActiveModel(modelName: string): void {
    if (this.currentStatus.availableModels.some(m => m.name === modelName)) {
      this.currentStatus.activeModel = modelName;
    }
  }

  /**
   * Constructs dynamic extraction prompt composed at runtime from schema + live context
   * Why: Prime Directive 1. Zero baked-in canned chat text or mock examples.
   */
  private buildExtractionPrompt(
    messages: Message[],
    profile: IdentityProfile,
    referenceNow: Date
  ): string {
    const formattedMessages = messages.map(m => 
      `[${m.id}] (${m.ts}) ${m.sender}: ${m.text}`
    ).join('\n');

    return `You are a factual conversation triage assistant.
Current Date/Time: ${referenceNow.toISOString()}
User Timezone: ${profile.timezone}
User Display Names/Aliases: ${profile.names.join(', ')} (Handles: ${profile.handles.join(', ')})

Analyze the following chat messages and extract key items.
IMPORTANT REQUIREMENTS:
1. Every item MUST cite an exact verbatim quote from the text and its message ID.
2. Return strictly valid JSON matching the schema below. Do not wrap in markdown or commentary.

SCHEMA:
{
  "summary": "1-3 sentence overview of what happened",
  "items": [
    {
      "kind": "action_item" | "decision" | "deadline" | "important_message" | "question_for_user",
      "title": "Short title",
      "detail": "Description",
      "owner": "Person responsible or null",
      "rawPhrase": "Verbatim quote",
      "messageId": "Message ID where quote appears",
      "dueIso": "ISO8601 date if deadline, or null"
    }
  ]
}

MESSAGES:
${formattedMessages}
`;
  }

  /**
   * Attempts structured extraction via local model with JSON repair and fallback
   * Why: Graceful degradation (Prime Directive 7 & Edge Case E5)
   */
  public async extractWithLocalModel(
    messages: Message[],
    profile: IdentityProfile,
    config: AppConfig,
    referenceNow = new Date()
  ): Promise<{ items: Item[]; summary?: string; error?: string } | null> {
    if (!this.currentStatus.isOnline || !this.currentStatus.activeModel) {
      return null; // Gracefully signal caller to rely on L1 deterministic layer
    }

    const prompt = this.buildExtractionPrompt(messages, profile, referenceNow);

    try {
      let rawResponseText = '';

      if (this.currentStatus.engineType === 'ollama') {
        const res = await fetch(`${this.currentStatus.endpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.currentStatus.activeModel,
            prompt,
            stream: false,
            format: 'json',
          }),
        });
        if (!res.ok) throw new Error(`Ollama error HTTP ${res.status}`);
        const data = await res.json();
        rawResponseText = data.response;
      } else if (this.currentStatus.engineType === 'lmstudio') {
        const res = await fetch(`${this.currentStatus.endpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.currentStatus.activeModel,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        });
        if (!res.ok) throw new Error(`LM Studio error HTTP ${res.status}`);
        const data = await res.json();
        rawResponseText = data.choices?.[0]?.message?.content || '';
      }

      // Parse and repair JSON if needed (Edge Case E5)
      const cleanJson = rawResponseText.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
      const parsed = JSON.parse(cleanJson);

      const items: Item[] = [];
      if (Array.isArray(parsed.items)) {
        for (const rawItem of parsed.items) {
          if (!rawItem.title || !rawItem.messageId || !rawItem.rawPhrase) continue;

          items.push({
            id: `llm_${rawItem.messageId}_${Math.random().toString(36).substring(2, 7)}`,
            kind: rawItem.kind || 'important_message',
            title: rawItem.title,
            detail: rawItem.detail || rawItem.title,
            owner: rawItem.owner || undefined,
            status: 'open',
            evidence: [{ messageId: rawItem.messageId, quote: rawItem.rawPhrase }],
            due: rawItem.dueIso ? {
              iso: rawItem.dueIso,
              confidence: 0.9,
              rawPhrase: rawItem.rawPhrase,
            } : undefined,
            signals: [
              {
                name: 'imperativeAction',
                value: 0.8,
                weight: config.weights.imperativeAction,
                source: 'llm',
                description: 'Extracted by local LLM analysis',
              },
            ],
            urgency: {
              score: 0.6,
              level: 'normal',
              explanation: 'Identified by local model',
            },
            relevanceToMe: {
              score: 0.6,
              explanation: 'Identified from chat context',
            },
            createdFrom: {
              engine: 'llm',
              modelId: this.currentStatus.activeModel,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      return {
        items,
        summary: parsed.summary,
      };
    } catch (err: unknown) {
      console.warn('Local model extraction failed, falling back to L1 rules:', err);
      return {
        items: [],
        error: err instanceof Error ? err.message : 'Local model request failed',
      };
    }
  }
}

export const modelRuntime = ModelRuntime.getInstance();
