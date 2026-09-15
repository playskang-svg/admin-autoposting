import React, { useState, useEffect } from 'react';
import {
  Layers, Search, Filter, Download, Trash2, ExternalLink,
  CheckCircle2, Clock, Send, Eye, Tag, ImageIcon, Sparkles, Github,
  CheckSquare, Square, Edit
} from 'lucide-react';
import { DashboardQueueItem, QueueStatus } from '../types';
import { formatToQueueJson } from '../utils/seoAnalytics';

interface PostingQueueProps {
  queueItems: DashboardQueueItem[];
  onSelectItem: (item: DashboardQueueItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: QueueStatus) => void;
  onUpdateItem?: (item: DashboardQueueItem) => void;
  onNavigateToStudio: () => void;
  onOpenGitHubModal?: (item: DashboardQueueItem) => void;
  onResetToRecommended?: () => void;
}

export const PostingQueue: React.FC<PostingQueueProps> = ({
  queueItems,
  onSelectItem,
  onDeleteItem,
  onUpdateStatus,
  onUpdateItem,
  onNavigateToStudio,
  onOpenGitHubModal,
  onResetToRecommended,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QueueStatus>('ready');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Auto-publish logic
  useEffect(() => {
    const interval = setInterval(() => {
      queueItems.forEach(item => {
        if (item.queue_status === 'ready' && item.auto_publish && item.schedule_minutes && item.schedule_minutes > 0) {
          const createdTime = new Date(item.created_at).getTime();
          const targetTime = createdTime + (item.schedule_minutes * 60 * 1000);
          if (Date.now() >= targetTime) {
            onUpdateStatus(item.id, 'published');
            // If we have an auto deploy hook, we could call it here. For now, it just changes status.
          }
        }
      });
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [queueItems, onUpdateStatus]);

  const filteredItems = queueItems.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.queue_status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const matchesSearch =
      item.topic.toLowerCase().includes(q) ||
      item.seo_metadata?.title.toLowerCase().includes(q) ||
      item.keyword_analysis?.main_keyword.toLowerCase().includes(q) ||
      item.seo_metadata?.tags.some((t) => t.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDeploy = async () => {
    if (selectedIds.size === 0 || !onOpenGitHubModal) return;
    const itemsToDeploy = queueItems.filter(i => selectedIds.has(i.id));
    // For simplicity, we just trigger the first one's modal, or we'd need a bulk modal. 
    // Since onOpenGitHubModal expects a single item, we could just open it for the first one for now, 
    // or iterate. A robust bulk deploy requires a new Modal component.
    if(window.confirm(`선택한 ${itemsToDeploy.length}개의 포스트를 배포하시겠습니까?\n(현재는 첫 번째 항목의 배포 모달이 열립니다)`)) {
      onOpenGitHubModal(itemsToDeploy[0]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`선택한 ${selectedIds.size}개의 항목을 삭제하시겠습니까?`)) {
      selectedIds.forEach(id => onDeleteItem(id));
      setSelectedIds(new Set());
    }
  };

  const updateItemSchedule = (id: string, minutes: number, auto_publish: boolean) => {
    if (!onUpdateItem) return;
    const item = queueItems.find(i => i.id === id);
    if (item) {
      onUpdateItem({ ...item, schedule_minutes: minutes, auto_publish });
    }
  };

  const handleExportAllJson = () => {
    const exportData = queueItems.map((item) => formatToQueueJson(item));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `posting-automation-queue-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: QueueStatus) => {
    switch (status) {
      case 'ready': return <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />준비</span>;
      case 'published': return <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800"><CheckCircle2 className="h-3 w-3 text-blue-600" />배포완료</span>;
      case 'scheduled': return <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800"><Clock className="h-3 w-3 text-violet-600" />예약</span>;
      default: return <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">초안</span>;
    }
  };

  const getCompetitionBadge = (level: '상' | '중' | '하') => {
    switch (level) {
      case '상': return <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">경쟁:상</span>;
      case '중': return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">경쟁:중</span>;
      default: return <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">경쟁:하</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-stone-900">대기열</h2>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-600">{filteredItems.length}건</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-2 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
              <span className="text-xs font-bold text-amber-800">{selectedIds.size}개 선택됨</span>
              <button onClick={handleBulkDeploy} className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-100 px-2 py-1 rounded">일괄 배포</button>
              <button onClick={handleBulkDelete} className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-100 px-2 py-1 rounded">일괄 삭제</button>
            </div>
          )}
          {onResetToRecommended && (
            <button onClick={onResetToRecommended} className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50">추천 5종 초기화</button>
          )}
          <button onClick={handleExportAllJson} className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"><Download className="h-3 w-3" /><span>JSON 저장</span></button>
          <button onClick={onNavigateToStudio} className="flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800"><Sparkles className="h-3 w-3 text-amber-300" /><span>새 글 작성</span></button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
           <button onClick={toggleSelectAll} className="flex-shrink-0 text-stone-500 hover:text-stone-800">
             {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
           </button>
          <div className="relative flex-1 sm:w-64">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="제목, 주제, 키워드 검색..." className="w-full rounded-xl border border-stone-300 bg-white pl-9 pr-4 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none" />
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'ready', 'published', 'scheduled'] as const).map((st) => (
            <button key={st} onClick={() => setStatusFilter(st)} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === st ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
              {st === 'all' ? `전체 (${queueItems.length})` : `${st} (${queueItems.filter((i) => i.queue_status === st).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Items List */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500">
          <Layers className="h-10 w-10 text-stone-400" />
          <h3 className="mt-3 text-sm font-semibold text-stone-900">조건에 일치하는 대기열 항목이 없습니다.</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const remainingMs = item.schedule_minutes ? (new Date(item.created_at).getTime() + item.schedule_minutes * 60000) - Date.now() : 0;
            const remainingMins = Math.max(0, Math.floor(remainingMs / 60000));
            
            return (
            <div key={item.id} className={`group rounded-2xl border transition-all ${isSelected ? 'border-amber-400 bg-amber-50/20 shadow-md' : 'border-stone-200 bg-white shadow-sm hover:border-stone-400'}`}>
              <div className="flex items-stretch">
                <div className="flex items-center justify-center px-4 cursor-pointer" onClick={() => toggleSelect(item.id)}>
                   {isSelected ? <CheckSquare className="h-5 w-5 text-amber-600" /> : <Square className="h-5 w-5 text-stone-300 group-hover:text-stone-400" />}
                </div>
                
                <div className="flex-1 p-5 pl-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(item.queue_status)}
                      <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-mono font-bold text-rose-800">{item.target_domain || 'japan.noluga.com'}</span>
                      {getCompetitionBadge(item.keyword_analysis?.competition_level || '중')}
                      {item.japan_meta?.category_name && <span className="rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">{item.japan_meta.category_name}</span>}
                    </div>

                    <h3 onClick={() => onSelectItem(item)} className="text-base font-bold text-stone-900 hover:text-stone-700 cursor-pointer transition-colors">
                      {item.seo_metadata?.title || item.content?.h1}
                    </h3>
                    
                    {/* Schedule Control (건바이건 설정) */}
                    <div className="flex flex-wrap items-center gap-3 bg-stone-50 border border-stone-100 p-2 rounded-lg mt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-stone-400" />
                        <label className="text-[11px] font-semibold text-stone-600">발행 딜레이(분):</label>
                        <input 
                          type="number" min="0" 
                          value={item.schedule_minutes || 0} 
                          onChange={(e) => updateItemSchedule(item.id, parseInt(e.target.value) || 0, item.auto_publish || false)}
                          className="w-16 h-7 rounded border border-stone-300 text-xs px-2"
                        />
                      </div>
                      <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
                        <input 
                          type="checkbox" 
                          id={`auto-${item.id}`} 
                          checked={item.auto_publish || false}
                          onChange={(e) => updateItemSchedule(item.id, item.schedule_minutes || 0, e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor={`auto-${item.id}`} className="text-[11px] font-semibold text-stone-600 cursor-pointer">
                          시간경과 후 자동발행 {item.auto_publish && remainingMins > 0 && <span className="text-amber-600 font-bold ml-1">({remainingMins}분 남음)</span>}
                        </label>
                      </div>
                    </div>

                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-start pt-2 sm:pt-0">
                    <button onClick={() => onSelectItem(item)} className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100">
                      <Edit className="h-3.5 w-3.5 text-stone-500" /><span>수정</span>
                    </button>
                    {onOpenGitHubModal && (
                      <button onClick={() => onOpenGitHubModal(item)} className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800">
                        <Github className="h-3.5 w-3.5 text-amber-300" /><span>GitHub 배포</span>
                      </button>
                    )}
                    <button onClick={() => onDeleteItem(item.id)} className="rounded-xl border border-stone-200 p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
