import React, { useState } from 'react';
import {
  Globe,
  Building2,
  Plus,
  ExternalLink,
  Github,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Settings2,
  Trash2,
  ArrowRight,
  RefreshCw,
  FolderGit2,
  Edit3,
  Check,
  Zap,
  Radio,
  FileText,
} from 'lucide-react';
import { TargetWebsite, DashboardQueueItem } from '../types';

interface MultiSiteManagerProps {
  targetWebsites: TargetWebsite[];
  activeWebsite: TargetWebsite;
  queueItems: DashboardQueueItem[];
  onSelectWebsite: (site: TargetWebsite) => void;
  onUpdateWebsite: (site: TargetWebsite) => void;
  onDeleteWebsite: (siteId: string) => void;
  onOpenAddModal: () => void;
  onNavigateToStudio: (siteId?: string) => void;
  onNavigateToQueue: (siteId?: string) => void;
  onNavigateToDeploy: (siteId?: string) => void;
}

export const MultiSiteManager: React.FC<MultiSiteManagerProps> = ({
  targetWebsites,
  activeWebsite,
  queueItems,
  onSelectWebsite,
  onUpdateWebsite,
  onDeleteWebsite,
  onOpenAddModal,
  onNavigateToStudio,
  onNavigateToQueue,
  onNavigateToDeploy,
}) => {
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TargetWebsite>>({});
  const [searchFilter, setSearchFilter] = useState('');

  // Calculate stats per website
  const getSiteStats = (site: TargetWebsite) => {
    // Check by target_website_id or domain or fallback to japan site for initial items
    const siteItems = queueItems.filter(
      (item) =>
        item.target_website_id === site.id ||
        item.target_domain === site.domain ||
        (!item.target_website_id && site.domain.includes('japan'))
    );

    const ready = siteItems.filter((i) => i.queue_status === 'ready').length;
    const published = siteItems.filter((i) => i.queue_status === 'published').length;
    const draft = siteItems.filter((i) => i.queue_status === 'draft').length;
    const total = siteItems.length;

    return { total, ready, published, draft, items: siteItems };
  };

  const totalAllPosts = queueItems.length;
  const totalAllReady = queueItems.filter((i) => i.queue_status === 'ready').length;
  const totalAllPublished = queueItems.filter((i) => i.queue_status === 'published').length;

  const handleStartEdit = (site: TargetWebsite) => {
    setEditingSiteId(site.id);
    setEditForm({ ...site });
  };

  const handleSaveEdit = () => {
    if (!editingSiteId || !editForm.name || !editForm.domain) return;
    const existing = targetWebsites.find((s) => s.id === editingSiteId);
    if (!existing) return;

    const updated: TargetWebsite = {
      ...existing,
      ...editForm,
    } as TargetWebsite;

    onUpdateWebsite(updated);
    setEditingSiteId(null);
    setEditForm({});
  };

  const filteredSites = targetWebsites.filter((site) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      site.name.toLowerCase().includes(q) ||
      site.domain.toLowerCase().includes(q) ||
      site.theme_label.toLowerCase().includes(q) ||
      site.git_repo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Multi-Site Operations Hub */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm">
              <Building2 className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-stone-900">
                  멀티 타깃 웹사이트 통합 관제 콘솔
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-xs font-mono font-bold text-stone-800">
                  {targetWebsites.length} SITES ACTIVE
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                여러 웹사이트의 GitHub 저장소, 콘텐츠 폴더, Firebase Hosting 도메인을 한곳에서 일괄 관리하고 발행합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>새 웹사이트 추가 등록</span>
            </button>
          </div>
        </div>

        {/* Global Multi-Site Stats Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-stone-100">
          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5">
            <span className="text-[11px] font-bold text-stone-500 block">등록된 사이트 수</span>
            <span className="text-2xl font-bold font-mono text-stone-900 mt-1 block">
              {targetWebsites.length}
              <span className="text-xs font-normal text-stone-500 ml-1">개 도메인</span>
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <span className="text-[11px] font-bold text-emerald-700 block">전체 발행 준비 (Ready)</span>
            <span className="text-2xl font-bold font-mono text-emerald-900 mt-1 block">
              {totalAllReady}
              <span className="text-xs font-normal text-emerald-700 ml-1">건 즉시 배포 가능</span>
            </span>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5">
            <span className="text-[11px] font-bold text-blue-700 block">전체 라이브 배포 완료</span>
            <span className="text-2xl font-bold font-mono text-blue-900 mt-1 block">
              {totalAllPublished}
              <span className="text-xs font-normal text-blue-700 ml-1">건 서빙 중</span>
            </span>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5">
            <span className="text-[11px] font-bold text-stone-500 block">전체 대기열 포스트</span>
            <span className="text-2xl font-bold font-mono text-stone-900 mt-1 block">
              {totalAllPosts}
              <span className="text-xs font-normal text-stone-500 ml-1">건 총 누적</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sites List & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
            <h3 className="text-base font-bold text-stone-900">
              운영 중인 웹사이트 목록 ({filteredSites.length}개)
            </h3>
            <span className="text-xs text-stone-500">
              원하는 사이트를 클릭해 기본 타깃으로 전환하세요.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="도메인, 사이트명, 저장소 검색..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none w-64"
            />
          </div>
        </div>

        {/* Website Cards Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {filteredSites.map((site) => {
            const isCurrentActive = site.id === activeWebsite.id;
            const stats = getSiteStats(site);
            const isEditing = editingSiteId === site.id;

            return (
              <div
                key={site.id}
                className={`rounded-3xl border p-5 transition-all flex flex-col justify-between ${
                  isCurrentActive
                    ? 'border-stone-900 bg-white shadow-md ring-2 ring-stone-900'
                    : 'border-stone-200/90 bg-white shadow-xs hover:border-stone-300'
                }`}
              >
                {isEditing ? (
                  /* Edit Form */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <span className="text-xs font-bold text-stone-900">사이트 설정 수정</span>
                      <button
                        onClick={() => setEditingSiteId(null)}
                        className="text-xs text-stone-400 hover:text-stone-600"
                      >
                        취소
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block">사이트 명칭</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-900 mt-0.5"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block">도메인 주소</label>
                      <input
                        type="text"
                        value={editForm.domain || ''}
                        onChange={(e) => setEditForm((p) => ({ ...p, domain: e.target.value }))}
                        className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-mono text-stone-900 mt-0.5"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block">테마 라벨</label>
                      <input
                        type="text"
                        value={editForm.theme_label || ''}
                        onChange={(e) => setEditForm((p) => ({ ...p, theme_label: e.target.value }))}
                        className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-900 mt-0.5"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block">GitHub 저장소 (owner/repo)</label>
                      <input
                        type="text"
                        value={editForm.git_repo || ''}
                        onChange={(e) => setEditForm((p) => ({ ...p, git_repo: e.target.value }))}
                        className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-mono text-stone-900 mt-0.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block">브랜치</label>
                        <input
                          type="text"
                          value={editForm.branch || 'main'}
                          onChange={(e) => setEditForm((p) => ({ ...p, branch: e.target.value }))}
                          className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-mono text-stone-900 mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block">포스트 폴더</label>
                        <input
                          type="text"
                          value={editForm.posts_directory || 'content/posts'}
                          onChange={(e) => setEditForm((p) => ({ ...p, posts_directory: e.target.value }))}
                          className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-mono text-stone-900 mt-0.5"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveEdit}
                      className="w-full mt-2 rounded-xl bg-stone-900 py-2 text-xs font-bold text-white hover:bg-stone-800"
                    >
                      저장하기
                    </button>
                  </div>
                ) : (
                  /* Standard Card View */
                  <div className="space-y-4">
                    {/* Header line */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              site.status === 'active' ? 'bg-emerald-500' : 'bg-stone-300'
                            }`}
                          />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            {site.status === 'active' ? '운영 중' : '대기 중'}
                          </span>
                        </div>

                        {isCurrentActive && (
                          <span className="rounded-md bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            CURRENT ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-bold text-stone-900">{site.name}</h4>
                          <span className="inline-block mt-0.5 text-xs font-mono font-semibold text-rose-600">
                            https://{site.domain}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(site)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                            title="사이트 설정 수정"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {targetWebsites.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`'${site.name}' 사이트를 목록에서 삭제하시겠습니까?`)) {
                                  onDeleteWebsite(site.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                              title="사이트 삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                        {site.description || site.theme_label}
                      </p>
                    </div>

                    {/* Technical Meta & Specs */}
                    <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3 text-xs space-y-1.5 font-mono">
                      <div className="flex items-center justify-between text-stone-600">
                        <span className="flex items-center gap-1 text-[11px] text-stone-400">
                          <Github className="h-3 w-3" /> 저장소:
                        </span>
                        <span className="font-semibold text-stone-900 truncate max-w-[160px]">
                          {site.git_repo}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-stone-600">
                        <span className="flex items-center gap-1 text-[11px] text-stone-400">
                          <FolderGit2 className="h-3 w-3" /> 경로:
                        </span>
                        <span className="text-stone-800">
                          {site.posts_directory} ({site.branch})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-stone-600">
                        <span className="flex items-center gap-1 text-[11px] text-stone-400">
                          <Flame className="h-3 w-3 text-amber-500" /> 플랫폼:
                        </span>
                        <span className="font-semibold text-amber-700">Firebase Hosting</span>
                      </div>
                    </div>

                    {/* Post Metrics for this site */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-2">
                        <span className="text-[10px] text-stone-400 block font-bold">대기열 전체</span>
                        <span className="text-sm font-bold font-mono text-stone-900 mt-0.5 block">
                          {stats.total}
                        </span>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2">
                        <span className="text-[10px] text-emerald-700 block font-bold">발행 준비</span>
                        <span className="text-sm font-bold font-mono text-emerald-900 mt-0.5 block">
                          {stats.ready}
                        </span>
                      </div>

                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2">
                        <span className="text-[10px] text-blue-700 block font-bold">배포 완료</span>
                        <span className="text-sm font-bold font-mono text-blue-900 mt-0.5 block">
                          {stats.published}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
                      {!isCurrentActive ? (
                        <button
                          onClick={() => onSelectWebsite(site)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-2 text-xs font-bold text-white hover:bg-stone-800 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                          <span>이 사이트로 작업 전환 (Set Active)</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigateToStudio(site.id)}
                            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>새 글 생성</span>
                          </button>

                          <button
                            onClick={() => onNavigateToQueue(site.id)}
                            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-stone-100 border border-stone-200 py-2 text-xs font-bold text-stone-800 hover:bg-stone-200 transition-colors"
                          >
                            <Layers className="h-3.5 w-3.5 text-stone-600" />
                            <span>대기열 ({stats.ready})</span>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          onClick={() => onNavigateToDeploy(site.id)}
                          className="text-stone-500 hover:text-stone-900 font-medium flex items-center gap-1"
                        >
                          <Flame className="h-3 w-3 text-amber-500" />
                          <span>배포 센터 열기</span>
                        </button>

                        <a
                          href={site.live_url || `https://${site.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                        >
                          <span>라이브 사이트</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
