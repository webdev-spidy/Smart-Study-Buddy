import { Plus, MessageSquare } from 'lucide-react';
import botLogo from "../assets/bot-removebg-preview.png";
interface Message {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
}

interface SidebarProps {
  onNewChat: () => void;
  chatHistory: Message[];
}

export default function Sidebar({ onNewChat, chatHistory }: SidebarProps) {
  return (
    <div className="w-[210px] bg-[#9A7272] flex flex-col">
    <div className="flex flex-col items-center mt-6">
        <img
          src={botLogo}
          alt="Smart Study Buddy Logo"
          className="w-[130px] h-[75px] rounded-lg"
        />
      </div>

      <div className="px-3 py-4">
        <button
          onClick={onNewChat}
          className="w-full bg-black text-white px-4 py-2 rounded-full flex items-center justify-center gap-2 text-sm hover:bg-gray-900 transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="px-3 mt-4">
        <h2 className="text-white text-xs uppercase mb-3">History</h2>
        {chatHistory.length === 0 ? (
          <p className="text-white text-xs opacity-60">No previous chat saved</p>
        ) : (
          <div className="space-y-2">
            {chatHistory.map((message) => (
              <button
                key={message.id}
                className="w-full text-left text-white text-xs py-2 px-2 rounded hover:bg-[#8A6262] transition-colors flex items-center gap-2"
              >
                <MessageSquare size={14} />
                <span className="truncate">{message.query}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
