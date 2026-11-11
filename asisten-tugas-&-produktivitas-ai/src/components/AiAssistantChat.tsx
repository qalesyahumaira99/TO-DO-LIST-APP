import React, { useState, useRef, useEffect } from 'react';
import { TaskItem, ChatMessage } from '../types/task';
import { 
  Send, 
  Sparkles, 
  Clock, 
  Copy, 
  Check, 
  PenTool, 
  User, 
  BookMarked
} from 'lucide-react';

interface AiAssistantChatProps {
  messages: ChatMessage[];
  tasks: TaskItem[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export const AiAssistantChat: React.FC<AiAssistantChatProps> = ({
  messages,
  tasks,
  onSendMessage,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const msg = inputText.trim();
    setInputText('');
    await onSendMessage(msg);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await onSendMessage(prompt);
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderFormattedContent = (content: string) => {
    const tableRegex = /\|(.+)\|[\r\n]+\|[-:| ]+\|[\r\n]+((?:\|.+$\r?\n?)+)/m;
    const match = content.match(tableRegex);

    if (!match) {
      return (
        <div className="space-y-2 whitespace-pre-wrap leading-relaxed text-sm">
          {content.split('\n').map((line, i) => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <p key={i} className="min-h-[1.2rem]">
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} className="font-semibold text-[#2D2825]">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                })}
              </p>
            );
          })}
        </div>
      );
    }

    const beforeTable = content.slice(0, match.index);
    const tableText = match[0];
    const afterTable = content.slice((match.index || 0) + tableText.length);

    const tableLines = tableText.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const headers = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
    const dataRows = tableLines.slice(2).map(row => 
      row.split('|').slice(1, -1).map(c => c.trim())
    );

    return (
      <div className="space-y-3 text-sm leading-relaxed">
        {beforeTable && (
          <div className="space-y-1.5 whitespace-pre-wrap">
            {beforeTable.split('\n').map((line, i) => {
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <p key={i}>
                  {parts.map((p, pIdx) => 
                    p.startsWith('**') && p.endsWith('**') ? (
                      <strong key={pIdx} className="font-semibold text-[#2D2825]">{p.slice(2, -2)}</strong>
                    ) : p
                  )}
                </p>
              );
            })}
          </div>
        )}

        {/* Lined aesthetic table inside chat */}
        <div className="my-3 overflow-x-auto rounded-xl border border-[#E8DFD5] bg-[#FDFBF7] shadow-paper">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5EFEB] border-b border-[#E8DFD5] text-[#5C5047] font-bold uppercase tracking-wider">
                {headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3 border-r border-[#E8DFD5] last:border-r-0 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DF] font-sans">
              {dataRows.map((cols, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#F9F6F0] transition-colors">
                  {cols.map((col, cIdx) => {
                    const isPriority = headers[cIdx]?.toLowerCase().includes('prioritas');
                    const isStatus = headers[cIdx]?.toLowerCase().includes('status');
                    return (
                      <td key={cIdx} className="py-2.5 px-3 border-r border-[#E8DFD5] last:border-r-0 whitespace-nowrap">
                        {isPriority ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            col === 'Tinggi' ? 'bg-[#F9E6E2] text-[#9E3E34]' :
                            col === 'Sedang' ? 'bg-[#FDF2E2] text-[#8C5E28]' :
                            'bg-[#EBF2EB] text-[#3D6B42]'
                          }`}>
                            {col}
                          </span>
                        ) : isStatus ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            col === 'Selesai' 
                              ? 'bg-[#EBF2EB] text-[#3D6B42]' 
                              : 'bg-[#F0E9DF] text-[#6B5E54]'
                          }`}>
                            {col}
                          </span>
                        ) : (
                          <span className={cIdx === 1 ? 'font-medium text-[#2D2825]' : 'text-[#6B5E54]'}>
                            {col}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {afterTable && (
          <div className="space-y-1.5 whitespace-pre-wrap">
            {afterTable.split('\n').map((line, i) => {
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <p key={i}>
                  {parts.map((p, pIdx) => 
                    p.startsWith('**') && p.endsWith('**') ? (
                      <strong key={pIdx} className="font-semibold text-[#2D2825]">{p.slice(2, -2)}</strong>
                    ) : p
                  )}
                </p>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[700px] max-h-[82vh] bg-white/80 rounded-2xl border border-[#E8DFD5] shadow-paper overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#FAF7F2] border-b border-[#E8DFD5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3D352E] text-[#FAF7F2] flex items-center justify-center shadow-xs">
            <PenTool className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-editorial text-[#2D2825]">
              Asisten Jurnal & Catatan Produktif
            </h3>
            <p className="text-[11px] text-[#7A6E65]">
              Percakapan santun & ramah dalam Bahasa Indonesia
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#5C5047] bg-white px-3 py-1 rounded-lg border border-[#E2D8CC] shadow-2xs">
          <BookMarked className="w-3.5 h-3.5 text-[#8C7A6B]" />
          <span>{tasks.length} Catatan</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-notebook-dots/30">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id || index}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-[#EFE8DF] text-[#4A3E36] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#E2D8CC]">
                  <PenTool className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4.5 shadow-paper relative group ${
                  isUser
                    ? 'bg-[#3D352E] text-[#FAF7F2] rounded-tr-xs'
                    : 'bg-[#FAF7F2] border border-[#E2D8CC] text-[#2D2825] rounded-tl-xs'
                }`}
              >
                {msg.actionDetail && (
                  <div className="mb-2.5 pb-2 border-b border-[#E8DFD5] flex items-center gap-1.5 text-xs font-semibold text-[#8C7A6B]">
                    <Sparkles className="w-3.5 h-3.5 text-[#B89F82] flex-shrink-0" />
                    <span>{msg.actionDetail}</span>
                  </div>
                )}

                {isUser ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  renderFormattedContent(msg.text)
                )}

                <div className="mt-2.5 pt-1 flex items-center justify-between text-[10px] text-[#A89C91]">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.text, index)}
                      title="Salin isi pesan"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-[#2D2825] cursor-pointer"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3 h-3 text-[#4A6B5B]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-[#5C5047] text-[#FAF7F2] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-[#EFE8DF] text-[#4A3E36] flex items-center justify-center flex-shrink-0 border border-[#E2D8CC]">
              <PenTool className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#FAF7F2] border border-[#E2D8CC] rounded-2xl rounded-tl-xs p-3.5 shadow-paper flex items-center gap-2">
              <span className="text-xs text-[#6B5E54] font-medium">Asisten sedang mencatat & memperbarui agenda...</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C7A6B] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C7A6B] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C7A6B] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Aesthetic Quick Prompts */}
      <div className="px-4 py-2 bg-[#FAF7F2] border-t border-[#E8DFD5] flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
        <span className="text-[#8C7A6B] font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">
          Saran:
        </span>
        <button
          onClick={() => handleQuickPrompt('Tandai tugas nomor 1 jadi Selesai')}
          disabled={isLoading}
          className="px-3 py-1 bg-white hover:bg-[#F5EFEB] border border-[#E2D8CC] rounded-full text-[#5C5047] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          ✓ Tandai No 1 Selesai
        </button>
        <button
          onClick={() => handleQuickPrompt('Tolong catat tugas: Siapkan bahan evaluasi proyek besok jam 10 pagi')}
          disabled={isLoading}
          className="px-3 py-1 bg-white hover:bg-[#F5EFEB] border border-[#E2D8CC] rounded-full text-[#5C5047] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          + Catat Tugas Baru Besok
        </button>
        <button
          onClick={() => handleQuickPrompt('Hapus tugas nomor 6')}
          disabled={isLoading}
          className="px-3 py-1 bg-white hover:bg-rose-50 hover:text-rose-700 border border-[#E2D8CC] rounded-full text-[#5C5047] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          ✕ Hapus No 6
        </button>
        <button
          onClick={() => handleQuickPrompt('Tolong tampilkan daftar tugas saya saat ini')}
          disabled={isLoading}
          className="px-3 py-1 bg-white hover:bg-[#F5EFEB] border border-[#E2D8CC] rounded-full text-[#5C5047] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          📖 Tampilkan Buku Catatan
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-[#E8DFD5] flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tulis pesan atau instruksi catatan di sini..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-sm bg-[#FAF7F2] border border-[#E2D8CC] rounded-xl focus:outline-none focus:bg-white text-[#2D2825]"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-4 py-2.5 text-sm font-semibold text-[#FAF7F2] bg-[#3D352E] hover:bg-[#2A241F] disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-paper flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Kirim</span>
        </button>
      </form>
    </div>
  );
};
