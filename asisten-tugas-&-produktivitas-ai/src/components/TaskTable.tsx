import React, { useState } from 'react';
import { TaskItem, PriorityLevel, TaskStatus } from '../types/task';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Search, 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ListPlus, 
  Plus, 
  Layers,
  ArrowUpDown,
  Tag,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskTableProps {
  tasks: TaskItem[];
  onToggleStatus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: TaskItem) => void;
  onQuickAdd: (input: string) => Promise<void>;
  onOpenNewTaskModal: () => void;
  onUpdateSubtasks: (taskId: string, subtasks: { id: string; text: string; done: boolean }[]) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
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
  const [selectedPriority, setSelectedPriority] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [generatingSubtasksFor, setGeneratingSubtasksFor] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState<{ [key: string]: string }>({});

  // Trigger confetti on completion
  const handleToggle = (id: string, currentStatus: TaskStatus) => {
    if (currentStatus === 'Belum Selesai') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // Safe ignore
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
        // Auto expand
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

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.deskripsi && t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.kategori.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'Semua' || t.kategori === selectedCategory;
    const matchesPriority = selectedPriority === 'Semua' || t.prioritas === selectedPriority;
    const matchesStatus = selectedStatus === 'Semua' || t.status === selectedStatus;
    return matchesSearch && matchesCat && matchesPriority && matchesStatus;
  });

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case 'Tinggi':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Tinggi
          </span>
        );
      case 'Sedang':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Sedang
          </span>
        );
      case 'Rendah':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Rendah
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {p}
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: string) => {
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    switch (cat.toLowerCase()) {
      case 'pekerjaan':
        colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'keuangan':
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'pribadi':
        colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'kesehatan':
        colorClass = 'bg-pink-50 text-pink-700 border-pink-200';
        break;
      case 'belajar':
        colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
        {cat}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Smart Quick Add Bar */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 p-4 rounded-xl border border-indigo-100 shadow-xs">
        <form onSubmit={handleQuickAddSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Catat tugas cepat, contoh: 'Siapkan revisi laporan klien besok jam 14:00 prioritas tinggi'"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isParsingQuick || !quickInput.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isParsingQuick ? 'Menganalisis...' : 'Ekstrak & Catat AI'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center justify-center gap-1 px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Formulir Detail</span>
            </button>
          </div>
        </form>
        <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
          <span className="font-semibold text-indigo-600">Tip AI:</span>
          Anda dapat mengetik secara alami. AI akan otomatis menentukan kategori, tingkat prioritas, dan batas waktu untuk Anda.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tugas, kategori, atau deskripsi..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="Semua">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="Semua">Semua Prioritas</option>
            <option value="Tinggi">Tinggi</option>
            <option value="Sedang">Sedang</option>
            <option value="Rendah">Rendah</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Belum Selesai">Belum Selesai</option>
            <option value="Selesai">Selesai</option>
          </select>

          {(searchQuery || selectedCategory !== 'Semua' || selectedPriority !== 'Semua' || selectedStatus !== 'Semua') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
                setSelectedPriority('Semua');
                setSelectedStatus('Semua');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-12 text-center">Status</th>
                <th className="py-3 px-4 min-w-[260px]">Nama Tugas</th>
                <th className="py-3 px-4 w-32">Kategori</th>
                <th className="py-3 px-4 w-28">Prioritas</th>
                <th className="py-3 px-4 w-44">Batas Waktu</th>
                <th className="py-3 px-4 w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-medium text-slate-600">Tidak ada tugas yang cocok.</p>
                      <p className="text-xs text-slate-400">
                        Coba sesuaikan kata kunci pencarian atau bersihkan filter di atas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, index) => {
                  const isDone = task.status === 'Selesai';
                  const isExpanded = expandedTaskIds.has(task.id);
                  const subtasksCount = task.subtasks?.length || 0;
                  const completedSubtasks = task.subtasks?.filter((s) => s.done).length || 0;

                  return (
                    <React.Fragment key={task.id}>
                      <tr 
                        className={`group hover:bg-slate-50/80 transition-colors ${
                          isDone ? 'bg-slate-50/40 text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {/* No */}
                        <td className="py-3.5 px-3 text-center text-xs font-semibold text-slate-500">
                          {task.no || index + 1}
                        </td>

                        {/* Status Checkbox */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(task.id, task.status)}
                            title={isDone ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
                            className="inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-400" />
                            )}
                          </button>
                        </td>

                        {/* Nama Tugas & Subtasks Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span 
                              className={`font-medium ${
                                isDone ? 'line-through text-slate-400 font-normal' : 'text-slate-900'
                              }`}
                            >
                              {task.nama}
                            </span>
                            {task.deskripsi && (
                              <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {task.deskripsi}
                              </span>
                            )}
                            {subtasksCount > 0 && (
                              <button
                                onClick={() => toggleExpand(task.id)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 mt-1 cursor-pointer w-fit"
                              >
                                <Layers className="w-3 h-3" />
                                <span>
                                  Langkah: {completedSubtasks}/{subtasksCount}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getCategoryBadge(task.kategori)}
                        </td>

                        {/* Prioritas */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getPriorityBadge(task.prioritas)}
                        </td>

                        {/* Batas Waktu */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{task.batasWaktu}</span>
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            {/* Toggle Subtasks / AI Steps */}
                            <button
                              type="button"
                              onClick={() => toggleExpand(task.id)}
                              title="Tampilkan / Sembunyikan Subtask"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            >
                              <ListPlus className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              title="Edit Tugas"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task.id)}
                              title="Hapus Tugas"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Subtasks Accordion Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 border-b border-slate-100">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="max-w-2xl bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                  Langkah Pelaksanaan (Subtasks)
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => handleAiSuggestSubtasks(task)}
                                  disabled={generatingSubtasksFor === task.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Sparkles className="w-3 h-3 text-indigo-600" />
                                  <span>
                                    {generatingSubtasksFor === task.id ? 'Membuat Langkah...' : 'Bantu Rinci dengan AI'}
                                  </span>
                                </button>
                              </div>

                              {/* Subtask list */}
                              {(!task.subtasks || task.subtasks.length === 0) ? (
                                <p className="text-xs text-slate-400 italic py-1">
                                  Belum ada subtask. Klik tombol &ldquo;Bantu Rinci dengan AI&rdquo; atau tambahkan manual di bawah.
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {task.subtasks.map((sub) => (
                                    <div 
                                      key={sub.id} 
                                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors group/sub"
                                    >
                                      <label className="flex items-center gap-2 cursor-pointer text-xs flex-1">
                                        <input
                                          type="checkbox"
                                          checked={sub.done}
                                          onChange={() => handleToggleSubtask(task.id, sub.id)}
                                          className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className={sub.done ? 'line-through text-slate-400' : 'text-slate-700'}>
                                          {sub.text}
                                        </span>
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubtask(task.id, sub.id)}
                                        className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover/sub:opacity-100 transition-opacity cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Manual Add Subtask */}
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
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
                                  placeholder="Tambah langkah baru..."
                                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddManualSubtask(task.id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                >
                                  Tambah
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer info */}
        <div className="bg-slate-50/70 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredTasks.length} dari {tasks.length} tugas total</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Selesai: {tasks.filter((t) => t.status === 'Selesai').length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Belum Selesai: {tasks.filter((t) => t.status === 'Belum Selesai').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
