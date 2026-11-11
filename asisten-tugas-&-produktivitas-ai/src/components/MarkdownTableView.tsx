import React, { useState } from 'react';
import { TaskItem } from '../types/task';
import { generateMarkdownTable } from '../data/defaultTasks';
import { 
  Copy, 
  Check, 
  FileText, 
  Download, 
  Code, 
  Eye, 
  BookOpen,
  Info
} from 'lucide-react';

interface MarkdownTableViewProps {
  tasks: TaskItem[];
}

export const MarkdownTableView: React.FC<MarkdownTableViewProps> = ({ tasks }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  const markdownString = generateMarkdownTable(tasks);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdownString], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daftar_Catatan_Tugas_${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCsv = () => {
    let csv = 'No,Nama Tugas,Kategori,Prioritas,Batas Waktu,Status\n';
    tasks.forEach((t, i) => {
      const escapedNama = `"${t.nama.replace(/"/g, '""')}"`;
      const escapedDeadline = `"${t.batasWaktu.replace(/"/g, '""')}"`;
      csv += `${i + 1},${escapedNama},${t.kategori},${t.prioritas},${escapedDeadline},${t.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daftar_Catatan_Tugas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white/80 border border-[#E8DFD5] rounded-2xl shadow-paper overflow-hidden">
      {/* Header bar */}
      <div className="p-5 border-b border-[#EFE8DF] bg-[#FAF7F2]/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#3D352E]" />
            <h3 className="text-base font-bold font-editorial text-[#2D2825]">
              Buku Jurnal & Tabel Markdown Resmi
            </h3>
            <span className="text-xs bg-[#EAE1D7] text-[#4A3E36] px-2 py-0.5 rounded-md font-semibold">
              {tasks.length} Catatan
            </span>
          </div>
          <p className="text-xs text-[#7A6E65] mt-1 font-sans">
            Tersusun rapi dalam format tabel Markdown standar untuk dokumentasi dan sinkronisasi.
          </p>
        </div>

        {/* View mode toggle & action buttons */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex p-1 rounded-lg bg-[#EFE8DF] text-xs font-medium">
            <button
              onClick={() => setViewMode('preview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white text-[#2D2825] shadow-xs font-semibold'
                  : 'text-[#6B5E54] hover:text-[#2D2825]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Tampilan Jurnal</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-white text-[#2D2825] shadow-xs font-semibold'
                  : 'text-[#6B5E54] hover:text-[#2D2825]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Kode Mentah (.md)</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2D2825] hover:text-[#1E1915] bg-white border border-[#E2D8CC] rounded-lg shadow-paper hover:bg-[#F5EFEB] transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#4A6B5B]" />
                <span className="text-[#4A6B5B]">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Markdown</span>
              </>
            )}
          </button>

          {/* Export Buttons */}
          <button
            onClick={handleDownloadMd}
            title="Unduh file .md"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#5C5047] hover:text-[#2D2825] bg-white border border-[#E2D8CC] rounded-lg hover:bg-[#F5EFEB] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">.MD</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            title="Unduh file .csv"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#5C5047] hover:text-[#2D2825] bg-white border border-[#E2D8CC] rounded-lg hover:bg-[#F5EFEB] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">.CSV</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6">
        {viewMode === 'preview' ? (
          <div className="overflow-x-auto rounded-xl border border-[#E8DFD5] bg-[#FDFBF7] shadow-paper">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F5EFEB] border-b border-[#E8DFD5] text-xs font-bold text-[#5C5047] uppercase tracking-wider">
                  <th className="py-3 px-4 border-r border-[#E8DFD5] text-center w-14">No</th>
                  <th className="py-3 px-4 border-r border-[#E8DFD5] min-w-[240px]">Nama Tugas</th>
                  <th className="py-3 px-4 border-r border-[#E8DFD5] w-32">Kategori</th>
                  <th className="py-3 px-4 border-r border-[#E8DFD5] w-28">Prioritas</th>
                  <th className="py-3 px-4 border-r border-[#E8DFD5] w-44">Batas Waktu</th>
                  <th className="py-3 px-4 w-32 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8DF] text-xs">
                {tasks.map((task, index) => (
                  <tr key={task.id || index} className="hover:bg-[#F7F2EC] transition-colors">
                    <td className="py-3 px-4 border-r border-[#E8DFD5] text-center text-[#7A6E65] font-medium">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 border-r border-[#E8DFD5] text-[#2D2825] font-medium">
                      {task.nama}
                    </td>
                    <td className="py-3 px-4 border-r border-[#E8DFD5] text-[#5C5047]">
                      {task.kategori}
                    </td>
                    <td className="py-3 px-4 border-r border-[#E8DFD5]">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        task.prioritas === 'Tinggi' ? 'bg-[#F9E6E2] text-[#9E3E34]' :
                        task.prioritas === 'Sedang' ? 'bg-[#FDF2E2] text-[#8C5E28]' :
                        'bg-[#EBF2EB] text-[#3D6B42]'
                      }`}>
                        {task.prioritas}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-[#E8DFD5] text-[#6B5E54]">
                      {task.batasWaktu}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-medium ${
                        task.status === 'Selesai' 
                          ? 'bg-[#EBF2EB] text-[#3D6B42] border border-[#D6E3D3]' 
                          : 'bg-[#F0E9DF] text-[#6B5E54]'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="relative">
            <pre className="p-4 rounded-xl bg-[#2D2825] text-[#FAF7F2] text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed border border-[#3E3731]">
              <code>{markdownString}</code>
            </pre>
          </div>
        )}

        <div className="mt-4 p-3.5 bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl flex items-start gap-2.5 text-xs text-[#5C5047]">
          <Info className="w-4 h-4 text-[#8C7A6B] flex-shrink-0 mt-0.5" />
          <p>
            Tabel ini otomatis disinkronkan setiap kali Anda menambah tugas, menandai selesai, atau menghapus tugas melalui kartu memo maupun asisten AI.
          </p>
        </div>
      </div>
    </div>
  );
};
