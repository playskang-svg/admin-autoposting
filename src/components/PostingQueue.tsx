import React, { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  FileCode,
  Tag,
  ImageIcon,
  Sparkles,
  Github,
} from 'lucide-react';
import { DashboardQueueItem, QueueStatus } from '../types';
import { formatToQueueJson } from '../utils/seoAnalytics';

interface PostingQueueProps {
  queueItems: DashboardQueueItem[];
  onSelectItem: (item: DashboardQueueItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: QueueStatus) => void;
  onNavigateToStudio: () => void;
  onOpenGitHubModal?: (item: DashboardQueueItem) => void;
  onResetToRecommended?: () => void;
}

export const PostingQueue: React.FC<PostingQueueProps> = ({
  queueItems,
  onSelectItem,
  onDeleteItem,
  onUpdateStatus,
  onNavigateToStudio,
  onOpenGitHubModal,
  onResetToRecommended,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QueueStatus>('all');

  // Filter items
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

  const handleExportAllJson = () => {
    const exportData = queueItems.map((item) => formatToQueueJson(item));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `posting-automation-queue-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: QueueStatus) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            준비
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
            <CheckCircle2 className="h-3 w-3 text-blue-600" />
            배포완료
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">
            <Clock className="h-3 w-3 text-violet-600" />
            예약
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
            초안
          </span>
        );
    }
  };

  const getCompetitionBadge = (level: '상' | '중' | '하') => {
    switch (level) {
      case '상':
        return <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">경쟁:상</span>;
      case '중':
        return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">경쟁:중</span>;
      default:
        return <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">경쟁:하</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-stone-900">
            대기열
          </h2>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-600">
            {filteredItems.length}건
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onResetToRecommended && (
            <button
              onClick={onResetToRecommended}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              추천 5종 초기화
            </button>
          )}
          <button
            id="export-all-queue-btn"
            onClick={handleExportAllJson}
            className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            <Download className="h-3 w-3" />
            <span>JSON 저장</span>
          </button>
          <button
            id="create-new-agent-post-btn"
            onClick={onNavigateToStudio}
            className="flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800"
          >
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>새 글 작성</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            id="queue-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목, 주제, 키워드, 태그 검색..."
            className="w-full rounded-xl border border-stone-300 bg-white pl-9 pr-4 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-hidden"
          />
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'ready', 'published', 'scheduled'] as const).map((st) => (
            <button
              key={st}
              id={`filter-${st}-btn`}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st === 'all'
                ? `전체 (${queueItems.length})`
                : st === 'ready'
                ? `ready (${queueItems.filter((i) => i.queue_status === 'ready').length})`
                : st === 'published'
                ? `published (${queueItems.filter((i) => i.queue_status === 'published').length})`
                : `scheduled (${queueItems.filter((i) => i.queue_status === 'scheduled').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Items List */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500">
          <Layers className="h-10 w-10 text-stone-400" />
          <h3 className="mt-3 text-sm font-semibold text-stone-900">
            조건에 일치하는 대기열 항목이 없습니다.
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            새로운 주제를 작성하거나 검색 조건을 변경해 보세요.
          </p>
          <button
            onClick={onNavigateToStudio}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>에이전트 스튜디오로 이동</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:border-stone-400 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                {/* Main Content Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(item.queue_status)}
                    <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-mono font-bold text-rose-800">
                      {item.target_domain || 'japan.noluga.com'}
                    </span>
                    {getCompetitionBadge(item.keyword_analysis?.competition_level || '중')}
                    {item.japan_meta?.city && (
                      <span className="rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-800">
                        {item.japan_meta.city}
                      </span>
                    )}
                    {item.japan_meta?.category_name && (
                      <span className="rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                        {item.japan_meta.category_name}
                      </span>
                    )}
                    {item.japan_meta?.travel_type && (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                        {item.japan_meta.travel_type}
                      </span>
                    )}
                    <span className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-mono text-stone-600">
                      ID: {item.id}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {new Date(item.created_at).toLocaleString('ko-KR')}
                    </span>
                  </div>

                  <h3
                    onClick={() => onSelectItem(item)}
                    className="text-base font-bold text-stone-900 hover:text-stone-700 cursor-pointer transition-colors"
                  >
                    {item.seo_metadata?.title || item.content?.h1}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {item.seo_metadata?.meta_description}
                  </p>

                  {/* Keywords and Tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1 font-semibold text-stone-800">
                      <Tag className="h-3 w-3 text-stone-400" />
                      <span>메인 키워드:</span>
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-stone-900 font-mono text-[11px]">
                        {item.keyword_analysis?.main_keyword}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {item.keyword_analysis?.sub_keywords?.slice(0, 3).map((sub, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-stone-50 border border-stone-200 px-1.5 py-0.5 text-[10px] text-stone-600"
                        >
                          +{sub}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-stone-400">
                      <ImageIcon className="h-3 w-3 text-stone-400" />
                      <span>미디어: {item.stats?.image_count || 0}개</span>
                    </div>
                  </div>

                  {item.github_deployment && (
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/50 px-3 py-1.5 text-xs text-blue-900">
                      <Github className="h-3.5 w-3.5 text-stone-800" />
                      <span className="font-semibold">{item.github_deployment.repo}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px]">Run #{item.github_deployment.run_id}</span>
                      {item.github_deployment.live_url && (
                        <>
                          <span>·</span>
                          <a
                            href={item.github_deployment.live_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-700 font-bold underline hover:text-blue-900"
                          >
                            <span>배포 사이트</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-start pt-2 sm:pt-0">
                  <button
                    id={`view-detail-${item.id}`}
                    onClick={() => onSelectItem(item)}
                    className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-stone-500" />
                    <span>상세 & JSON</span>
                  </button>

                  {onOpenGitHubModal && (
                    <button
                      onClick={() => onOpenGitHubModal(item)}
                      className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 shadow-2xs transition-colors"
                      title="GitHub Actions로 포스팅 데이터 주입 및 자동 배포 실행"
                    >
                      <Github className="h-3.5 w-3.5 text-amber-300" />
                      <span>GitHub 배포</span>
                    </button>
                  )}

                  {item.queue_status === 'ready' && (
                    <button
                      id={`publish-item-${item.id}`}
                      onClick={() => onUpdateStatus(item.id, 'published')}
                      className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-200 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>발행 완료 처리</span>
                    </button>
                  )}

                  <button
                    id={`delete-item-${item.id}`}
                    onClick={() => onDeleteItem(item.id)}
                    title="대기열에서 삭제"
                    className="rounded-xl border border-stone-200 p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
