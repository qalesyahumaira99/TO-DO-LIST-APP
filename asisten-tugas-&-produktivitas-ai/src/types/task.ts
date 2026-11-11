export type PriorityLevel = 'Tinggi' | 'Sedang' | 'Rendah';
export type TaskStatus = 'Belum Selesai' | 'Selesai';
export type TaskCategory = 'Pekerjaan' | 'Keuangan' | 'Pribadi' | 'Kesehatan' | 'Belajar' | string;

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskItem {
  id: string;
  no: number;
  nama: string;
  kategori: TaskCategory;
  prioritas: PriorityLevel;
  batasWaktu: string;
  status: TaskStatus;
  deskripsi?: string;
  subtasks?: Subtask[];
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionTaken?: string;
  actionDetail?: string;
}
