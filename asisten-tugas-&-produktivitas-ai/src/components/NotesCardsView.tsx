import React, { useState } from 'react';
import { TaskItem, PriorityLevel, TaskStatus } from '../types/task';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Search, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Pin,
  Bookmark,
  Calendar,
  Layers,
  Check,
  PenTool
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NotesCardsViewProps {
  tasks: TaskItem[];
  onToggleStatus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: TaskItem) => void;
  onQuickAdd: (input: string) => Promise<void>;
  onOpenNewTaskModal: () => void;
  onUpdateSubtasks: (taskId: string, subtasks: { id: string; text: string; done: boolean }[]) => void;
}

export const NotesCardsView: React.FC<NotesCardsViewProps> = ({
  tasks,
  onToggleStatus,
  onDeleteTask,
  onEditTask,
  onQuickAdd,
  onOpenNewTaskModal,
  onUpdateSubtasks,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [isParsingQuick, setIsParsingQuick] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [generatingSubtasksFor, setGeneratingSubtasksFor] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState<{ [key: string]: string }>({});

  const handleToggle = (id: string, currentStatus: TaskStatus) => {
    if (currentStatus === 'Belum Selesai') {
      try {
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // safe ignore
      }
    }
    onToggleStatus(id);
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    setIsParsingQuick(true);
    try {
      await onQuickAdd(quickInput.trim());
      setQuickInput('');
    } finally {
      setIsParsingQuick(false);
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedTaskIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedTaskIds(next);
  };

  // Generate subtasks via AI
  const handleAiSuggestSubtasks = async (task: TaskItem) => {
    setGeneratingSubtasksFor(task.id);
    try {
      const res = await fetch('/api/suggest-subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName: task.nama, category: task.kategori }),
      });
      const data = await res.json();
      if (Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        const currentSubs = task.subtasks || [];
        const newSubs = data.subtasks.map((txt: string, idx: number) => ({
          id: `sub-${Date.now()}-${idx}`,
          text: txt,
          done: false,
        }));
        onUpdateSubtasks(task.id, [...currentSubs, ...newSubs]);
        const next = new Set(expandedTaskIds);
        next.add(task.id);
        setExpandedTaskIds(next);
      }
    } catch (err) {
      console.error('Error suggesting subtasks:', err);
    } finally {
      setGeneratingSubtasksFor(null);
    }
  };

  const handleAddManualSubtask = (taskId: string) => {
    const text = (newSubtaskText[taskId] || '').trim();
    if (!text) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentSubs = task.subtasks || [];
    const updated = [
      ...currentSubs,
      { id: `sub-${Date.now()}`, text, done: false },
    ];
    onUpdateSubtasks(taskId, updated);
    setNewSubtaskText((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;
    const updated = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, done: !s.done } : s
    );
    onUpdateSubtasks(taskId, updated);
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;
    const updated = task.subtasks.filter((s) => s.id !== subtaskId);
    onUpdateSubtasks(taskId, updated);
  };

  // Distinct categories
  const categories = Array.from(new Set(tasks.map((t) => t.kategori)));

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.deskripsi && t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.kategori.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'Semua' || t.kategori === selectedCategory;
    const matchesStatus = selectedStatus === 'Semua' || t.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Aesthetic color tints for notes
  const getNotePaperStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pekerjaan':
        return {
          cardBg: 'bg-[#F9F7F2]',
          tagBg: 'bg-[#EAE4DC] text-[#4A3E36]',
          border: 'border-[#E2D8CC]',
        };
      case 'keuangan':
        return {
          cardBg: 'bg-[#FAF6EE]',
          tagBg: 'bg-[#EFE8D6] text-[#5C5035]',
          border: 'border-[#E6DEC8]',
        };
      case 'pribadi':
        return {
          cardBg: 'bg-[#FDF6F4]',
          tagBg: 'bg-[#F5E5E1] text-[#6E4239]',
          border: 'border-[#EED7D2]',
        };
      case 'kesehatan':
        return {
          cardBg: 'bg-[#F5F8F4]',
          tagBg: 'bg-[#E3EDE1] text-[#3E5C39]',
          border: 'border-[#D6E3D3]',
        };
      case 'belajar':
        return {
          cardBg: 'bg-[#F5F7FA]',
          tagBg: 'bg-[#E2E8F0] text-[#3D4C5E]',
          border: 'border-[#D3DEEA]',
        };
      default:
        return {
          cardBg: 'bg-[#FAF8F5]',
          tagBg: 'bg-[#ECE5DD] text-[#50443B]',
          border: 'border-[#E5DDD4]',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Aesthetic Quick Scratchpad */}
      <div className="bg-white/80 border border-[#E8DFD5] rounded-2xl p-5 shadow-paper">
        <form onSubmit={handleQuickAddSubmit} className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C7A6B]">
            <PenTool className="w-3.5 h-3.5 text-[#8C7A6B]" />
            <span>Coretan Cepat / Quick Scratchpad</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Tulis catatan atau tugas di sini... (contoh: 'Beli kopi & susu almond besok jam 9 pagi')"
              className="flex-1 px-4 py-3 bg-[#FAF7F2] border border-[#E2D8CC] rounded-xl text-sm placeholder:text-[#A89C91] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B] focus:bg-white transition-all shadow-inner"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isParsingQuick || !quickInput.trim()}
                className="px-4 py-3 bg-[#3D352E] hover:bg-[#2A241F] text-[#FAF7F2] text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-paper whitespace-nowrap"
              >
                {isParsingQuick ? 'Mencatat...' : 'Simpan ke Catatan'}
              </button>
              <button
                type="button"
                onClick={onOpenNewTaskModal}
                className="px-3.5 py-3 bg-white hover:bg-[#F5EFEB] border border-[#E2D8CC] text-[#4A3E36] text-xs font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-paper"
              >
                + Lembar Detail
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Aesthetic Filter Bookmark Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/50 p-3 rounded-xl border border-[#E8DFD5]">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#A89C91]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari catatan atau memo..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E2D8CC] rounded-lg focus:outline-none focus:bg-white text-[#2D2825]"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('Semua')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'Semua'
                ? 'bg-[#3D352E] text-[#FAF7F2] font-semibold'
                : 'text-[#6B5E54] hover:bg-[#EFE8DF]'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#3D352E] text-[#FAF7F2] font-semibold'
                  : 'text-[#6B5E54] hover:bg-[#EFE8DF]'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="text-[#D8CEC4] mx-1">|</span>
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'Belum Selesai' ? 'Semua' : 'Belum Selesai')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedStatus === 'Belum Selesai'
                ? 'bg-[#A35D4C] text-white font-semibold'
                : 'text-[#6B5E54] hover:bg-[#EFE8DF]'
            }`}
          >
            Belum Selesai
          </button>
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'Selesai' ? 'Semua' : 'Selesai')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedStatus === 'Selesai'
                ? 'bg-[#4A6B5B] text-white font-semibold'
                : 'text-[#6B5E54] hover:bg-[#EFE8DF]'
            }`}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Aesthetic Notes / Memo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#8C7A6B] bg-white/40 border border-[#E8DFD5] rounded-2xl">
            <p className="font-editorial text-lg text-[#4A3E36]">Tidak ada catatan yang sesuai.</p>
            <p className="text-xs text-[#A89C91] mt-1">Coba sesuaikan kata kunci pencarian atau ganti kategori.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'Selesai';
            const isExpanded = expandedTaskIds.has(task.id);
            const style = getNotePaperStyle(task.kategori);
            const subtasksCount = task.subtasks?.length || 0;
            const completedSubtasks = task.subtasks?.filter((s) => s.done).length || 0;

            return (
              <div
                key={task.id}
                className={`group relative rounded-2xl p-5 border ${style.border} ${style.cardBg} transition-all duration-200 hover:-translate-y-0.5 shadow-paper hover:shadow-paper-hover flex flex-col justify-between ${
                  isDone ? 'opacity-65' : ''
                }`}
              >
                {/* Top Pin / Category and Priority badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${style.tagBg}`}>
                      {task.kategori}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        task.prioritas === 'Tinggi'
                          ? 'bg-[#F9E6E2] text-[#9E3E34]'
                          : task.prioritas === 'Sedang'
                          ? 'bg-[#FDF2E2] text-[#8C5E28]'
                          : 'bg-[#EBF2EB] text-[#3D6B42]'
                      }`}>
                        Prioritas {task.prioritas}
                      </span>
                      <span className="text-xs text-[#8C7A6B] font-medium">#{task.no}</span>
                    </div>
                  </div>

                  {/* Note Title & Checkbox */}
                  <div className="flex items-start gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => handleToggle(task.id, task.status)}
                      title={isDone ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
                      className="mt-0.5 cursor-pointer text-[#8C7A6B] hover:text-[#2D2825] transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-[#4A6B5B] fill-[#EBF2EB]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#B8AAA0] hover:text-[#4A6B5B]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-base font-semibold leading-snug transition-all ${
                          isDone
                            ? 'line-through text-[#8C7A6B] decoration-[#A89C91]'
                            : 'text-[#2D2825]'
                        }`}
                      >
                        {task.nama}
                      </h3>
                      {task.deskripsi && (
                        <p className="text-xs text-[#6B5E54] mt-1.5 leading-relaxed">
                          {task.deskripsi}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subtasks Accordion */}
                  {subtasksCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#EAE1D7]">
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="flex items-center justify-between w-full text-xs font-medium text-[#5C5047] hover:text-[#2D2825] cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#8C7A6B]" />
                          Langkah: {completedSubtasks}/{subtasksCount}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 space-y-1.5 pl-1">
                          {task.subtasks?.map((sub) => (
                            <label
                              key={sub.id}
                              className="flex items-center justify-between text-xs text-[#4A3E36] group/item hover:bg-black/5 p-1 rounded cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={sub.done}
                                  onChange={() => handleToggleSubtask(task.id, sub.id)}
                                  className="w-3.5 h-3.5 rounded text-[#3D352E] focus:ring-[#8C7A6B]"
                                />
                                <span className={sub.done ? 'line-through text-[#A89C91]' : ''}>
                                  {sub.text}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubtask(task.id, sub.id)}
                                className="text-[#A89C91] hover:text-rose-600 opacity-0 group-hover/item:opacity-100 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Subtask / AI Suggester input if expanded */}
                  {isExpanded && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newSubtaskText[task.id] || ''}
                        onChange={(e) =>
                          setNewSubtaskText((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddManualSubtask(task.id);
                          }
                        }}
                        placeholder="Tambah checklist..."
                        className="flex-1 text-xs px-2.5 py-1 bg-white/80 border border-[#E2D8CC] rounded-lg focus:outline-none text-[#2D2825]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddManualSubtask(task.id)}
                        className="text-xs px-2 py-1 bg-[#3D352E] text-white rounded-lg cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Footer on Memo Note */}
                <div className="mt-4 pt-3 border-t border-[#EAE1D7] flex items-center justify-between text-xs text-[#7A6E65]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#A39282]" />
                    <span className="font-medium">{task.batasWaktu}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Suggest subtasks button */}
                    <button
                      type="button"
                      onClick={() => handleAiSuggestSubtasks(task)}
                      title="AI bantu buat langkah subtasks"
                      disabled={generatingSubtasksFor === task.id}
                      className="p-1.5 text-[#7A6E65] hover:text-[#2D2825] hover:bg-black/5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#8C7A6B]" />
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      title="Edit Catatan"
                      className="p-1.5 text-[#7A6E65] hover:text-[#2D2825] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      title="Hapus Catatan"
                      className="p-1.5 text-[#7A6E65] hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
