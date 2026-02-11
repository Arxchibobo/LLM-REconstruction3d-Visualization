import { NextResponse } from 'next/server';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
  type ContentBlock,
} from '@aws-sdk/client-bedrock-runtime';

const BEDROCK_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';
const BEDROCK_MODEL = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';

interface ChatRequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[];
  sessionContext: {
    name: string;
    status: string;
    modules: { name: string; type: string; description: string }[];
  };
}

function buildSystemPrompt(ctx: ChatRequestBody['sessionContext']): string {
  const moduleList = ctx.modules.length > 0
    ? ctx.modules
        .map((m) => `  - [${m.type}] ${m.name}: ${m.description}`)
        .join('\n')
    : '  (none yet)';

  return `You are an AI assistant embedded in a Claude Code workspace session manager.

Current session: "${ctx.name}" (status: ${ctx.status})

Modules attached to this session:
${moduleList}

Module types reference:
- skill: Automated tasks and workflows (e.g., commit, code-review, testing)
- mcp: Model Context Protocol servers for external data access (e.g., Playwright, Bytebase)
- plugin: Extensions and integrations
- hook: Event-driven automation triggers (pre/post tool execution)
- rule: Configuration rules and coding policies
- agent: AI agent definitions for specialized tasks
- memory: Learning files, history, and context persistence

Your role:
1. Help the user understand what their session can accomplish with the current modules
2. Answer questions about the user's requirements and suggest how modules can help
3. If the user describes a task, explain which modules are relevant and why
4. Be concise and technical
5. If the user writes in Chinese, respond in Chinese. If in English, respond in English.
6. Keep responses under 300 words unless the user asks for details.`;
}

export async function POST(request: Request) {
  try {
    const body: ChatRequestBody = await request.json();

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const client = new BedrockRuntimeClient({ region: BEDROCK_REGION });

    const systemPrompt = buildSystemPrompt(body.sessionContext);

    // Convert messages to Bedrock Converse format
    const converseMessages: Message[] = body.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: [{ text: msg.content } as ContentBlock],
    }));

    const command = new ConverseCommand({
      modelId: BEDROCK_MODEL,
      system: [{ text: systemPrompt }],
      messages: converseMessages,
      inferenceConfig: {
        maxTokens: 1024,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const response = await client.send(command);

    const outputText =
      response.output?.message?.content?.[0]?.text || 'No response generated.';

    return NextResponse.json({ content: outputText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/chat] Bedrock error:', message);
    return NextResponse.json(
      { error: `Bedrock API failed: ${message}` },
      { status: 500 },
    );
  }
}
