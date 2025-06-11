import React from 'react';
import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';

const ChatView: React.FC = () => {
  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AnimatedAIChat />
    </div>
  );
};

export default ChatView;
