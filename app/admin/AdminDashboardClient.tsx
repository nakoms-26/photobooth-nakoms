'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Image as ImageIcon,
  Film,
  Camera,
  Download,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  Layers,
  Sparkles,
  FileSpreadsheet,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Lock,
  KeyRound,
  EyeOff,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

const ADMIN_PASSWORD = 'kandangwebs';
const AUTH_STORAGE_KEY = 'medkombox_admin_auth';

export interface AdminSessionItem {
  id: string;
  pngPath: string;
  gifPath?: string | null;
  photo1Path?: string | null;
  photo2Path?: string | null;
  photo3Path?: string | null;
  createdAt: string;
}

export interface AdminStats {
  totalSessions: number;
  todaySessions: number;
  gifGenerated: number;
  estimatedTotalFiles: number;
}

interface AdminDashboardClientProps {
  initialSessions: AdminSessionItem[];
  initialStats: AdminStats;
}

export default function AdminDashboardClient({
  initialSessions,
  initialStats,
}: AdminDashboardClientProps) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Data state
  const [sessions, setSessions] = useState<AdminSessionItem[]>(initialSessions);
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_gif' | 'with_raw'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedAllStatus, setCopiedAllStatus] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activePreview, setActivePreview] = useState<{ url: string; title: string; type: 'image' | 'video' | 'gif' } | null>(null);

  // Delete State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'today' | 'date';
    targetId?: string;
    targetDate?: string;
    targetTitle?: string;
  }>({
    isOpen: false,
    type: 'single',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Check auth from sessionStorage on mount
  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundFx.playClickSound();

    if (passwordInput.trim() === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, ADMIN_PASSWORD);
      } catch (err) {
        console.warn('Failed to save to sessionStorage:', err);
      }
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 3000);
    }
  };

  const handleLogout = () => {
    soundFx.playClickSound();
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMessage({ text, type });
    setTimeout(() => setAlertMessage(null), 3500);
  };

  const refreshData = async () => {
    soundFx.playClickSound();
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/sessions?limit=500', {
        headers: { 'x-admin-key': ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions || []);
          if (data.stats) setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to refresh admin sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeDelete = async () => {
    soundFx.playClickSound();
    setIsDeleting(true);

    try {
      let bodyData: Record<string, unknown> = {};
      if (deleteModal.type === 'single' && deleteModal.targetId) {
        bodyData = { id: deleteModal.targetId };
      } else if (deleteModal.type === 'today') {
        bodyData = { scope: 'today' };
      } else if (deleteModal.type === 'date' && deleteModal.targetDate) {
        bodyData = { date: deleteModal.targetDate };
      }

      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_PASSWORD,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (data.success) {
        showAlert(data.message || `Berhasil menghapus ${data.deletedCount} sesi!`, 'success');
        setDeleteModal({ isOpen: false, type: 'single' });
        // Refresh data
        await refreshData();
      } else {
        showAlert(data.error || 'Gagal menghapus sesi', 'error');
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      showAlert('Terjadi kesalahan jaringan saat menghapus', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'id' | 'link', id: string) => {
    soundFx.playClickSound();
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handleExportCSV = () => {
    soundFx.playClickSound();
    if (sessions.length === 0) return;

    const headers = ['ID Sesi', 'Waktu Dibuat', 'Link Download Page', 'Link Strip PNG', 'Link GIF', 'Link Raw 1', 'Link Raw 2', 'Link Raw 3'];
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    const rows = filteredSessions.map((s) => [
      s.id,
      `"${new Date(s.createdAt).toLocaleString('id-ID')}"`,
      `"${origin}/download/${s.id}"`,
      `"${s.pngPath || ''}"`,
      `"${s.gifPath || ''}"`,
      `"${s.photo1Path || ''}"`,
      `"${s.photo2Path || ''}"`,
      `"${s.photo3Path || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `medkombox-sessions-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAllLinks = () => {
    soundFx.playClickSound();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const textLines = filteredSessions.map(
      (s, idx) => `${idx + 1}. ID: ${s.id} | Download: ${origin}/download/${s.id} | Strip: ${s.pngPath}`
    ).join('\n');

    navigator.clipboard.writeText(textLines);
    setCopiedAllStatus(true);
    setTimeout(() => setCopiedAllStatus(false), 2500);
  };

  const handleDirectDownload = async (url: string, filenamePrefix: string, extension: string = 'jpg') => {
    soundFx.playClickSound();
    const filename = `${filenamePrefix}-${Date.now()}.${extension}`;
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        (s.createdAt && new Date(s.createdAt).toLocaleDateString('id-ID').toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterType === 'with_gif') {
        return Boolean(s.gifPath && s.gifPath.trim().length > 0 && s.gifPath !== 'PENDING');
      }

      if (filterType === 'with_raw') {
        return Boolean(s.photo1Path || s.photo2Path || s.photo3Path);
      }

      return true;
    });
  }, [sessions, searchQuery, filterType]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSessions.slice(start, start + itemsPerPage);
  }, [filteredSessions, currentPage, itemsPerPage]);

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const now = Date.now();
      const past = new Date(dateStr).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 60) return 'Baru saja';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} hari lalu`;
      return '';
    } catch {
      return '';
    }
  };

  // 1. Initial Loading check state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6">
        <div className="neo-box bg-white p-8 rounded-2xl flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
          <span className="font-chillax font-bold text-sm text-gray-700">
            Memuat Sistem Keamanan...
          </span>
        </div>
      </div>
    );
  }

  // 2. Password Gate Screen if NOT Authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-4 md:p-6 font-sans">
        <div className="max-w-md w-full neo-box bg-white p-6 md:p-8 rounded-2xl flex flex-col gap-6 animate-fadeIn">
          
          {/* Lock Icon & Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-yellow-300 border-2 border-black flex items-center justify-center shadow-[4px_4px_0_#000] mb-2">
              <Lock className="w-8 h-8 text-black stroke-[2.5]" />
            </div>
            <span className="px-3 py-1 bg-[var(--color-primary)] text-white text-[11px] font-chillax font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[2px_2px_0_#000]">
              Restricted Area
            </span>
            <h1 className="font-chillax font-black text-2xl md:text-3xl text-black">
              Admin Access Gate
            </h1>
            <p className="text-xs md:text-sm text-gray-600 font-medium">
              Masukkan password untuk mengakses database, link foto, dan panel kontrol photobooth.
            </p>
          </div>

          {/* Form Password */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-chillax font-bold text-gray-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Password Admin
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder="Masukkan password admin..."
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(false);
                  }}
                  autoFocus
                  className={`w-full pl-4 pr-11 py-3 bg-gray-50 border-2 rounded-xl text-sm font-bold tracking-wider text-black focus:outline-none focus:bg-white transition-colors ${
                    passwordError ? 'border-red-500 bg-red-50' : 'border-black'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black p-1"
                  tabIndex={-1}
                >
                  {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold mt-1 animate-fadeIn">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>Password salah! Silakan coba lagi.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="neo-btn-primary py-3.5 font-chillax font-bold text-sm flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-4 h-4" />
              Buka Panel Admin
            </button>
          </form>

          <div className="text-center border-t border-gray-200 pt-4">
            <span className="text-[11px] font-semibold text-gray-400">
              Medkom Box Photobooth &copy; 2026
            </span>
          </div>

        </div>
      </div>
    );
  }

  // 3. Full Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Alert Notification Popup */}
        {alertMessage && (
          <div
            className={`fixed top-5 right-5 z-50 p-4 rounded-xl border-2 border-black font-chillax font-bold text-sm shadow-[4px_4px_0_#000] flex items-center gap-3 animate-fadeIn ${
              alertMessage.type === 'success' ? 'bg-green-300 text-black' : 'bg-red-300 text-black'
            }`}
          >
            {alertMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span>{alertMessage.text}</span>
          </div>
        )}

        {/* Top Header Card */}
        <header className="neo-box bg-white p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[var(--color-primary)] text-white text-xs font-chillax font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[2px_2px_0_#000]">
                Admin Database
              </span>
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                Medkom Box Photobooth
              </span>
            </div>
            <h1 className="font-chillax font-black text-2xl md:text-4xl text-black">
              Gallery & Manajemen Foto
            </h1>
            <p className="text-xs md:text-sm text-gray-600 font-medium">
              Akses internal arsip semua hasil foto, link aset, download page, dan statistik generate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="neo-btn px-3.5 py-2 bg-white text-black font-chillax font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
              {isLoading ? 'Memuat...' : 'Refresh'}
            </button>

            <button
              onClick={handleExportCSV}
              className="neo-btn px-3.5 py-2 bg-yellow-300 text-black font-chillax font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="neo-btn px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-black font-chillax font-bold text-xs flex items-center justify-center gap-1.5"
              title="Keluar dari sesi admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </header>

        {/* 3 Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Total Sesi */}
          <div className="neo-box bg-white p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-chillax font-bold uppercase tracking-wider text-gray-600">
                Total Sesi Foto
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-100 border border-black flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-chillax font-black text-black">
              {stats.totalSessions.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] font-semibold text-gray-500">
              Sesi terdaftar di database
            </span>
          </div>

          {/* 2. Total GIF */}
          <div className="neo-box bg-white p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-chillax font-bold uppercase tracking-wider text-gray-600">
                Animasi GIF
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 border border-black flex items-center justify-center">
                <Film className="w-4 h-4 text-purple-700" />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-chillax font-black text-black">
              {stats.gifGenerated.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] font-semibold text-gray-500">
              Boomerang GIF berhasil dibuat
            </span>
          </div>

          {/* 3. Total File Dihasilkan */}
          <div className="neo-box bg-white p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-chillax font-bold uppercase tracking-wider text-gray-600">
                Total File Media
              </span>
              <div className="w-8 h-8 rounded-lg bg-green-100 border border-black flex items-center justify-center">
                <Layers className="w-4 h-4 text-green-700" />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-chillax font-black text-black">
              {(stats.totalSessions * 5).toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] font-semibold text-gray-500">
              Estimasi asset (Strip, GIF, 3 Raw)
            </span>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="neo-box bg-white p-4 md:p-6 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan ID sesi atau tanggal (cth: 22 Agu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `Semua (${sessions.length})` },
              { id: 'with_gif', label: `Dengan GIF (${stats.gifGenerated})` },
              { id: 'with_raw', label: 'Foto Mentah' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playClickSound();
                  setFilterType(tab.id as typeof filterType);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-chillax font-bold border-2 border-black transition-all ${
                  filterType === tab.id
                    ? 'bg-[var(--color-primary)] text-white shadow-[2px_2px_0_#000]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Toggle & Bulk Copy */}
          <div className="flex items-center gap-2 self-end md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-gray-200">
            <button
              onClick={handleCopyAllLinks}
              className="px-3 py-1.5 bg-gray-100 text-black border-2 border-black rounded-lg text-xs font-chillax font-bold flex items-center gap-1.5 shadow-[2px_2px_0_#000] active:translate-y-0.5 active:shadow-none transition-all"
              title="Salin semua link hasil filter ke clipboard"
            >
              {copiedAllStatus ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAllStatus ? 'Tersalin!' : 'Salin Semua Link'}
            </button>

            <div className="flex items-center border-2 border-black rounded-lg overflow-hidden bg-gray-100 p-0.5">
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  setViewMode('grid');
                }}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm font-bold text-black' : 'text-gray-500'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  setViewMode('table');
                }}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-sm font-bold text-black' : 'text-gray-500'}`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Sessions Content */}
        {filteredSessions.length === 0 ? (
          <div className="neo-box bg-white p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 border-2 border-black flex items-center justify-center text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-chillax font-bold text-lg text-black">
              Tidak Ada Foto yang Ditemukan
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              {searchQuery
                ? `Tidak ada sesi dengan kata kunci "${searchQuery}". Coba bersihkan pencarian.`
                : 'Belum ada foto yang digenerate di photobooth.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="neo-btn px-4 py-2 bg-white text-xs font-bold mt-2"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedSessions.map((session, index) => {
              const sessionIndex = (currentPage - 1) * itemsPerPage + index + 1;
              const hasGif = Boolean(session.gifPath && session.gifPath.trim().length > 0 && session.gifPath !== 'PENDING');
              const rawCount = [session.photo1Path, session.photo2Path, session.photo3Path].filter(Boolean).length;
              const downloadUrl = `/download/${session.id}`;

              return (
                <div
                  key={session.id}
                  className="neo-box bg-white p-5 rounded-2xl flex flex-col justify-between gap-4 hover:-translate-y-1 transition-all"
                >
                  {/* Card Top: ID, Number & Time */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-300 border-2 border-black rounded-full font-chillax font-black text-xs shadow-[2px_2px_0_#000]">
                        #{sessionIndex}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-500">
                          {getRelativeTime(session.createdAt)}
                        </span>
                        <button
                          onClick={() => {
                            soundFx.playClickSound();
                            setDeleteModal({
                              isOpen: true,
                              type: 'single',
                              targetId: session.id,
                              targetTitle: `Hapus Sesi #${session.id}`,
                            });
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus sesi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Session ID
                        </span>
                        <code className="text-xs font-bold font-mono text-black truncate max-w-[170px]">
                          {session.id}
                        </code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(session.id, 'id', session.id)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                        title="Salin ID Sesi"
                      >
                        {copiedId === session.id ? (
                          <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {formatDateTime(session.createdAt)}
                    </div>
                  </div>

                  {/* Card Previews: Strip + GIF side-by-side */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                    {/* PNG Strip Thumbnail */}
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-chillax font-bold text-gray-600 uppercase">
                        Photo Strip
                      </span>
                      <div
                        onClick={() => setActivePreview({ url: session.pngPath, title: `Photo Strip #${session.id}`, type: 'image' })}
                        className="relative group cursor-pointer w-full aspect-[2/3] bg-white border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center"
                      >
                        <img
                          src={session.pngPath}
                          alt="Strip"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <button
                        onClick={() => handleDirectDownload(session.pngPath, `strip-${session.id}`, 'jpg')}
                        className="w-full py-1 bg-white text-[10px] font-bold border border-black rounded shadow-[1px_1px_0_#000] flex items-center justify-center gap-1 hover:bg-gray-100 active:translate-y-0.5"
                      >
                        <Download className="w-3 h-3" /> Strip
                      </button>
                    </div>

                    {/* GIF Preview */}
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-chillax font-bold text-gray-600 uppercase">
                        Animasi GIF
                      </span>
                      <div
                        onClick={() => hasGif && setActivePreview({ url: session.gifPath!, title: `Animasi GIF #${session.id}`, type: 'gif' })}
                        className={`relative group w-full aspect-[2/3] bg-white border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center ${
                          hasGif ? 'cursor-pointer' : ''
                        }`}
                      >
                        {hasGif ? (
                          <>
                            <img
                              src={session.gifPath!}
                              alt="GIF"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center text-gray-400 gap-1">
                            <Film className="w-5 h-5" />
                            <span className="text-[9px] font-bold">No GIF</span>
                          </div>
                        )}
                      </div>
                      {hasGif ? (
                        <button
                          onClick={() => handleDirectDownload(session.gifPath!, `anim-${session.id}`, 'gif')}
                          className="w-full py-1 bg-yellow-300 text-[10px] font-bold border border-black rounded shadow-[1px_1px_0_#000] flex items-center justify-center gap-1 hover:bg-yellow-400 active:translate-y-0.5"
                        >
                          <Download className="w-3 h-3" /> GIF
                        </button>
                      ) : (
                        <div className="w-full py-1 text-[10px] text-gray-400 text-center font-bold">
                          -
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Raw Photos Micro Thumbs */}
                  {rawCount > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3 text-[var(--color-primary)]" />
                          {rawCount} Foto Mentah:
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { url: session.photo1Path, label: '#1' },
                          { url: session.photo2Path, label: '#2' },
                          { url: session.photo3Path, label: '#3' },
                        ].map((raw, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            {raw.url ? (
                              <div
                                onClick={() => setActivePreview({ url: raw.url!, title: `Raw Photo ${raw.label} #${session.id}`, type: 'image' })}
                                className="group relative aspect-square bg-gray-100 rounded-lg border border-black overflow-hidden cursor-pointer"
                              >
                                <img src={raw.url} alt={`Raw ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" loading="lazy" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-square bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-[9px] text-gray-400">
                                Kosong
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons: Open Download Page & Copy Link */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 bg-black text-white text-xs font-chillax font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Buka Page
                      </a>
                      <button
                        onClick={() => {
                          const fullUrl = `${window.location.origin}${downloadUrl}`;
                          copyToClipboard(fullUrl, 'link', session.id);
                        }}
                        className="py-2.5 px-3 bg-white text-black text-xs font-chillax font-bold rounded-xl border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-center gap-1.5 hover:bg-gray-100 active:translate-y-0.5 active:shadow-none transition-all"
                      >
                        {copiedLink === session.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            Tersalin!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Salin Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="neo-box bg-white rounded-2xl overflow-hidden border-2 border-black">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 border-b-2 border-black font-chillax font-bold text-gray-700 uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">No</th>
                    <th className="p-3.5">Session ID</th>
                    <th className="p-3.5">Waktu Generate</th>
                    <th className="p-3.5">Photo Strip</th>
                    <th className="p-3.5">Animasi GIF</th>
                    <th className="p-3.5">Foto Mentah</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {paginatedSessions.map((session, index) => {
                    const sessionIndex = (currentPage - 1) * itemsPerPage + index + 1;
                    const hasGif = Boolean(session.gifPath && session.gifPath.trim().length > 0 && session.gifPath !== 'PENDING');
                    const downloadUrl = `/download/${session.id}`;

                    return (
                      <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3.5 font-chillax font-bold text-gray-500">
                          #{sessionIndex}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono font-bold text-black bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                              {session.id}
                            </code>
                            <button
                              onClick={() => copyToClipboard(session.id, 'id', session.id)}
                              className="text-gray-400 hover:text-black p-1"
                              title="Salin ID"
                            >
                              {copiedId === session.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-gray-600">
                          {formatDateTime(session.createdAt)}
                          <div className="text-[10px] text-gray-400">{getRelativeTime(session.createdAt)}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div
                              onClick={() => setActivePreview({ url: session.pngPath, title: `Strip #${session.id}`, type: 'image' })}
                              className="w-8 h-12 bg-gray-100 rounded border border-black overflow-hidden cursor-pointer flex-shrink-0"
                            >
                              <img src={session.pngPath} alt="Strip" className="w-full h-full object-contain" />
                            </div>
                            <button
                              onClick={() => handleDirectDownload(session.pngPath, `strip-${session.id}`, 'jpg')}
                              className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-[11px]"
                            >
                              <Download className="w-3 h-3" /> Unduh
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5">
                          {hasGif ? (
                            <div className="flex items-center gap-2">
                              <div
                                onClick={() => setActivePreview({ url: session.gifPath!, title: `GIF #${session.id}`, type: 'gif' })}
                                className="w-8 h-12 bg-gray-100 rounded border border-black overflow-hidden cursor-pointer flex-shrink-0"
                              >
                                <img src={session.gifPath!} alt="GIF" className="w-full h-full object-cover" />
                              </div>
                              <button
                                onClick={() => handleDirectDownload(session.gifPath!, `anim-${session.id}`, 'gif')}
                                className="text-purple-600 hover:underline flex items-center gap-1 font-bold text-[11px]"
                              >
                                <Download className="w-3 h-3" /> GIF
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 font-semibold">-</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            {[session.photo1Path, session.photo2Path, session.photo3Path].map((p, pIdx) =>
                              p ? (
                                <div
                                  key={pIdx}
                                  onClick={() => setActivePreview({ url: p, title: `Raw #${pIdx + 1} (${session.id})`, type: 'image' })}
                                  className="w-7 h-7 bg-gray-100 rounded border border-black overflow-hidden cursor-pointer"
                                  title={`Raw #${pIdx + 1}`}
                                >
                                  <img src={p} alt={`Raw ${pIdx + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ) : null
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                const fullUrl = `${window.location.origin}${downloadUrl}`;
                                copyToClipboard(fullUrl, 'link', session.id);
                              }}
                              className="px-2.5 py-1 bg-white border border-black rounded text-[11px] font-bold shadow-[1px_1px_0_#000] flex items-center gap-1"
                            >
                              {copiedLink === session.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                              Link
                            </button>
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-black text-white rounded text-[11px] font-bold flex items-center gap-1 hover:bg-gray-800"
                            >
                              <ExternalLink className="w-3 h-3" /> Buka
                            </a>
                            <button
                              onClick={() => {
                                soundFx.playClickSound();
                                setDeleteModal({
                                  isOpen: true,
                                  type: 'single',
                                  targetId: session.id,
                                  targetTitle: `Hapus Sesi #${session.id}`,
                                });
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="neo-box bg-white p-4 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredSessions.length)} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredSessions.length)} dari {filteredSessions.length} sesi
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  setCurrentPage((p) => Math.max(p - 1, 1));
                }}
                disabled={currentPage === 1}
                className="p-2 neo-btn bg-white disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-chillax font-bold px-3 py-1 bg-gray-100 rounded-lg border border-black">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => {
                  soundFx.playClickSound();
                  setCurrentPage((p) => Math.min(p + 1, totalPages));
                }}
                disabled={currentPage === totalPages}
                className="p-2 neo-btn bg-white disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div
          onClick={() => !isDeleting && setDeleteModal({ isOpen: false, type: 'single' })}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neo-box bg-white p-6 rounded-2xl max-w-md w-full flex flex-col gap-4 animate-fadeIn border-2 border-black shadow-[6px_6px_0_#000]"
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 border-2 border-black flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-chillax font-bold text-lg text-black">
                Konfirmasi Hapus
              </h3>
            </div>

            <p className="text-xs font-medium text-gray-700 leading-relaxed">
              Apakah Anda yakin ingin menghapus {deleteModal.targetTitle || 'sesi ini'}? Tindakan ini akan menghapus data dari database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setDeleteModal({ isOpen: false, type: 'single' })}
                disabled={isDeleting}
                className="px-4 py-2 neo-btn bg-white text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2 neo-btn-danger text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Preview Modal */}
      {activePreview && (
        <div
          onClick={() => setActivePreview(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neo-box bg-white p-4 md:p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col gap-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <h3 className="font-chillax font-bold text-base text-black truncate pr-4">
                {activePreview.title}
              </h3>
              <button
                onClick={() => setActivePreview(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full flex-1 min-h-[300px] max-h-[60vh] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center p-2">
              <img
                src={activePreview.url}
                alt={activePreview.title}
                className="max-w-full max-h-[58vh] object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activePreview.url);
                  alert('URL file tersalin ke clipboard!');
                }}
                className="px-4 py-2 neo-btn bg-white text-xs font-bold flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" /> Salin URL Media
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={activePreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black border border-black rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" /> Buka Tab Baru
                </a>
                <button
                  onClick={() =>
                    handleDirectDownload(
                      activePreview.url,
                      'medkombox-preview',
                      activePreview.type === 'gif' ? 'gif' : 'jpg'
                    )
                  }
                  className="px-4 py-2 neo-btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Unduh File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
