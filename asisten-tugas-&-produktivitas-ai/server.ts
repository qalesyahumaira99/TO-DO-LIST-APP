import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize server-side Gemini client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface TaskItem {
  id: string;
  no: number;
  nama: string;
  kategori: string;
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
  batasWaktu: string;
  status: 'Belum Selesai' | 'Selesai';
  deskripsi?: string;
  subtasks?: { id: string; text: string; done: boolean }[];
  createdAt?: string;
}

// Helper to format table in Markdown
function formatMarkdownTable(tasks: TaskItem[]): string {
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

// Fallback Indonesian NLP Parser when AI is unavailable or as quick offline handler
function fallbackTaskParser(input: string): Partial<TaskItem> {
  const lower = input.toLowerCase();
  
  // Category inference
  let kategori = 'Pribadi';
  if (/kerja|proyek|meeting|rapat|klien|email|kantor|laporan|presentasi|coding|deploy|revisi/i.test(lower)) {
    kategori = 'Pekerjaan';
  } else if (/bayar|tagihan|listrik|uang|gaji|rekening|investasi|transfer|bank|pajak|belanja/i.test(lower)) {
    kategori = /belanja/i.test(lower) ? 'Pribadi' : 'Keuangan';
  } else if (/olahraga|lari|gym|sehat|obat|vitamin|dokter|makan|tidur|workout|sepeda/i.test(lower)) {
    kategori = 'Kesehatan';
  } else if (/baca|buku|belajar|kursus|kuliah|tugas sekolah|ujian|skripsi|materi|latihan/i.test(lower)) {
    kategori = 'Belajar';
  }

  // Priority inference
  let prioritas: 'Tinggi' | 'Sedang' | 'Rendah' = 'Sedang';
  if (/segera|penting|urgent|asap|darurat|hari ini|malam ini|tagihan|deadline/i.test(lower)) {
    prioritas = 'Tinggi';
  } else if (/santai|nanti|kapan-kapan|luang|minggu depan|rendah/i.test(lower)) {
    prioritas = 'Rendah';
  }

  // Deadline inference
  let batasWaktu = 'Hari ini, 18:00';
  if (/besok/i.test(lower)) {
    batasWaktu = 'Besok, 12:00';
  } else if (/hari ini/i.test(lower)) {
    batasWaktu = 'Hari ini, 17:00';
  } else if (/jumat/i.test(lower)) {
    batasWaktu = 'Jumat, 09:00';
  } else if (/sabtu/i.test(lower)) {
    batasWaktu = 'Sabtu, 10:00';
  } else if (/minggu/i.test(lower)) {
    batasWaktu = 'Minggu, 20:00';
  } else if (/senin/i.test(lower)) {
    batasWaktu = 'Senin, 09:00';
  } else if (/setiap hari/i.test(lower)) {
    batasWaktu = 'Setiap Hari, 07:00';
  }

  // Clean task name
  let cleanName = input
    .replace(/^(tolong|mohon|tambahkan|catat|buat|masukkan|jadwalkan|ingatkan saya untuk)\s+/i, '')
    .trim();
  cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    nama: cleanName,
    kategori,
    prioritas,
    batasWaktu,
    status: 'Belum Selesai',
  };
}

// API: Process conversational request with Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], currentTasks = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Pesan pengguna diperlukan.' });
    }

    if (!ai) {
      // Offline fallback rule-based response
      const fallbackResponse = processOfflineFallback(message, currentTasks);
      return res.json(fallbackResponse);
    }

    const currentTasksJson = JSON.stringify(currentTasks, null, 2);

    const systemInstruction = `Anda adalah asisten AI ahli dalam manajemen tugas dan produktivitas yang bertugas untuk mengelola aplikasi To-Do List pengguna.
Tujuan utama Anda adalah membantu pengguna mencatat, mengorganisasi, dan memantau tugas-tugas mereka agar tidak ada yang terlewat dan semua tersusun rapi.

Peran & Tanggung Jawab Utama:
1. Pencatatan Tugas yang Rapi: Tangkap tugas yang diinputkan pengguna dan ekstrak detail penting seperti judul tugas, deskripsi singkat, prioritas, serta batas waktu (deadline).
2. Pengkategorian Otomatis: Kelompokkan tugas ke dalam kategori yang relevan (misalnya: Pekerjaan, Pribadi, Belajar, Kesehatan, Keuangan) jika pengguna tidak menyebutkannya.
3. Penentuan Prioritas: Bantu menentukan tingkat urgensi tugas menggunakan format (Tinggi / Sedang / Rendah) berdasarkan batas waktu atau tingkat kepentingan yang diberikan pengguna.
4. Ringkasan & Penataan: Sajikan daftar tugas secara bersih, terstruktur, dan mudah dibaca menggunakan format tabel Markdown.

Aturan Komunikasi Wajib:
- Gunakan bahasa Indonesia yang ramah, jelas, dan santun.
- Setiap kali ada penambahan, perubahan, atau penghapusan tugas dari pengguna, perbarui tabel tugas dan tampilkan kembali secara rapi dalam format Markdown di dalam pesan Anda.
- Jika ada detail yang kurang jelas (seperti deadline atau prioritas), berikan saran default yang masuk akal tanpa mengganggu alur pengguna.
- Setelah memberikan daftar tugas, selalu tanyakan secara singkat apakah pengguna ingin menambah, mengubah status (misal: jadi Selesai), atau menghapus tugas tertentu.

Format Keluaran JSON yang Diharapkan:
Anda HARUS merespons dalam format JSON sesuai schema:
{
  "assistantReply": "Teks jawaban lengkap Anda dalam bahasa Indonesia ramah dan santun, yang mencakup penjelasan tindakan, tabel Markdown yang selalu rapi dan up-to-date, serta pertanyaan penutup singkat.",
  "updatedTasks": [
    {
      "id": "string",
      "no": 1,
      "nama": "string",
      "kategori": "Pekerjaan|Pribadi|Belajar|Kesehatan|Keuangan|Lainnya",
      "prioritas": "Tinggi|Sedang|Rendah",
      "batasWaktu": "string (contoh: Hari ini, 17:00 / Besok, 12:00)",
      "status": "Belum Selesai|Selesai",
      "deskripsi": "string opsional"
    }
  ],
  "actionTaken": "add" | "update_status" | "delete" | "edit" | "show_list" | "general_advice",
  "actionDetail": "Penjelasan singkat mengenai aksi yang dilakukan (misal: Menambahkan tugas 'Membeli susu')"
}

Daftar tugas saat ini milik pengguna:
${currentTasksJson}
`;

    // Format chat history
    const contents: any[] = [];
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assistantReply: {
              type: Type.STRING,
              description: 'Respon teks lengkap dalam Bahasa Indonesia ramah dan santun, berisi tabel Markdown terbaru dan pertanyaan tindak lanjut.',
            },
            updatedTasks: {
              type: Type.ARRAY,
              description: 'Daftar tugas terkini setelah penambahan/perubahan/penghapusan.',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  no: { type: Type.INTEGER },
                  nama: { type: Type.STRING },
                  kategori: { type: Type.STRING },
                  prioritas: { type: Type.STRING },
                  batasWaktu: { type: Type.STRING },
                  status: { type: Type.STRING },
                  deskripsi: { type: Type.STRING },
                },
                required: ['nama', 'kategori', 'prioritas', 'batasWaktu', 'status'],
              },
            },
            actionTaken: {
              type: Type.STRING,
              description: 'Tindakan yang diambil (add, update_status, delete, edit, show_list, general_advice)',
            },
            actionDetail: {
              type: Type.STRING,
              description: 'Ringkasan singkat aksi yang telah dilakukan',
            },
          },
          required: ['assistantReply', 'updatedTasks', 'actionTaken'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Tidak ada respon yang diterima dari Gemini API.');
    }

    const parsed = JSON.parse(text);

    // Normalize IDs and numbers if needed
    if (Array.isArray(parsed.updatedTasks)) {
      parsed.updatedTasks = parsed.updatedTasks.map((t: any, idx: number) => ({
        ...t,
        id: t.id || `task-${Date.now()}-${idx}`,
        no: idx + 1,
        status: t.status === 'Selesai' ? 'Selesai' : 'Belum Selesai',
      }));
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini Chat error:', error);
    // Graceful fallback to offline smart processing so the user is never stranded
    const { message, currentTasks = [] } = req.body;
    const fallback = processOfflineFallback(message || '', currentTasks);
    return res.json(fallback);
  }
});

// API: Quick AI Extraction for a single task input
app.post('/api/parse-task', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Teks tugas diperlukan.' });
    }

    if (!ai) {
      return res.json(fallbackTaskParser(text));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Ekstrak dan kategorisasikan tugas berikut dari input pengguna ke dalam format yang rapi:
Input: "${text}"

Ketentuan:
1. Kategori harus relevan: Pekerjaan, Pribadi, Belajar, Kesehatan, Keuangan, atau kategori spesifik lain yang cocok.
2. Prioritas: "Tinggi", "Sedang", atau "Rendah" (berdasarkan urgensi atau kepentingan).
3. Batas Waktu: Ekstrak deadline jika ada (misal: "Besok, 14:00" atau "Hari ini, 17:00"). Jika tidak disebutkan, berikan estimasi default yang wajar (misal "Hari ini, 18:00").
4. Buat nama tugas singkat, jelas, berawalan huruf kapital, dan deskripsi opsional.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nama: { type: Type.STRING },
            deskripsi: { type: Type.STRING },
            kategori: { type: Type.STRING },
            prioritas: { type: Type.STRING },
            batasWaktu: { type: Type.STRING },
            status: { type: Type.STRING },
          },
          required: ['nama', 'kategori', 'prioritas', 'batasWaktu', 'status'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      status: 'Belum Selesai',
    });
  } catch (err: any) {
    console.error('Parse task error:', err);
    return res.json(fallbackTaskParser(req.body?.text || ''));
  }
});

// API: Suggest subtasks for a task
app.post('/api/suggest-subtasks', async (req, res) => {
  try {
    const { taskName, category } = req.body;
    if (!taskName) {
      return res.status(400).json({ error: 'Nama tugas diperlukan.' });
    }

    if (!ai) {
      return res.json({
        subtasks: [
          `Menyiapkan rencana dan bahan untuk "${taskName}"`,
          `Melakukan eksekusi langkah utama`,
          `Memeriksa kembali hasil akhir dan tindak lanjut`,
        ],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Berikan 3-5 langkah kecil (subtask/checklist) yang spesifik dan praktis untuk menyelesaikan tugas "${taskName}" (Kategori: ${category || 'Umum'}). Bahasa Indonesia ramah & produktif.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['subtasks'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"subtasks": []}');
    return res.json(parsed);
  } catch (err) {
    return res.json({
      subtasks: [
        `Menyiapkan rencana dan bahan`,
        `Melakukan eksekusi utama`,
        `Tinjau kembali dan pastikan selesai`,
      ],
    });
  }
});

// Offline NLP processor if Gemini API is offline or key is missing
function processOfflineFallback(message: string, currentTasks: TaskItem[]) {
  const lower = message.toLowerCase();
  let tasks = [...currentTasks];
  let actionTaken = 'general_advice';
  let actionDetail = 'Merespon pesan pengguna';
  let replyIntro = '';

  // Check for mark done: "selesai nomor 2", "tandai 1 selesai", "sudah selesai bayar tagihan"
  const doneMatch = lower.match(/(?:tandai|ubah|buat|jadikan|set)?\s*(?:nomor|no\.?|#)?\s*(\d+)\s*(?:jadi|sebagai)?\s*(?:sudah\s*)?selesai/i) ||
                    lower.match(/(?:sudah\s+selesai|selesai)\s*(?:tugas\s*)?(?:nomor|no\.?|#)?\s*(\d+)/i);

  // Check for delete: "hapus nomor 3", "delete no 2"
  const delMatch = lower.match(/(?:hapus|delete|buang|hilangkan)\s*(?:tugas\s*)?(?:nomor|no\.?|#)?\s*(\d+)/i);

  // Check for add task
  const addMatch = lower.match(/(?:tambah|tambahkan|masukkan|catat|buat tugas baru|tolong catat)\s+(.+)/i);

  if (doneMatch) {
    const targetNo = parseInt(doneMatch[1], 10);
    const targetIdx = tasks.findIndex((t) => t.no === targetNo);
    if (targetIdx !== -1) {
      tasks[targetIdx] = { ...tasks[targetIdx], status: 'Selesai' };
      actionTaken = 'update_status';
      actionDetail = `Mengubah status tugas No ${targetNo} (${tasks[targetIdx].nama}) menjadi Selesai.`;
      replyIntro = `Bagus sekali! Tugas No ${targetNo} (**${tasks[targetIdx].nama}**) telah berhasil ditandai sebagai **Selesai**. Selamat atas pencapaian Anda! 🎉\n\n`;
    }
  } else if (delMatch) {
    const targetNo = parseInt(delMatch[1], 10);
    const targetIdx = tasks.findIndex((t) => t.no === targetNo);
    if (targetIdx !== -1) {
      const removed = tasks[targetIdx];
      tasks.splice(targetIdx, 1);
      // Re-number
      tasks = tasks.map((t, idx) => ({ ...t, no: idx + 1 }));
      actionTaken = 'delete';
      actionDetail = `Menghapus tugas No ${targetNo} (${removed.nama}).`;
      replyIntro = `Tugas No ${targetNo} (**${removed.nama}**) telah berhasil dihapus dari daftar tugas Anda.\n\n`;
    }
  } else if (addMatch || lower.includes('tambah') || lower.includes('catat')) {
    const rawContent = addMatch ? addMatch[1] : message;
    const parsed = fallbackTaskParser(rawContent);
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      no: tasks.length + 1,
      nama: parsed.nama || 'Tugas Baru',
      kategori: parsed.kategori || 'Pribadi',
      prioritas: parsed.prioritas || 'Sedang',
      batasWaktu: parsed.batasWaktu || 'Hari ini, 18:00',
      status: 'Belum Selesai',
    };
    tasks.push(newTask);
    actionTaken = 'add';
    actionDetail = `Menambahkan tugas baru: ${newTask.nama}`;
    replyIntro = `Tugas baru berhasil dicatat dan dikategorikan ke dalam **${newTask.kategori}** dengan prioritas **${newTask.prioritas}**!\n\n`;
  } else {
    replyIntro = `Halo! Berikut adalah daftar tugas terbaru Anda yang sudah terorganisasi dengan rapi:\n\n`;
    actionTaken = 'show_list';
  }

  const tableMd = formatMarkdownTable(tasks);
  const closingQuestion = `\n\nApakah Anda ingin menambah tugas baru, mengubah status (misalnya menandai tugas menjadi Selesai), atau menghapus tugas tertentu?`;

  return {
    assistantReply: `${replyIntro}${tableMd}${closingQuestion}`,
    updatedTasks: tasks,
    actionTaken,
    actionDetail,
  };
}

// Development with Vite or Production build serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Dynamic import vite in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
