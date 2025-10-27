import { useState, useRef } from 'react';
import { Plus, Send, RefreshCw, Loader2, CheckCircle, X } from 'lucide-react';

interface Message {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
}

interface UploadStatus {
  id: string;
  filename: string;
  message: string;
  pagesExtracted: number;
  chunksCreated: number;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSubmitQuery: (query: string) => Promise<void>;
  onUploadPDF: (file: File) => Promise<{ message: string; pages_extracted: number; chunks_created: number }>;
}

export default function ChatInterface({ messages, onSubmitQuery, onUploadPDF }: ChatInterfaceProps) {
  const [query, setQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isUploading) {
      await onSubmitQuery(query);
      setQuery('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    setUploadingFile(file.name);

    try {
      const result = await onUploadPDF(file);
      
      const newStatus: UploadStatus = {
        id: Date.now().toString(),
        filename: file.name,
        message: result.message,
        pagesExtracted: result.pages_extracted,
        chunksCreated: result.chunks_created,
        timestamp: new Date(),
      };

      setUploadStatuses(prev => [...prev, newStatus]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadingFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePlusClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const removeStatus = (id: string) => {
    setUploadStatuses(prev => prev.filter(status => status.id !== id));
  };

  const formatResponse = (response: string) => {
    // Split by double newlines for paragraphs
    const paragraphs = response.split('\n\n');
    
    return paragraphs.map((paragraph, idx) => {
      if (!paragraph.trim()) return null;

      // Check if it's a numbered list item (e.g., "1. Title: description")
      const numberedMatch = paragraph.match(/^(\d+)\.\s*\*\*(.+?)\*\*:?\s*(.+)$/s);
      if (numberedMatch) {
        const [, num, title, description] = numberedMatch;
        return (
          <div key={idx} className="mb-4">
            <p className="text-white/90 leading-relaxed">
              <span className="font-semibold text-white">{num}. {title}:</span>{' '}
              {description.trim()}
            </p>
          </div>
        );
      }

      // Check for bold patterns **text**
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);
      const formattedText = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      });

      return (
        <p key={idx} className="text-white/90 leading-relaxed mb-4">
          {formattedText}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="bg-[#9A7272] p-4 flex items-center h-20 flex-shrink-0">
        <h1 className="text-white text-3xl font-bold">Smart Study Buddy</h1>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-8">
        {messages.length === 0 && uploadStatuses.length === 0 && !uploadingFile ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-white text-5xl font opacity-60" style={{ fontFamily: 'Salsa, cursive', wordSpacing: '0.5rem' }}>
                Smart Study
                <br />
                Buddy
              </h2>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto space-y-6 pb-4">
            {/* Uploading Indicator */}
            {uploadingFile && (
              <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-lg p-4 flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-blue-100 font-semibold text-lg">📄 Uploading {uploadingFile}...</p>
                  <p className="text-blue-200/80 text-sm mt-1">Processing and chunking PDF</p>
                </div>
              </div>
            )}

            {/* Upload Success Messages */}
            {uploadStatuses.map(status => (
              <div
                key={status.id}
                className="bg-green-900/30 border-2 border-green-500/50 rounded-lg p-4 flex items-start gap-3"
              >
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-100 font-semibold text-lg">📄 {status.filename}</p>
                  <p className="text-green-200/90 text-sm mt-1">{status.message}</p>
                  <div className="flex gap-6 mt-2 text-sm text-green-300/80">
                    <span>📄 Pages: {status.pagesExtracted}</span>
                    <span>📦 Chunks: {status.chunksCreated}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeStatus(status.id)}
                  className="text-green-400/70 hover:text-green-300 transition-colors p-1"
                  aria-label="Remove notification"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}

            {/* Chat Messages */}
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                {/* User Query */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 bg-[#4A4A4A] rounded-2xl px-5 py-3">
                    <p className="text-white text-[15px]">{message.query}</p>
                  </div>
                  <button 
                    className="mt-1 p-2 text-white/60 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                    title="Regenerate response"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                {/* AI Response */}
                <div className="bg-[#3A3A3A] rounded-2xl px-6 py-5">
                  <div className="text-white/90 text-[15px] leading-relaxed">
                    {formatResponse(message.response)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="p-6 flex-shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex items-center bg-[#4A4A4A] rounded-lg">
            <button
              type="button"
              onClick={handlePlusClick}
              disabled={isUploading}
              className={`absolute left-4 transition-colors ${
                isUploading 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-white hover:text-gray-300'
              }`}
            >
              {isUploading ? (
                <Loader2 size={20} className="animate-spin text-blue-400" />
              ) : (
                <Plus size={20} />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
              disabled={isUploading}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your query here"
              disabled={isUploading}
              className={`flex-1 bg-transparent text-white placeholder-gray-400 px-20 py-4 focus:outline-none ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <button
              type="submit"
              disabled={!query.trim() || isUploading}
              className={`absolute right-4 p-2 rounded transition-colors ${
                !query.trim() || isUploading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-[#9A7272] text-white hover:bg-[#8A6262]'
              }`}
            >
              {isUploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}