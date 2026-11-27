'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Course, LectureItem } from '@/types';
import { countCourseStats, loadCourseDetails } from '@/lib/coursesData';
import { getWorkerProxyUrl, resolveDirectMediaUrl } from '@/lib/proxyConfig';
import { ArrowLeft, Folder, Search, LayoutGrid, List, Video, FileText, CheckCircle2, Play, Download, ExternalLink } from 'lucide-react';
import { LectureThumb, isPdfItem } from '@/components/LectureThumb';
import { getCanonicalLectureKey, isLectureWatched, syncLectureWatched } from '@/lib/progressSync';

const WebLectureThumb = LectureThumb;

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
  onPlayVideo: (playlist: LectureItem[], index: number) => void;
  onOpenPdf: (itemOrUrl: LectureItem | string, playlist?: LectureItem[], index?: number) => void;
  watchedUrls: Set<string>;
  initialFolderTabId?: string | null;
  onFolderTabChange?: (tabId: string | null) => void;
  theme?: 'light' | 'dark';
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course: initialCourse,
  onClose,
  onPlayVideo,
  onOpenPdf,
  watchedUrls,
  initialFolderTabId,
  onFolderTabChange,
  theme,
}) => {
  const [loadedCourse, setLoadedCourse] = useState<Course | null>(initialCourse);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  useEffect(() => {
    if (!initialCourse) {
      setLoadedCourse(null);
      return;
    }
    if (initialCourse.tabs || initialCourse.parmarData || initialCourse.prathamBySubject) {
      setLoadedCourse(initialCourse);
      return;
    }
    setLoadingDetails(true);
    let isCancelled = false;
    loadCourseDetails(initialCourse.id).then((detailed) => {
      if (!isCancelled && detailed) {
        setLoadedCourse(detailed);
      }
      if (!isCancelled) {
        setLoadingDetails(false);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [initialCourse]);

  const course = loadedCourse || initialCourse;
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [activeFolderTabId, setActiveFolderTabId] = useState<string | null>(initialFolderTabId || null);
  const [activeModuleFilter, setActiveModuleFilter] = useState<string>('All Modules');
  const [activeMediaFilter, setActiveMediaFilter] = useState<'all' | 'videos' | 'pdfs'>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [visibleLimit, setVisibleLimit] = useState<number>(40);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const formatItemDuration = (secs?: number): string | null => {
    if (!secs || isNaN(secs) || secs <= 0) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Reset pagination limit when switching filters, tabs, or searching
  useEffect(() => {
    setVisibleLimit(40);
  }, [activeTabId, activeFolderTabId, activeModuleFilter, activeMediaFilter, filterSearch]);

  // Load saved view mode preference (defaults to grid)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stutosed_lecture_view_mode_v2') as 'list' | 'grid';
      if (saved === 'list' || saved === 'grid') setViewMode(saved);
    } catch {}
  }, []);

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem('stutosed_lecture_view_mode_v2', mode);
    } catch {}
  };

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const resetOverlayScroll = () => {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = 0;
    }
    const el = document.getElementById('course-overlay');
    if (el) {
      el.scrollTop = 0;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  };

  // Build unified sections/chapters across tabs, Parmar subjects, and Pratham subjects
  const sections = useMemo<
    Array<{ id: string; label: string; subname?: string; items: LectureItem[] }>
  >(() => {
    if (!course) return [];

    if (course.tabs && course.tabs.length > 0) {
      return course.tabs.map((t) => ({
        id: t.id,
        label: t.label,
        subname: t.subname,
        items: t.items || [],
      }));
    }

    if (course.isParmar && course.parmarData) {
      return Object.keys(course.parmarData).map((subj) => {
        const parmarLectures = course.parmarData![subj]?.lectures || [];
        const items: LectureItem[] = [];
        parmarLectures.forEach((lec, idx) => {
          const videoUrl = lec.links?.url ? resolveDirectMediaUrl(lec.links.url) : '';
          items.push({
            id: `${subj}-${idx}`,
            label: lec.title,
            url: videoUrl,
            type: videoUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'hls',
            folderName: subj,
            subject: subj,
            links: lec.links,
          });
          // Extract section PDFs (Notes EN/HI, Handwritten, Quiz) so they appear in this section & PDF filter
          const pdfFields: Array<{ key: string; suffix: string }> = [
            { key: 'notes_en', suffix: 'Notes (English)' },
            { key: 'notes_hi', suffix: 'Notes (Hindi)' },
            { key: 'handwritten', suffix: 'Handwritten Notes' },
            { key: 'quiz', suffix: 'Practice Quiz PDF' },
          ];
          pdfFields.forEach(({ key, suffix }) => {
            const pdfUrl = lec.links?.[key];
            if (pdfUrl && typeof pdfUrl === 'string' && pdfUrl.startsWith('http')) {
              items.push({
                id: `${subj}-${idx}-${key}`,
                label: `${lec.title} • ${suffix}`,
                url: resolveDirectMediaUrl(pdfUrl),
                type: 'pdf',
                category: 'pdfs',
                folderName: subj,
                subject: subj,
              });
            }
          });
        });
        return {
          id: subj,
          label: subj,
          subname: `${parmarLectures.length} Lectures & Notes`,
          items,
        };
      });
    }

    if (course.isPratham && course.prathamBySubject) {
      return Object.keys(course.prathamBySubject)
        .filter((k) => k !== 'No Topic')
        .map((subj) => ({
          id: subj,
          label: subj,
          items: (course.prathamBySubject![subj] || []).map((it) => ({ ...it, subject: subj })),
        }));
    }

    return [];
  }, [course]);

  const isMultiSection = sections.length > 1;

  useEffect(() => {
    if (!course) return;
    setFilterSearch('');
    setIsSearchExpanded(false);
    setActiveModuleFilter('All Modules');
    setActiveMediaFilter('all');

    if (sections.length > 1) {
      if (initialFolderTabId && sections.some((s) => s.id === initialFolderTabId)) {
        setActiveFolderTabId(initialFolderTabId);
        setActiveTabId(initialFolderTabId);
      } else {
        setActiveFolderTabId(null);
        setActiveTabId(sections[0].id);
      }
    } else if (sections.length === 1) {
      setActiveFolderTabId(sections[0].id);
      setActiveTabId(sections[0].id);
    } else {
      setActiveFolderTabId(null);
      setActiveTabId('');
    }
    resetOverlayScroll();
  }, [course, sections.length]);

  // Ensure view is pinned at the top whenever folder tab, tab, or module filter changes
  useEffect(() => {
    resetOverlayScroll();
  }, [activeFolderTabId, activeTabId, activeModuleFilter]);

  // Sync folder tab when initialFolderTabId prop changes from back navigation / popstate
  useEffect(() => {
    if (isMultiSection) {
      setActiveFolderTabId(initialFolderTabId || null);
      if (initialFolderTabId) {
        setActiveTabId(initialFolderTabId);
      }
      resetOverlayScroll();
    }
  }, [initialFolderTabId, isMultiSection]);

  // Click outside to collapse search if empty
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        if (!filterSearch.trim()) {
          setIsSearchExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterSearch]);

  // Selected folder/section
  const selectedFolderTab = activeFolderTabId
    ? sections.find((s) => s.id === activeFolderTabId) || null
    : sections.length === 1
    ? sections[0]
    : null;

  // Extract distinct sub-modules / subjects inside a section (e.g. BEU modules)
  const folderModules = useMemo(() => {
    if (!selectedFolderTab) return [];
    const set = new Set<string>();
    selectedFolderTab.items.forEach((it) => {
      if (it.subject) set.add(it.subject);
    });
    const list = Array.from(set);
    if (list.length <= 1) return [];
    const isModuleNaming = list.some((s) => s.toLowerCase().startsWith('module'));
    const allLabel = isModuleNaming ? 'All Modules' : 'All Subjects';
    return [allLabel, ...list];
  }, [selectedFolderTab]);

  const activeItems = useMemo(() => {
    if (!course) return [];
    const search = filterSearch.toLowerCase().trim();
    const targetSection = selectedFolderTab || sections.find((s) => s.id === activeTabId) || sections[0];
    let items = targetSection ? targetSection.items : [];

    if (activeModuleFilter !== 'All Modules' && activeModuleFilter !== 'All Subjects') {
      items = items.filter((i) => i.subject === activeModuleFilter);
    }

    if (activeMediaFilter === 'videos') {
      items = items.filter((i) => !isPdfItem(i));
    } else if (activeMediaFilter === 'pdfs') {
      items = items.filter((i) => isPdfItem(i));
    }

    return search
      ? items.filter(
          (i) =>
            (i.label || '').toLowerCase().includes(search) ||
            (i.subject || '').toLowerCase().includes(search)
        )
      : items;
  }, [course, sections, selectedFolderTab, activeTabId, activeModuleFilter, activeMediaFilter, filterSearch]);

  // Progressive rendering slice to eliminate DOM freezing on large batches
  const renderedItems = useMemo(() => {
    return activeItems.slice(0, visibleLimit);
  }, [activeItems, visibleLimit]);

  if (!course) return null;
  const stats = countCourseStats(course);

  const saveMemory = (url: string) => {
    localStorage.setItem(
      `stutosed-last-lec-${course.id}`,
      JSON.stringify({
        tabId: isMultiSection ? activeFolderTabId : activeTabId,
        url,
        timestamp: Date.now(),
      })
    );
  };

  // Detect YouTube video URLs
  const isYouTubeItem = (item: LectureItem) => {
    const u = item.url || '';
    return item.type === 'youtube' || u.includes('youtube.com') || u.includes('youtu.be');
  };

  // Direct download PDF handler
  const handleDownloadPdf = async (e: React.MouseEvent, item: LectureItem) => {
    e.stopPropagation();
    const filename = `${item.label.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'document'}.pdf`;
    const targetUrl = item.downloadUrl || item.url;

    // For direct Catbox or .pdf URLs, fetch and save directly without worker proxy
    if (targetUrl.includes('catbox.moe') || targetUrl.toLowerCase().includes('.pdf')) {
      try {
        const res = await fetch(targetUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
          return;
        }
      } catch {
        // Fallback to direct window open if fetch has CORS restriction
      }
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const downloadApiUrl = getWorkerProxyUrl(targetUrl, 'pdf');
    try {
      const res = await fetch(downloadApiUrl);
      if (!res.ok) throw new Error('Download error');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(downloadApiUrl, '_blank');
    }
  };

  // Centralized lecture item click handler (direct YouTube open, bot link open, PDF modal, or video player)
  const handleItemClick = (item: LectureItem, idx: number) => {
    const videoPlaylist = activeItems.filter((lecture) => lecture.type !== 'pdf');
    const targetPlaylist = item.type === 'pdf' ? activeItems : videoPlaylist;
    const targetIndex = targetPlaylist.indexOf(item);

    if (item.url && item.type !== 'pdf') {
      saveMemory(item.url);
    }
    if (isYouTubeItem(item)) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    const targetUrl = (item.url || '').toLowerCase();
    const isBot =
      targetUrl.includes('publicbotshub') ||
      targetUrl.includes('file-stream-bot') ||
      targetUrl.includes('herokuapp.com') ||
      targetUrl.includes('t.me') ||
      item.servers?.some(
        (s) =>
          s.url?.toLowerCase().includes('publicbotshub') ||
          s.url?.toLowerCase().includes('herokuapp.com')
      );
    if (isBot) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (item.type === 'pdf') {
      const directUrl = item.downloadUrl || item.url;
      if (directUrl.includes('catbox.moe') || directUrl.toLowerCase().includes('.pdf')) {
        window.open(directUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      onOpenPdf(item, activeItems, activeItems.indexOf(item) >= 0 ? activeItems.indexOf(item) : idx);
      return;
    }
    if (!item.url && item.links) {
      const firstPdf = item.links.notes_en || item.links.en_pdf || item.links.notes_hi || item.links.hi_pdf || item.links.handwritten;
      if (firstPdf) {
        const target = resolveDirectMediaUrl(firstPdf);
        window.open(target, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    onPlayVideo(targetPlaylist, targetIndex >= 0 ? targetIndex : idx);
  };

  return (
    <div ref={overlayRef} id="course-overlay" className="open" role="dialog" aria-modal="true">
      {/* 1. TOP STICKY APP BAR */}
      <div className="overlay-bar">
        {/* Right: Expandable Search Bar */}
        <div
          ref={searchContainerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            marginLeft: 'auto',
            width: isSearchExpanded ? 'min(320px, calc(100vw - 80px))' : 'auto',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isSearchExpanded || filterSearch.trim() ? (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Search
                width={15}
                height={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: 'var(--accent)',
                  pointerEvents: 'none',
                }}
              />
              <input
                ref={searchInputRef}
                id="overlay-search"
                type="search"
                placeholder="Search topics, lectures…"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                onBlur={() => {
                  if (!filterSearch.trim()) {
                    setIsSearchExpanded(false);
                  }
                }}
                autoFocus
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 34px 0 36px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--accent)',
                  color: 'var(--text)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(204, 120, 92, 0.15)',
                }}
              />
              {filterSearch && (
                <button
                  onClick={() => setFilterSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '2px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setIsSearchExpanded(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              aria-label="Search"
              title="Search lectures"
              className="overlay-icon-btn"
            >
              <Search width={18} height={18} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      {/* 2. COURSE IDENTITY & BACK BUTTON */}
      <div className="overlay-course-header">
        <button
          className="overlay-header-back-btn"
          onClick={() => {
            if (isMultiSection && activeFolderTabId) {
              setActiveFolderTabId(null);
              setActiveModuleFilter('All Modules');
              setActiveMediaFilter('all');
              setFilterSearch('');
              onFolderTabChange?.(null);
              resetOverlayScroll();
            } else {
              onClose();
            }
          }}
          title={isMultiSection && activeFolderTabId ? 'Back to Chapters / Sections' : 'Close Course'}
          aria-label="Back"
        >
          <ArrowLeft width={18} height={18} strokeWidth={2.4} />
        </button>

        <div className="overlay-header-titles">
          <h2 className="overlay-header-title">
            {course.id === 'beu-1st-year' ? '1st year' : course.name}
          </h2>
          <div className="overlay-header-sub">
            {course.id === 'beu-1st-year'
              ? `${selectedFolderTab ? selectedFolderTab.label + ' · ' : ''}Bihar Engineering University`
              : [course.teacher, selectedFolderTab ? selectedFolderTab.label : course.subname]
                  .filter(Boolean)
                  .filter((val, idx, arr) => arr.indexOf(val) === idx)
                  .join(' · ')}
          </div>
        </div>
      </div>

      {/* Sub-module pills inside selected section (e.g. BEU Modules) */}
      {(!isMultiSection || activeFolderTabId) && folderModules.length > 1 && (
        <div className="overlay-pill-tabs no-scrollbar" id="overlay-tabs">
          {folderModules.map((mod) => (
            <button
              key={mod}
              onClick={() => setActiveModuleFilter(mod)}
              className={`pill-tab-item ${activeModuleFilter === mod ? 'active' : ''}`}
            >
              {mod}
            </button>
          ))}
        </div>
      )}

      {/* 4. CONTROLS STRIP (VIEW TOGGLE & SECTION MEDIA FILTER) */}
      {(!isMultiSection || activeFolderTabId) && (
        <div className="overlay-controls-strip">
          <div className="controls-left-group">
            <div className="view-mode-segmented">
              <button
                onClick={() => handleViewModeChange('list')}
                title="List View"
                aria-label="List View"
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                <List width={16} height={16} strokeWidth={2.2} />
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                title="Grid View"
                aria-label="Grid View"
                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              >
                <LayoutGrid width={16} height={16} strokeWidth={2.2} />
              </button>
            </div>
            <span className="lecture-count-badge">
              {selectedFolderTab ? selectedFolderTab.label : 'Lectures & Notes'}
            </span>
          </div>

          {/* Media Type Filter (All / Lectures / PDFs in this section) */}
          {(() => {
            const rawList = selectedFolderTab?.items || [];
            const pdfCount = rawList.filter((i) => isPdfItem(i)).length;
            const vidCount = rawList.length - pdfCount;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {([
                  { key: 'all' as const, label: `All (${rawList.length})` },
                  { key: 'videos' as const, label: `Lectures (${vidCount})` },
                  { key: 'pdfs' as const, label: `PDFs (${pdfCount})` },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveMediaFilter(key)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      borderRadius: 'var(--r-pill)',
                      border: '1px solid',
                      borderColor: activeMediaFilter === key ? 'var(--accent)' : 'var(--border)',
                      background: activeMediaFilter === key ? 'var(--accent)' : 'transparent',
                      color: activeMediaFilter === key ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* OVERLAY CONTENT */}
      <div className="overlay-content" id="overlay-content">
        {/* CASE 1: FOLDER-FIRST CHAPTERS / SECTIONS DIRECTORY (No horizontal tab sliding!) */}
        {isMultiSection && !activeFolderTabId ? (
          <div style={{ padding: '24px 20px 48px', maxWidth: '880px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Folder width={20} height={20} style={{ color: 'var(--accent)' }} />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                {course.name} — Chapters &amp; Sections ({sections.length})
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '18px',
              }}
            >
              {sections
                .filter((sec) => {
                  const q = filterSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    sec.label.toLowerCase().includes(q) ||
                    sec.items.some((it) => (it.label || '').toLowerCase().includes(q))
                  );
                })
                .map((sec) => {
                  const pdfs = sec.items.filter((i) => isPdfItem(i)).length;
                  const vids = sec.items.length - pdfs;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => {
                        setActiveFolderTabId(sec.id);
                        setActiveTabId(sec.id);
                        onFolderTabChange?.(sec.id);
                        setActiveModuleFilter('All Modules');
                        setActiveMediaFilter('all');
                        setFilterSearch('');
                        resetOverlayScroll();
                      }}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-xl)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: 'var(--sh-card)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      className="subject-folder-card"
                    >
                      <div
                        style={{
                          padding: '18px 20px 14px',
                          background: 'linear-gradient(135deg, rgba(204, 120, 92, 0.12) 0%, rgba(204, 120, 92, 0.02) 100%)',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--r-md)',
                            background: 'rgba(204, 120, 92, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent)',
                            flexShrink: 0,
                          }}
                        >
                          <Folder width={20} height={20} />
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--accent)',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            padding: '3px 9px',
                            borderRadius: 'var(--r-pill)',
                          }}
                        >
                          {vids} Lectures • {pdfs} PDFs
                        </span>
                      </div>

                      <div style={{ padding: '16px 18px' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '17px',
                            fontWeight: 700,
                            color: 'var(--text)',
                            marginBottom: '6px',
                          }}
                        >
                          {sec.label}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                          {sec.subname || `${vids} Video Lectures & ${pdfs} Notes/PDFs`}
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--accent)',
                          }}
                        >
                          <span>Open Chapter</span> →
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          /* CASE 2: VIDEO & RESOURCE LIST / GRID */
          <div>
            {isMultiSection && activeFolderTabId && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                }}
              >
                <button
                  onClick={() => {
                    setActiveFolderTabId(null);
                    setActiveModuleFilter('All Modules');
                    setActiveMediaFilter('all');
                    setFilterSearch('');
                    onFolderTabChange?.(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <ArrowLeft width={16} height={16} />
                  <span>Back to Chapters ({sections.length})</span>
                </button>
              </div>
            )}

            {activeItems.length === 0 ? (
              <div className="no-results">No resources found in this category.</div>
            ) : (() => {
              const videoItems = renderedItems.filter((i) => !isPdfItem(i));
              const pdfItems = renderedItems.filter((i) => isPdfItem(i));
              const hasBoth = videoItems.length > 0 && pdfItems.length > 0;

              const renderVideoCard = (item: LectureItem, idx: number) => {
                const isWatched = isLectureWatched(item, watchedUrls);
                const isYt = isYouTubeItem(item);

                return (
                  <div
                    key={item.id || idx}
                    data-lecture-url={item.url}
                    className={`lecture-card-grid ${isWatched ? 'watched' : ''}`}
                    onClick={() => handleItemClick(item, idx)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                    }}
                  >
                    <WebLectureThumb
                      item={item}
                      index={idx}
                      isWatched={isWatched}
                      variant="grid"
                    />

                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                      {/* Top Header Row: Index & Duration & Status */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          marginBottom: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--accent)',
                              background: 'rgba(204,120,92,0.12)',
                              padding: '2.5px 7px',
                              borderRadius: 'var(--r-sm)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            #{idx + 1}
                          </span>
                          {item.subject && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                background: 'var(--bg-card-subtle)',
                                padding: '2px 7px',
                                borderRadius: 'var(--r-sm)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {item.subject}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.duration ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {formatItemDuration(item.duration)}
                            </span>
                          ) : null}
                          {item.id?.startsWith('pending-') && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#f59e0b',
                                background: 'rgba(245,158,11,0.12)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                              }}
                            >
                              In Queue
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Lecture Title */}
                      <h4
                        style={{
                          fontSize: '14.5px',
                          fontWeight: 600,
                          color: 'var(--text)',
                          lineHeight: 1.4,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.label}
                      </h4>

                    {/* Bot/Parmar Attachment links & Action Bar */}
                    <div
                      style={{
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {item.links && Object.keys(item.links).some((k) => k !== 'url') && (
                          <>
                            {(item.links.notes_en || item.links.en_pdf) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const target = resolveDirectMediaUrl(item.links!.notes_en || item.links!.en_pdf);
                                  window.open(target, '_blank', 'noopener,noreferrer');
                                }}
                                title="Open English Notes"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '3px 7px',
                                  fontSize: '10.5px',
                                  fontWeight: 600,
                                  borderRadius: 'var(--r-sm)',
                                  border: '1px solid var(--border)',
                                  background: 'var(--bg-card-hover)',
                                  color: 'var(--accent)',
                                  cursor: 'pointer',
                                }}
                              >
                                <FileText width={11} height={11} /> Notes EN
                              </button>
                            )}
                            {(item.links.notes_hi || item.links.hi_pdf) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const target = resolveDirectMediaUrl(item.links!.notes_hi || item.links!.hi_pdf);
                                  window.open(target, '_blank', 'noopener,noreferrer');
                                }}
                                title="Open Hindi Notes"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '3px 7px',
                                  fontSize: '10.5px',
                                  fontWeight: 600,
                                  borderRadius: 'var(--r-sm)',
                                  border: '1px solid var(--border)',
                                  background: 'var(--bg-card-hover)',
                                  color: 'var(--accent)',
                                  cursor: 'pointer',
                                }}
                              >
                                <FileText width={11} height={11} /> Notes HI
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: isYt ? '#ff4b4b' : 'var(--accent)',
                          }}
                        >
                          {isYt ? (
                            <>
                              <ExternalLink width={12} height={12} /> Open
                            </>
                          ) : (
                            <>
                              <Play width={12} height={12} fill="currentColor" /> Play
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                );
              };

              const renderPdfCard = (item: LectureItem, idx: number) => {
                const isWatched = isLectureWatched(item, watchedUrls);
                const directUrl = item.downloadUrl || item.url;

                return (
                  <div
                    key={item.id || idx}
                    data-lecture-url={item.url}
                    className={`pdf-card-grid ${isWatched ? 'watched' : ''}`}
                    onClick={() => handleItemClick(item, idx)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        padding: '14px 16px 12px',
                        background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.12) 0%, rgba(204, 120, 92, 0.04) 100%)',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--r-md)',
                            background: 'rgba(204, 120, 92, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent)',
                            flexShrink: 0,
                          }}
                        >
                          <FileText width={20} height={20} />
                        </div>
                        <div>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              color: 'var(--accent)',
                            }}
                          >
                            PDF Document
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {item.subject || 'Practice & Notes'}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--r-pill)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        #{idx + 1}
                      </span>
                    </div>

                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: 'var(--text)',
                          lineHeight: 1.4,
                          marginBottom: '14px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={item.label}
                      >
                        {item.label}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(directUrl, '_blank', 'noopener,noreferrer');
                          }}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            borderRadius: 'var(--r-sm)',
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                          }}
                        >
                          <ExternalLink width={12} height={12} />
                          <span>Open PDF</span>
                        </button>
                        <button
                          onClick={(e) => handleDownloadPdf(e, item)}
                          title="Download PDF"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 10px',
                            borderRadius: 'var(--r-sm)',
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          <Download width={13} height={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              };

              const renderVideoRow = (item: LectureItem, idx: number) => {
                const isWatched = isLectureWatched(item, watchedUrls);
                const isYt = isYouTubeItem(item);

                return (
                  <div
                    key={item.id || idx}
                    data-lecture-url={item.url}
                    className={`video-row ${isWatched ? 'watched' : ''}`}
                    onClick={() => handleItemClick(item, idx)}
                  >
                    <WebLectureThumb
                      item={item}
                      index={idx}
                      isWatched={isWatched}
                      variant="list"
                    />
                    <div className="video-body">
                      <div className="video-title">{item.label}</div>
                      <div className="video-sub">
                        {item.subject || course.name} {isYt && '• YouTube Direct'}
                      </div>
                      {item.links && Object.keys(item.links).some((k) => k !== 'url') && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {(item.links.notes_en || item.links.en_pdf) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const target = resolveDirectMediaUrl(item.links!.notes_en || item.links!.en_pdf);
                                window.open(target, '_blank', 'noopener,noreferrer');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontWeight: 600,
                                borderRadius: 'var(--r-sm)',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card-hover)',
                                color: 'var(--accent)',
                                cursor: 'pointer',
                              }}
                            >
                              Notes EN
                            </button>
                          )}
                          {(item.links.notes_hi || item.links.hi_pdf) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const target = resolveDirectMediaUrl(item.links!.notes_hi || item.links!.hi_pdf);
                                window.open(target, '_blank', 'noopener,noreferrer');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontWeight: 600,
                                borderRadius: 'var(--r-sm)',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card-hover)',
                                color: '#e67e22',
                                cursor: 'pointer',
                              }}
                            >
                              Notes HI
                            </button>
                          )}
                          {item.links.handwritten && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const target = resolveDirectMediaUrl(item.links!.handwritten);
                                window.open(target, '_blank', 'noopener,noreferrer');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontWeight: 600,
                                borderRadius: 'var(--r-sm)',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card-hover)',
                                color: '#27ae60',
                                cursor: 'pointer',
                              }}
                            >
                              Handwritten
                            </button>
                          )}
                          {item.links.quiz && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(resolveDirectMediaUrl(item.links!.quiz), '_blank', 'noopener,noreferrer');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontWeight: 600,
                                borderRadius: 'var(--r-sm)',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card-hover)',
                                color: '#8e44ad',
                                cursor: 'pointer',
                              }}
                            >
                              Quiz
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.duration && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {formatItemDuration(item.duration)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const watchKey = getCanonicalLectureKey(item);
                          if (watchKey) {
                            syncLectureWatched(course.id, watchKey, item.label, !isWatched);
                          }
                        }}
                        title={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: isWatched ? 'var(--green)' : 'var(--text-dim)',
                          background: isWatched ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                          border: `1px solid ${isWatched ? 'rgba(34, 197, 94, 0.35)' : 'var(--border)'}`,
                          padding: '3px 8px',
                          borderRadius: 'var(--r-pill)',
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 width={12} height={12} />
                        <span>{isWatched ? 'Watched' : 'Mark'}</span>
                      </button>
                    </div>
                  </div>
                );
              };

              const renderPdfRow = (item: LectureItem, idx: number) => {
                const isWatched = isLectureWatched(item, watchedUrls);
                const directUrl = item.downloadUrl || item.url;

                return (
                  <div
                    key={item.id || idx}
                    data-lecture-url={item.url}
                    className={`video-row pdf-rect-row ${isWatched ? 'watched' : ''}`}
                    onClick={() => handleItemClick(item, idx)}
                  >
                    <div className="video-num">{idx + 1}</div>
                    <div
                      style={{
                        width: '40px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(217, 119, 6, 0.12)',
                        border: '1px solid rgba(217, 119, 6, 0.28)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#d97706',
                        flexShrink: 0,
                        gap: '1px',
                      }}
                    >
                      <FileText width={15} height={15} />
                      <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.4px' }}>PDF</span>
                    </div>
                    <div className="video-body">
                      <div className="video-title">{item.label}</div>
                      <div className="video-sub">
                        {item.subject || course.name} • PDF Document
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(directUrl, '_blank', 'noopener,noreferrer');
                        }}
                        title="Open PDF"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-card)',
                          color: 'var(--accent)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <ExternalLink width={12} height={12} />
                        <span>Open</span>
                      </button>
                      <button
                        onClick={(e) => handleDownloadPdf(e, item)}
                        title="Download PDF"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-muted)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Download width={12} height={12} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                );
              };

              return (
                <div>
                  {/* VIDEO LECTURES SECTION */}
                  {videoItems.length > 0 && (
                    <div style={{ marginBottom: hasBoth ? '32px' : '0' }}>
                      {hasBoth && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '8px 0 16px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: 'var(--r-sm)',
                              background: 'rgba(59, 130, 246, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--accent)',
                            }}
                          >
                            <Video width={15} height={15} />
                          </div>
                          <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: 'var(--text)' }}>
                            Video Lectures
                          </h3>
                          <span
                            style={{
                              fontSize: '11px',
                              background: 'var(--bg-card-hover)',
                              padding: '2px 8px',
                              borderRadius: 'var(--r-pill)',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                            }}
                          >
                            {videoItems.length}
                          </span>
                        </div>
                      )}

                      {viewMode === 'grid' ? (
                        <div className="lecture-grid-container">
                          {videoItems.map((item, idx) => renderVideoCard(item, idx))}
                        </div>
                      ) : (
                        <div className="video-list">
                          {videoItems.map((item, idx) => renderVideoRow(item, idx))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PRACTICE SHEETS & STUDY NOTES SECTION */}
                  {pdfItems.length > 0 && (
                    <div style={{ marginTop: hasBoth ? '28px' : '0' }}>
                      {hasBoth && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '8px 0 16px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: 'var(--r-sm)',
                              background: 'rgba(204, 120, 92, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--accent)',
                            }}
                          >
                            <FileText width={15} height={15} />
                          </div>
                          <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: 'var(--text)' }}>
                            Practice Sheets & Study Notes
                          </h3>
                        </div>
                      )}

                      {/* PDFs always display as compact rectangle list rows below lectures */}
                      <div className="video-list">
                        {pdfItems.map((item, idx) => renderPdfRow(item, idx))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Load More Button for Progressive Chunked Rendering */}
            {visibleLimit < activeItems.length && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 32px' }}>
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 40)}
                  className="load-more-lectures-btn"
                  style={{
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    boxShadow: 'var(--sh-card)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Load More Lectures ({renderedItems.length} of {activeItems.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
