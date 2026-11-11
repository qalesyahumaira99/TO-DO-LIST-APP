import React from 'react';
import { TaskItem } from '../types/task';
import { 
  Pin, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Sparkles,
  Zap,
  Coffee,
  Clock
} from 'lucide-react';

interface EisenhowerMatrixProps {
  tasks: TaskItem[];
  onToggleStatus: (id: string) => void;
  onEditTask: (task: TaskItem) => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onToggleStatus,
  onEditTask,
}) => {
  const q1Tasks = tasks.filter((t) => {
    if (t.prioritas === 'Tinggi') {
      const isImmediate = /hari ini|besok|segera|jam|urgent/i.test(t.batasWaktu.toLowerCase());
      return isImmediate;
    }
    return false;
  });

  const q2Tasks = tasks.filter((t) => {
    if (t.prioritas === 'Tinggi' && !q1Tasks.includes(t)) return true;
    if (t.prioritas === 'Sedang' && (t.kategori === 'Kesehatan' || t.kategori === 'Belajar' || t.kategori === 'Pekerjaan')) {
      return true;
    }
    return false;
  });

  const q3Tasks = tasks.filter((t) => {
    if (t.prioritas === 'Sedang' && !q2Tasks.includes(t)) return true;
    return false;
  });

  const q4Tasks = tasks.filter((t) => {
    return t.prioritas === 'Rendah' || (!q1Tasks.includes(t) && !q2Tasks.includes(t) && !q3Tasks.includes(t));
  });

  const renderPinSection = (
    title: string,
    subtitle: string,
    strategy: string,
    paperColor: string,
    borderColor: string,
    tagColor: string,
    quadrantTasks: TaskItem[]
  ) => {
    return (
      <div className={`rounded-2xl p-5 border ${borderColor} ${paperColor} shadow-paper flex flex-col h-full`}>
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-[#8C7A6B] -rotate-45" />
            <div>
              <h4 className="text-sm font-bold font-editorial text-[#2D2825]">{title}</h4>
              <p className="text-xs text-[#7A6E65]">{subtitle}</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${tagColor}`}>
            {quadrantTasks.length} Catatan
          </span>
        </div>

        {/* Strategy pill */}
        <div className="my-2.5 px-3 py-1.5 rounded-lg bg-black/5 text-[11px] font-medium text-[#5C5047] flex items-center justify-between">
          <span>Rencana: <strong className="font-semibold text-[#2D2825]">{strategy}</strong></span>
        </div>

        {/* Task list */}
        <div className="flex-1 space-y-2.5 overflow-y-auto max-h-72 pr-1 mt-1">
          {quadrantTasks.length === 0 ? (
            <p className="text-xs text-[#A89C91] italic py-6 text-center font-handwriting text-base">
              Belum ada catatan di papan ini.
            </p>
          ) : (
            quadrantTasks.map((task) => {
              const isDone = task.status === 'Selesai';
              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border bg-white/80 transition-all text-xs flex items-center justify-between gap-2 shadow-2xs ${
                    isDone 
                      ? 'border-[#E2D8CC] opacity-60' 
                      : 'border-[#E2D8CC] hover:border-[#8C7A6B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => onToggleStatus(task.id)}
                      className="cursor-pointer text-[#8C7A6B] hover:text-[#4A6B5B] flex-shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#4A6B5B] fill-[#EBF2EB]" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#B8AAA0]" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${isDone ? 'line-through text-[#8C7A6B]' : 'text-[#2D2825]'}`}>
                        {task.nama}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#7A6E65] mt-0.5">
                        <span className="font-semibold text-[#8C7A6B]">{task.kategori}</span>
                        <span>•</span>
                        <span>{task.batasWaktu}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onEditTask(task)}
                    className="text-[#7A6E65] hover:text-[#2D2825] text-[11px] px-2 py-0.5 rounded hover:bg-black/5 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Intro Pinboard Banner */}
      <div className="bg-[#FAF7F2] border border-[#E8DFD5] p-5 rounded-2xl shadow-paper">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Pin className="w-5 h-5 text-[#8C7A6B]" />
            <h3 className="text-base font-bold font-editorial text-[#2D2825]">
              Papan Mading Fokus (Matriks Catatan Prioritas)
            </h3>
          </div>
          <span className="font-handwriting text-base text-[#8C7A6B]">
            ~ atur skala urgensi
          </span>
        </div>
        <p className="text-xs text-[#7A6E65] mt-1 max-w-2xl leading-relaxed">
          Mengelompokkan catatan tugas Anda ke dalam 4 papan fokus untuk memudahkan pengambilan keputusan dan menjaga ketenangan pikiran.
        </p>
      </div>

      {/* Grid of 4 aesthetic memo boards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderPinSection(
          'Papan 1: Mendesak & Penting',
          'Selesaikan Hari Ini',
          'Tuntaskan segera tanpa menunda',
          'bg-[#FDF6F4]',
          'border-[#EED7D2]',
          'bg-[#F5E5E1] text-[#9E3E34]',
          q1Tasks
        )}

        {renderPinSection(
          'Papan 2: Penting tapi Tidak Mendesak',
          'Jadwalkan di Kalender',
          'Alokasikan waktu fokus jangka panjang',
          'bg-[#F9F7F2]',
          'border-[#E2D8CC]',
          'bg-[#EAE4DC] text-[#4A3E36]',
          q2Tasks
        )}

        {renderPinSection(
          'Papan 3: Mendesak tapi Ringan',
          'Delegasi / Otomatisasi',
          'Selesaikan cepat atau delegasikan',
          'bg-[#FAF6EE]',
          'border-[#E6DEC8]',
          'bg-[#EFE8D6] text-[#8C5E28]',
          q3Tasks
        )}

        {renderPinSection(
          'Papan 4: Santai & Fleksibel',
          'Waktu Luang',
          'Kerjakan santai saat senggang',
          'bg-[#F5F8F4]',
          'border-[#D6E3D3]',
          'bg-[#E3EDE1] text-[#3D6B42]',
          q4Tasks
        )}
      </div>
    </div>
  );
};
