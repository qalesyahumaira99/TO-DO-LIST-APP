import React, { useState, useEffect } from 'react';
import { TaskItem, ChatMessage, TaskStatus } from './types/task';
import { 
  DEFAULT_TASKS, 
  generateMarkdownTable, 
  generateInitialAssistantMessage 
} from './data/defaultTasks';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { NotesCardsView } from './components/NotesCardsView';
import { MarkdownTableView } from './components/MarkdownTableView';
import { AiAssistantChat } from './components/AiAssistantChat';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { TaskModal } from './components/TaskModal';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'ai_productivity_todo_notes_v3';
const CHAT_STORAGE_KEY = 'ai_productivity_chat_notes_v3';

export default function App() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
    return DEFAULT_TASKS;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedChat = localStorage.getItem(CHAT_STORAGE_KEY);
      if (savedChat) {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load chat', e);
    }
    return [
      {
        id: 'init-msg-1',
        sender: 'assistant',
        text: generateInitialAssistantMessage(DEFAULT_TASKS),
        timestamp: 'Hari ini, 19:00',
        actionDetail: 'Buku Catatan Tugas Diinisialisasi',
      },
    ];
  });

  const [activeTab, setActiveTab] = useState<'notes' | 'journal' | 'chat' | 'pinboard'>('notes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat', e);
    }
  }, [messages]);

  const renumber = (items: TaskItem[]): TaskItem[] => {
    return items.map((t, idx) => ({ ...t, no: idx + 1 }));
  };

  const handleToggleStatus = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          const nextStatus: TaskStatus = t.status === 'Selesai' ? 'Belum Selesai' : 'Selesai';
          return { ...t, status: nextStatus };
        }
        return t;
      });

      const target = prev.find((t) => t.id === id);
      if (target) {
        const newStatus = target.status === 'Selesai' ? 'Belum Selesai' : 'Selesai';
        const table = generateMarkdownTable(updated);
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        setMessages((prevMsgs) => [
          ...prevMsgs,
          {
            id: `msg-status-${Date.now()}`,
            sender: 'assistant',
            text: `Catatan tugas No ${target.no} (**${target.nama}**) telah ditandai sebagai **${newStatus}**.\n\n${table}\n\nApakah Anda ingin menambah tugas baru, mengubah status (misal: jadi Selesai), atau menghapus tugas tertentu?`,
            timestamp: `Hari ini, ${timeStr}`,
            actionDetail: `Status No ${target.no} diubah ke ${newStatus}`,
          },
        ]);
      }

      return updated;
    });
  };

  const handleDeleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const updated = renumber(tasks.filter((t) => t.id !== id));
    setTasks(updated);

    const table = generateMarkdownTable(updated);
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setMessages((prevMsgs) => [
      ...prevMsgs,
      {
        id: `msg-del-${Date.now()}`,
        sender: 'assistant',
        text: `Catatan No ${target.no} (**${target.nama}**) telah dihapus dari buku catatan Anda.\n\n${table}\n\nApakah Anda ingin menambah tugas baru, mengubah status, atau menghapus tugas tertentu?`,
        timestamp: `Hari ini, ${timeStr}`,
        actionDetail: `Menghapus catatan No ${target.no}`,
      },
    ]);
  };

  const handleSaveTask = (taskData: Partial<TaskItem>) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (taskData.id) {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === taskData.id ? ({ ...t, ...taskData } as TaskItem) : t
        );
        const target = updated.find((t) => t.id === taskData.id);
        const table = generateMarkdownTable(updated);
        setMessages((prevMsgs) => [
          ...prevMsgs,
          {
            id: `msg-edit-${Date.now()}`,
            sender: 'assistant',
            text: `Perubahan pada catatan No ${target?.no} (**${target?.nama}**) telah berhasil disimpan.\n\n${table}\n\nApakah Anda ingin menambah tugas baru, mengubah status, atau menghapus tugas tertentu?`,
            timestamp: `Hari ini, ${timeStr}`,
            actionDetail: `Catatan No ${target?.no} diperbarui`,
          },
        ]);
        return updated;
      });
    } else {
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        no: tasks.length + 1,
        nama: taskData.nama || 'Catatan Baru',
        kategori: taskData.kategori || 'Pribadi',
        prioritas: taskData.prioritas || 'Sedang',
        batasWaktu: taskData.batasWaktu || 'Hari ini, 18:00',
        status: taskData.status || 'Belum Selesai',
        deskripsi: taskData.deskripsi,
        subtasks: taskData.subtasks || [],
        createdAt: new Date().toISOString(),
      };

      const updated = renumber([...tasks, newTask]);
      setTasks(updated);

      const table = generateMarkdownTable(updated);
      setMessages((prevMsgs) => [
        ...prevMsgs,
        {
          id: `msg-add-${Date.now()}`,
          sender: 'assistant',
          text: `Catatan baru **${newTask.nama}** berhasil dimasukkan ke kategori **${newTask.kategori}** dengan prioritas **${newTask.prioritas}**!\n\n${table}\n\nApakah Anda ingin menambah tugas baru lainnya, mengubah status, atau menghapus tugas tertentu?`,
          timestamp: `Hari ini, ${timeStr}`,
          actionDetail: `Catatan baru: ${newTask.nama}`,
        },
      ]);
    }
    setEditingTask(null);
  };

  const handleQuickAdd = async (input: string) => {
    try {
      const res = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        no: tasks.length + 1,
        nama: data.nama || input,
        kategori: data.kategori || 'Pribadi',
        prioritas: data.prioritas || 'Sedang',
        batasWaktu: data.batasWaktu || 'Hari ini, 18:00',
        status: 'Belum Selesai',
        deskripsi: data.deskripsi,
        subtasks: [],
      };

      const updated = renumber([...tasks, newTask]);
      setTasks(updated);

      const table = generateMarkdownTable(updated);
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-quick-${Date.now()}`,
          sender: 'assistant',
          text: `Catatan baru berhasil diekstrak dan dicatat:\n- **Nama**: ${newTask.nama}\n- **Kategori**: ${newTask.kategori}\n- **Prioritas**: ${newTask.prioritas}\n- **Batas Waktu**: ${newTask.batasWaktu}\n\n${table}\n\nApakah Anda ingin menambah, mengubah status, atau menghapus tugas tertentu?`,
          timestamp: `Hari ini, ${timeStr}`,
          actionDetail: `Catatan kilat: ${newTask.nama}`,
        },
      ]);
    } catch (e) {
      handleSaveTask({ nama: input, kategori: 'Pribadi', prioritas: 'Sedang', batasWaktu: 'Hari ini, 18:00', status: 'Belum Selesai' });
    }
  };

  const handleUpdateSubtasks = (taskId: string, subtasks: { id: string; text: string; done: boolean }[]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtasks } : t))
    );
  };

  const handleSendMessage = async (userText: string) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: `Hari ini, ${timeStr}`,
    };

    const newMessagesHistory = [...messages, userMsg];
    setMessages(newMessagesHistory);
    setIsLoadingAi(true);

    try {
      const historyPayload = newMessagesHistory.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: historyPayload,
          currentTasks: tasks,
        }),
      });

      const data = await res.json();

      if (Array.isArray(data.updatedTasks)) {
        const renumbered = renumber(data.updatedTasks);
        setTasks(renumbered);

        const newlyDone = renumbered.some(
          (nt) => nt.status === 'Selesai' && tasks.find((ot) => ot.id === nt.id)?.status === 'Belum Selesai'
        );
        if (newlyDone) {
          try {
            confetti({
              particleCount: 40,
              spread: 55,
              origin: { y: 0.7 },
            });
          } catch (e) {}
        }
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.assistantReply || 'Berikut adalah daftar tugas terbaru Anda:\n\n' + generateMarkdownTable(tasks),
        timestamp: `Hari ini, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
        actionTaken: data.actionTaken,
        actionDetail: data.actionDetail,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error sending message:', err);
      const fallbackTable = generateMarkdownTable(tasks);
      const fallbackMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: `Berikut adalah daftar catatan tugas Anda saat ini:\n\n${fallbackTable}\n\nApakah Anda ingin menambah, mengubah status, atau menghapus tugas tertentu?`,
        timestamp: `Hari ini, ${timeStr}`,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleResetTasks = () => {
    if (window.confirm('Kembalikan buku catatan ke 6 catatan tugas awal default?')) {
      setTasks(DEFAULT_TASKS);
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const resetMsg: ChatMessage = {
        id: `reset-${Date.now()}`,
        sender: 'assistant',
        text: `Buku catatan telah berhasil dikembalikan ke 6 daftar tugas awal default:\n\n${generateMarkdownTable(DEFAULT_TASKS)}\n\nApakah Anda ingin menambah tugas baru, mengubah status (misal: jadi Selesai), atau menghapus tugas tertentu?`,
        timestamp: `Hari ini, ${timeStr}`,
        actionDetail: 'Reset ke Daftar Catatan Awal',
      };
      setMessages([resetMsg]);
    }
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownTable(tasks);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedCount = tasks.filter((t) => t.status === 'Selesai').length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans text-[#2D2825]">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetTasks={handleResetTasks}
        onCopyMarkdown={handleCopyMarkdown}
        onOpenNewTaskModal={() => {
          setEditingTask(null);
          setIsModalOpen(true);
        }}
        copied={copied}
        totalTasks={tasks.length}
        completedTasks={completedCount}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Aesthetic Planner Header */}
        <StatsCards tasks={tasks} />

        {/* Tab Views */}
        {activeTab === 'notes' && (
          <NotesCardsView
            tasks={tasks}
            onToggleStatus={handleToggleStatus}
            onDeleteTask={handleDeleteTask}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsModalOpen(true);
            }}
            onQuickAdd={handleQuickAdd}
            onOpenNewTaskModal={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            onUpdateSubtasks={handleUpdateSubtasks}
          />
        )}

        {activeTab === 'journal' && (
          <MarkdownTableView tasks={tasks} />
        )}

        {activeTab === 'chat' && (
          <AiAssistantChat
            messages={messages}
            tasks={tasks}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingAi}
          />
        )}

        {activeTab === 'pinboard' && (
          <EisenhowerMatrix
            tasks={tasks}
            onToggleStatus={handleToggleStatus}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8DFD5] bg-[#FAF7F2] py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-[#8C7A6B] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-editorial text-sm text-[#4A3E36]">
            Buku Catatan Tugas & Agenda Produktivitas AI
          </p>
          <div className="flex items-center gap-2 font-handwriting text-base text-[#6B5E54]">
            <span>Pekerjaan · Keuangan · Pribadi · Kesehatan · Belajar</span>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />
    </div>
  );
}
