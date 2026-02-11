'use client';

import type { ChatMessage } from '@/types/workspace';
import SystemAnalysisCard from './SystemAnalysisCard';

interface MessageBubbleProps {
  message: ChatMessage;
  sessionId: string;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, sessionId }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3`}>
      <div
        className={`
          max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed
          ${isUser
            ? 'bg-[#FF00FF]/15 border border-[#FF00FF]/30 text-gray-100'
            : 'bg-[#1E293B] border border-[#2D3B4F] text-gray-300'
          }
        `}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{renderMarkdownBold(message.content)}</p>
            {message.analysis && (
              <SystemAnalysisCard analysis={message.analysis} sessionId={sessionId} />
            )}
          </>
        )}
      </div>
      <span className="text-[10px] text-gray-600 mt-1 px-1 font-mono">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}

function renderMarkdownBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
