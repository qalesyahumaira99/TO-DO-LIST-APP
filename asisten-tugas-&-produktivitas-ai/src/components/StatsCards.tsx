import React from 'react';
import { TaskItem } from '../types/task';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  FolderHeart,
  Sparkles,
  Calendar
} from 'lucide-react';

interface StatsCardsProps {
  tasks: TaskItem[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Selesai').length;
  const pending = total - completed;
  const highPriority = tasks.filter((t) => t.prioritas === 'Tinggi' && t.status === 'Belum Selesai').length;

  const todayDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="mb-6 bg-white/60 border border-[#E8DFD5] rounded-2xl p-5 shadow-paper">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EFE8DF] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C7A6B] font-medium uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-[#A39282]" />
            <span>{todayDate}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-editorial text-[#2D2825] mt-1">
            Agenda & Rencana Hari Ini
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <p className="font-handwriting text-lg text-[#6B5E54] bg-[#F5EFEB] px-3.5 py-1 rounded-xl border border-[#E8DFD5] -rotate-1">
            ✏️ &ldquo;Satu catatan, satu langkah produktif.&rdquo;
          </p>
        </div>
      </div>

      {/* Aesthetic Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE1D7]">
          <span className="text-[#8C7A6B] block font-medium">Catatan Aktif</span>
          <span className="text-2xl font-bold font-editorial text-[#2D2825]">{pending}</span>
          <span className="text-[#A39282] block mt-0.5">dari {total} agenda</span>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE1D7]">
          <span className="text-[#8C7A6B] block font-medium">Terselesaikan</span>
          <span className="text-2xl font-bold font-editorial text-[#4A6B5B]">{completed}</span>
          <span className="text-[#4A6B5B] block mt-0.5">
            {total > 0 ? Math.round((completed / total) * 100) : 0}% tercapai
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE1D7]">
          <span className="text-[#8C7A6B] block font-medium">Prioritas Tinggi</span>
          <span className="text-2xl font-bold font-editorial text-[#9E4D43]">{highPriority}</span>
          <span className="text-[#9E4D43] block mt-0.5">perlu fokus utama</span>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE1D7]">
          <span className="text-[#8C7A6B] block font-medium">Buku Catatan</span>
          <span className="text-sm font-bold text-[#2D2825] block mt-1">Format Markdown</span>
          <span className="text-[#8C7A6B] block text-[11px] mt-0.5">Tersusun otomatis</span>
        </div>
      </div>
    </div>
  );
};
