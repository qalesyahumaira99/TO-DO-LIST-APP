import { TaskItem } from '../types/task';

export const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 'default-task-1',
    no: 1,
    nama: 'Meninjau & membalas email masuk',
    kategori: 'Pekerjaan',
    prioritas: 'Tinggi',
    batasWaktu: 'Hari ini, 17:00',
    status: 'Belum Selesai',
    deskripsi: 'Memeriksa kotak masuk penting, membalas email klien dan koordinasi tim.',
    subtasks: [
      { id: 'sub-1-1', text: 'Filter email berprioritas tinggi', done: false },
      { id: 'sub-1-2', text: 'Balas email konfirmasi jadwal proyek', done: false },
      { id: 'sub-1-3', text: 'Arsipkan pesan yang sudah selesai', done: false },
    ],
  },
  {
    id: 'default-task-2',
    no: 2,
    nama: 'Membayar tagihan listrik & internet',
    kategori: 'Keuangan',
    prioritas: 'Tinggi',
    batasWaktu: 'Besok, 12:00',
    status: 'Belum Selesai',
    deskripsi: 'Membayar tagihan rutin bulanan melalui m-banking sebelum jatuh tempo.',
  },
  {
    id: 'default-task-3',
    no: 3,
    nama: 'Menyiapkan bahan presentasi proyek',
    kategori: 'Pekerjaan',
    prioritas: 'Tinggi',
    batasWaktu: 'Jumat, 09:00',
    status: 'Belum Selesai',
    deskripsi: 'Menyusun slide deck capaian Q4 dan rencana kerja tim untuk rapat direksi.',
    subtasks: [
      { id: 'sub-3-1', text: 'Kumpulkan data metrik performa', done: false },
      { id: 'sub-3-2', text: 'Rancang outline slide presentasi', done: false },
      { id: 'sub-3-3', text: 'Tinjau visualisasi grafik & ringkasan', done: false },
    ],
  },
  {
    id: 'default-task-4',
    no: 4,
    nama: 'Belanja kebutuhan pokok mingguan',
    kategori: 'Pribadi',
    prioritas: 'Sedang',
    batasWaktu: 'Sabtu, 10:00',
    status: 'Belum Selesai',
    deskripsi: 'Membeli sayuran segar, buah-buahan, perlengkapan dapur dan mandi.',
  },
  {
    id: 'default-task-5',
    no: 5,
    nama: 'Olahraga ringan (30 menit)',
    kategori: 'Kesehatan',
    prioritas: 'Sedang',
    batasWaktu: 'Setiap Hari, 07:00',
    status: 'Belum Selesai',
    deskripsi: 'Jogging santai di taman atau stretching yoga untuk menjaga kebugaran tubuh.',
  },
  {
    id: 'default-task-6',
    no: 6,
    nama: 'Membaca 1 bab buku / materi belajar',
    kategori: 'Belajar',
    prioritas: 'Rendah',
    batasWaktu: 'Minggu, 20:00',
    status: 'Belum Selesai',
    deskripsi: 'Melanjutkan membaca buku pengembangan diri atau modul kursus teknologi.',
  },
];

export function generateMarkdownTable(tasks: TaskItem[]): string {
  if (!tasks || tasks.length === 0) {
    return '_Saat ini belum ada tugas dalam daftar._';
  }
  let md = '| No | Nama Tugas | Kategori | Prioritas | Batas Waktu | Status |\n';
  md += '|---|---|---|---|---|---|\n';
  tasks.forEach((t, index) => {
    md += `| ${index + 1} | ${t.nama} | ${t.kategori} | ${t.prioritas} | ${t.batasWaktu} | ${t.status} |\n`;
  });
  return md;
}

export function generateInitialAssistantMessage(tasks: TaskItem[]): string {
  const table = generateMarkdownTable(tasks);
  return `Halo! Saya adalah asisten AI ahli dalam manajemen tugas dan produktivitas Anda. Senang sekali bisa membantu Anda mencatat, mengorganisasi, dan memantau tugas-tugas agar semua tersusun rapi dan produktif.

Berikut adalah daftar tugas awal Anda saat ini:

${table}

Apakah Anda ingin menambah tugas baru, mengubah status (misalnya menandai tugas menjadi Selesai), atau menghapus tugas tertentu?`;
}
