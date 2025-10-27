import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

interface Message {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
}

interface Summary {
  file: string;
  summary: string;
  pages?: number[];
}

interface SearchResult {
  file: string;
  page: number;
  relevance_score: number;
  preview_summary: string;
}

interface SerpResult {
  title: string;
  link: string;
  snippet?: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [_currentQuery, setCurrentQuery] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Create a new chat session when app loads
  useEffect(() => {
    createNewSession();
  }, []);

  const createNewSession = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/new_chat/', {
        method: 'POST',
      });
      const data = await response.json();
      setSessionId(data.session_id);
      console.log('New session created:', data.session_id);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleSubmitQuery = async (query: string) => {
    if (!sessionId) {
      console.error('No session ID available');
      return;
    }

    setCurrentQuery(query);

    try {
      const response = await fetch('http://localhost:8000/api/query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: query,
          session_id: sessionId 
        }),
      });

      const data = await response.json();

      // Handle different response types from your backend
      let responseText = '';
      
      if (data.type === 'full_pdf_summary') {
        responseText = data.summaries.map((s: Summary) => 
          `**${s.file}**\n\n${s.summary}`
        ).join('\n\n---\n\n');
      } else if (data.type === 'page_summary') {
        responseText = data.summaries.map((s: Summary) => 
          `**${s.file} - Pages ${s.pages?.join(', ')}**\n\n${s.summary}`
        ).join('\n\n---\n\n');
      } else if (data.type === 'concept_search') {
        responseText = `**Expert Summary:**\n${data.expert_summary}\n\n**Core Keyword:** ${data.core_keyword}\n\n**Relevant Results:**\n\n`;
        responseText += data.results.map((r: SearchResult, idx: number) => 
          `${idx + 1}. **${r.file} - Page ${r.page}** (Relevance: ${r.relevance_score})\n${r.preview_summary}`
        ).join('\n\n');
      } else if (data.type === 'serp_fallback') {
        responseText = `**Expert Summary:**\n${data.expert_summary}\n\n**Core Keyword:** ${data.core_keyword}\n\n**Web Results:**\n\n`;
        responseText += data.serp_results?.map((r: SerpResult, idx: number) => 
          `${idx + 1}. [${r.title}](${r.link})\n${r.snippet || ''}`
        ).join('\n\n') || 'No results found.';
      } else if (data.type === 'error') {
        responseText = data.response;
      } else {
        responseText = data.response || JSON.stringify(data);
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        query: query,
        response: responseText,
        timestamp: new Date(),
      };

      setMessages([...messages, newMessage]);
    } catch (error) {
      console.error('Error submitting query:', error);
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        query: query,
        response: '⚠️ An error occurred while processing your query. Please try again.',
        timestamp: new Date(),
      };
      setMessages([...messages, errorMessage]);
    }
  };

  const handleNewChat = async () => {
    setMessages([]);
    setCurrentQuery('');
    await createNewSession(); // Create new session for new chat
  };

  const handleUploadPDF = async (file: File): Promise<{ message: string; pages_extracted: number; chunks_created: number }> => {
    if (!sessionId) {
      throw new Error('No session ID available');
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('session_id', sessionId);

    try {
      const response = await fetch('http://localhost:8000/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return {
        message: data.message,
        pages_extracted: data.pages_extracted,
        chunks_created: data.chunks_created,
      };
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#2B2B2B]">
      <Sidebar
        onNewChat={handleNewChat}
        chatHistory={messages}
      />
      <ChatInterface
        messages={messages}
        onSubmitQuery={handleSubmitQuery}
        onUploadPDF={handleUploadPDF}
      />
    </div>
  );
}

export default App;