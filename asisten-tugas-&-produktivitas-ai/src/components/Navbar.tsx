import React from 'react';
import { 
  PenTool, 
  BookOpen, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Plus, 
  LayoutGrid, 
  MessageSquare,
  FileSpreadsheet,
  Check,
  CalendarDays
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'notes' | 'journal' | 'chat' | 'pinboard';
  setActiveTab: (tab: 'notes' | 'journal' | 'chat' | 'pinboard') => void;
  onResetTasks: () => void;
  onCopyMarkdown: () => void;
  onOpenNewTaskModal: () => void;
  copied: boolean;
  totalTasks: number;
  completedTasks: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onResetTasks,
  onCopyMarkdown,
  onOpenNewTaskModal,
  copied,
  totalTasks,
  completedTasks,
}) => {
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8DFD5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20 gap-4">
          {/* Brand / Notebook Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#3D352E] text-[#FAF7F2] flex items-center justify-center shadow-paper border border-[#4E443B]">
              <PenTool className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-editorial text-[#2D2825] tracking-tight">
                  Catatan Harian & Tugas
                </h1>
                <span className="hidden sm:inline-block font-handwriting text-base text-[#8C7A6B] -rotate-2">
                  ~ asisten cerdas
                </span>
              </div>
              <p className="text-xs text-[#7A6E65] font-sans">
                Agenda produktif terorganisasi rapi dalam format catatan
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Aesthetic Progress Snippet */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F0E9DF] border border-[#E2D8CC] text-xs text-[#5C5248]">
              <span className="font-medium">Selesai:</span>
              <span className="font-semibold text-[#2D2825]">{completedTasks}/{totalTasks}</span>
              <span className="text-[#8C7A6B]">({percentage}%)</span>
            </div>

            {/* Reset to Default */}
            <button
              onClick={onResetTasks}
              title="Kembalikan ke daftar 6 tugas awal"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#6B5E54] hover:text-[#2D2825] bg-white/70 hover:bg-white border border-[#E2D8CC] rounded-lg transition-colors cursor-pointer shadow-paper"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Awal</span>
            </button>

            {/* Copy Markdown Table */}
            <button
              onClick={onCopyMarkdown}
              title="Salin tabel format Markdown"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A3E36] hover:text-[#2D2825] bg-white/70 hover:bg-white border border-[#E2D8CC] hover:border-[#C4B5A5] rounded-lg transition-all cursor-pointer shadow-paper"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#5B7065]" />
                  <span className="text-[#5B7065] font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salin Tabel Markdown</span>
                </>
              )}
            </button>

            {/* Add Note Button */}
            <button
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-[#FAF7F2] bg-[#3D352E] hover:bg-[#2A241F] active:bg-[#1E1915] rounded-lg shadow-paper transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
              <span>Tulis Catatan</span>
            </button>
          </div>
        </div>

        {/* Notebook Mode Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 border-t border-[#E8DFD5] scrollbar-none text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-[#3D352E] text-[#FAF7F2] font-semibold shadow-xs'
                : 'text-[#6B5E54] hover:text-[#2D2825] hover:bg-[#EFE8DF]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kartu Catatan & Memo</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'notes' ? 'bg-[#554B42] text-[#FAF7F2]' : 'bg-[#E5DBD0] text-[#5C5248]'
            }`}>
              {totalTasks}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-[#3D352E] text-[#FAF7F2] font-semibold shadow-xs'
                : 'text-[#6B5E54] hover:text-[#2D2825] hover:bg-[#EFE8DF]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Buku Jurnal / Tabel Markdown</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[#3D352E] text-[#FAF7F2] font-semibold shadow-xs'
                : 'text-[#6B5E54] hover:text-[#2D2825] hover:bg-[#EFE8DF]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Asisten Catatan</span>
          </button>

          <button
            onClick={() => setActiveTab('pinboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'pinboard'
                ? 'bg-[#3D352E] text-[#FAF7F2] font-semibold shadow-xs'
                : 'text-[#6B5E54] hover:text-[#2D2825] hover:bg-[#EFE8DF]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Papan Mading / Matriks Prioritas</span>
          </button>
        </div>
      </div>
    </header>
  );
};
