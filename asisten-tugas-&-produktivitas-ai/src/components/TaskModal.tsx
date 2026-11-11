import React, { useState, useEffect } from 'react';
import { TaskItem, PriorityLevel, TaskStatus } from '../types/task';
import { 
  X, 
  Sparkles, 
  PenTool, 
  Tag, 
  Clock, 
  Calendar,
  FileText
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<TaskItem>) => void;
  initialTask?: TaskItem | null;
}

const CATEGORIES = ['Pekerjaan', 'Keuangan', 'Pribadi', 'Kesehatan', 'Belajar'];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Pekerjaan');
  const [customKategori, setCustomKategori] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [prioritas, setPrioritas] = useState<PriorityLevel>('Sedang');
  const [batasWaktu, setBatasWaktu] = useState('Hari ini, 18:00');
  const [deskripsi, setDeskripsi] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Belum Selesai');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setNama(initialTask.nama);
      if (CATEGORIES.includes(initialTask.kategori)) {
        setKategori(initialTask.kategori);
        setIsCustomCat(false);
      } else {
        setKategori('Lainnya');
        setCustomKategori(initialTask.kategori);
        setIsCustomCat(true);
      }
      setPrioritas(initialTask.prioritas);
      setBatasWaktu(initialTask.batasWaktu);
      setDeskripsi(initialTask.deskripsi || '');
      setStatus(initialTask.status);
    } else {
      setNama('');
      setKategori('Pekerjaan');
      setIsCustomCat(false);
      setCustomKategori('');
      setPrioritas('Sedang');
      setBatasWaktu('Hari ini, 18:00');
      setDeskripsi('');
      setStatus('Belum Selesai');
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleAiAutoFill = async () => {
    if (!nama.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nama }),
      });
      const data = await res.json();
      if (data.nama) setNama(data.nama);
      if (data.kategori) {
        if (CATEGORIES.includes(data.kategori)) {
          setKategori(data.kategori);
          setIsCustomCat(false);
        } else {
          setKategori('Lainnya');
          setCustomKategori(data.kategori);
          setIsCustomCat(true);
        }
      }
      if (data.prioritas) setPrioritas(data.prioritas);
      if (data.batasWaktu) setBatasWaktu(data.batasWaktu);
      if (data.deskripsi && !deskripsi) setDeskripsi(data.deskripsi);
    } catch (e) {
      console.error('Failed to auto fill with AI:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const finalKategori = isCustomCat && customKategori.trim() ? customKategori.trim() : kategori;

    onSave({
      id: initialTask?.id,
      no: initialTask?.no,
      nama: nama.trim(),
      kategori: finalKategori,
      prioritas,
      batasWaktu: batasWaktu.trim() || 'Hari ini, 18:00',
      deskripsi: deskripsi.trim() || undefined,
      status,
      subtasks: initialTask?.subtasks || [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-lg w-full shadow-2xl border border-[#E2D8CC] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-[#F5EFEB] border-b border-[#E8DFD5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-[#4A3E36]" />
            <h3 className="text-base font-bold font-editorial text-[#2D2825]">
              {initialTask ? 'Sunting Catatan' : 'Lembar Catatan Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8C7A6B] hover:text-[#2D2825] hover:bg-[#EAE1D7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Judul Catatan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#5C5047] uppercase tracking-wider">
                Judul Tugas / Catatan <span className="text-[#9E3E34]">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isAiLoading || !nama.trim()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C7A6B] hover:text-[#2D2825] disabled:opacity-40 cursor-pointer"
              >
                <PenTool className="w-3 h-3" />
                <span>{isAiLoading ? 'Menganalisis...' : 'Saran Otomatis'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Tuliskan nama tugas Anda..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2D8CC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C7A6B] text-[#2D2825]"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-semibold text-[#5C5047] uppercase tracking-wider mb-1.5">
              Kategori
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    setKategori(cat);
                    setIsCustomCat(false);
                  }}
                  className={`py-1.5 px-2.5 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                    !isCustomCat && kategori === cat
                      ? 'bg-[#3D352E] border-[#3D352E] text-[#FAF7F2] font-semibold'
                      : 'bg-white border-[#E2D8CC] text-[#5C5047] hover:bg-[#F5EFEB]'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomCat(true)}
                className={`py-1.5 px-2.5 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                  isCustomCat
                    ? 'bg-[#3D352E] border-[#3D352E] text-[#FAF7F2] font-semibold'
                    : 'bg-white border-[#E2D8CC] text-[#5C5047] hover:bg-[#F5EFEB]'
                }`}
              >
                + Kustom
              </button>
            </div>
            {isCustomCat && (
              <input
                type="text"
                value={customKategori}
                onChange={(e) => setCustomKategori(e.target.value)}
                placeholder="Masukkan kategori kustom..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#E2D8CC] rounded-lg focus:outline-none text-[#2D2825]"
              />
            )}
          </div>

          {/* Prioritas & Batas Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C5047] uppercase tracking-wider mb-1.5">
                Prioritas
              </label>
              <div className="flex gap-2">
                {(['Tinggi', 'Sedang', 'Rendah'] as PriorityLevel[]).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPrioritas(p)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                      prioritas === p
                        ? p === 'Tinggi'
                          ? 'bg-[#F9E6E2] border-[#EED7D2] text-[#9E3E34]'
                          : p === 'Sedang'
                          ? 'bg-[#FDF2E2] border-[#E6DEC8] text-[#8C5E28]'
                          : 'bg-[#EBF2EB] border-[#D6E3D3] text-[#3D6B42]'
                        : 'bg-white border-[#E2D8CC] text-[#6B5E54] hover:bg-[#F5EFEB]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5047] uppercase tracking-wider mb-1.5">
                Batas Waktu (Deadline)
              </label>
              <input
                type="text"
                value={batasWaktu}
                onChange={(e) => setBatasWaktu(e.target.value)}
                placeholder="Contoh: Besok, 12:00"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E2D8CC] rounded-lg focus:outline-none text-[#2D2825]"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-[#5C5047] uppercase tracking-wider mb-1.5">
              Catatan / Deskripsi Tambahan
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Tuliskan detail atau instruksi catatan..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E2D8CC] rounded-lg focus:outline-none text-[#2D2825]"
            />
          </div>

          {/* Status jika edit */}
          {initialTask && (
            <div>
              <label className="block text-xs font-semibold text-[#5C5047] uppercase tracking-wider mb-1.5">
                Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs cursor-pointer text-[#4A3E36]">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'Belum Selesai'}
                    onChange={() => setStatus('Belum Selesai')}
                    className="text-[#3D352E] focus:ring-[#8C7A6B]"
                  />
                  <span>Belum Selesai</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer text-[#3D6B42] font-semibold">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'Selesai'}
                    onChange={() => setStatus('Selesai')}
                    className="text-[#4A6B5B] focus:ring-[#4A6B5B]"
                  />
                  <span>Selesai ✓</span>
                </label>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6B5E54] hover:text-[#2D2825] bg-white border border-[#E2D8CC] rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-[#FAF7F2] bg-[#3D352E] hover:bg-[#2A241F] rounded-xl shadow-paper transition-all cursor-pointer"
            >
              {initialTask ? 'Simpan Catatan' : 'Tambahkan ke Buku Catatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
