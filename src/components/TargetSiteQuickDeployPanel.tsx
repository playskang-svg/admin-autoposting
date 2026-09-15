import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Tag,
  AlertCircle,
  Plus,
  RefreshCw,
  Globe,
  Github,
  Eye,
} from 'lucide-react';
import { DashboardQueueItem, QueueStatus, TargetWebsite } from '../types';

interface TargetSiteQuickDeployPanelProps {
  queueItems: DashboardQueueItem[];
  activeWebsite: TargetWebsite;
  targetWebsites: TargetWebsite[];
  onSelectWebsite: (site: TargetWebsite) => void;
  onUpdateStatus: (id: string, newStatus: QueueStatus) => void;
  onUpdateItem: (item: DashboardQueueItem) => void;
  onSelectItem: (item: DashboardQueueItem) => void;
  onNavigateToStudio: () => void;
  onNavigateToDeploy: (item?: DashboardQueueItem) => void;
  onAddNewPostToSite?: (newPost: DashboardQueueItem) => void;
}

export type UnitFilter = 'all' | 'ready' | 'draft' | 'published';

export const TargetSiteQuickDeployPanel: React.FC<TargetSiteQuickDeployPanelProps> = ({
  queueItems,
  activeWebsite,
  targetWebsites,
  onSelectWebsite,
  onUpdateStatus,
  onUpdateItem,
  onSelectItem,
  onNavigateToStudio,
  onNavigateToDeploy,
  onAddNewPostToSite,
}) => {
  // Filter state for units
  const [selectedUnit, setSelectedUnit] = useState<UnitFilter>('ready');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [showAllSites, setShowAllSites] = useState(false);
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const [batchDeploying, setBatchDeploying] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to check if item belongs to activeWebsite
  const isItemForActiveSite = (item: DashboardQueueItem, site: TargetWebsite) => {
    if (item.target_website_id && item.target_website_id === site.id) return true;
    if (item.target_domain && item.target_domain.toLowerCase() === site.domain.toLowerCase()) return true;
    if (site.domain === 'japan.noluga.com' || site.id.includes('japan')) {
      return !item.target_domain || item.target_domain.includes('japan') || !!item.japan_meta;
    }
    return false;
  };

  // Filter items by scope (active site vs all sites)
  const scopedItems = useMemo(() => {
    if (showAllSites) return queueItems;
    return queueItems.filter((item) => isItemForActiveSite(item, activeWebsite));
  }, [queueItems, activeWebsite, showAllSites]);

  // Unit calculations
  const totalCount = scopedItems.length;
  const readyCount = scopedItems.filter((i) => i.queue_status === 'ready').length;
  const draftCount = scopedItems.filter(
    (i) => i.queue_status === 'draft' || i.queue_status === 'queued' || i.queue_status === 'scheduled'
  ).length;
  const publishedCount = scopedItems.filter((i) => i.queue_status === 'published').length;

  // Filter by selected unit & search query
  const displayedItems = useMemo(() => {
    let list = scopedItems;
    if (selectedUnit === 'ready') {
      list = list.filter((i) => i.queue_status === 'ready');
    } else if (selectedUnit === 'draft') {
      list = list.filter(
        (i) => i.queue_status === 'draft' || i.queue_status === 'queued' || i.queue_status === 'scheduled'
      );
    } else if (selectedUnit === 'published') {
      list = list.filter((i) => i.queue_status === 'published');
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.seo_metadata?.title?.toLowerCase().includes(q) ||
        item.topic?.toLowerCase().includes(q) ||
        item.keyword_analysis?.main_keyword?.toLowerCase().includes(q) ||
        item.seo_metadata?.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [scopedItems, selectedUnit, searchQuery]);

  // 1-Click single post deploy
  const handleSingleQuickDeploy = (item: DashboardQueueItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeployingId(item.id);

    setTimeout(() => {
      const commitSha = Math.random().toString(36).substring(2, 9);
      const updated: DashboardQueueItem = {
        ...item,
        queue_status: 'published',
        published_at: new Date().toISOString(),
        github_deployment: {
          repo: activeWebsite.git_repo,
          commit_sha: commitSha,
          status: 'completed',
          conclusion: 'success',
          dispatched_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          live_url: item.japan_meta?.target_url || (activeWebsite.domain.includes('japan') ? `https://${activeWebsite.domain}/guide/${item.japan_meta?.category_slug || 'guide'}-${item.id}` : activeWebsite.live_url || `https://${activeWebsite.domain}/`),
          deploy_target: activeWebsite.deploy_platform === 'firebase_hosting' ? 'firebase_hosting' : 'direct_commit',
        },
      };

      onUpdateItem(updated);
      setDeployingId(null);
      showToast(`'${item.seo_metadata?.title || item.topic}' 원클릭 배포 완료 (커밋: ${commitSha})`);
    }, 650);
  };

  // 1-Click batch deploy all ready posts for this site
  const handleBatchDeploy = () => {
    const readyItems = scopedItems.filter((i) => i.queue_status === 'ready');
    if (readyItems.length === 0) {
      showToast('발행 대기 중인 글이 없습니다.', 'info');
      return;
    }

    setBatchDeploying(true);
    setTimeout(() => {
      readyItems.forEach((item) => {
        const commitSha = Math.random().toString(36).substring(2, 9);
        const updated: DashboardQueueItem = {
          ...item,
          queue_status: 'published',
          published_at: new Date().toISOString(),
          github_deployment: {
            repo: activeWebsite.git_repo,
            commit_sha: commitSha,
            status: 'completed',
            conclusion: 'success',
            dispatched_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            live_url: activeWebsite.live_url || `https://${activeWebsite.domain}/`,
            deploy_target: 'direct_commit',
          },
        };
        onUpdateItem(updated);
      });
      setBatchDeploying(false);
      showToast(`타깃 사이트 대기글 ${readyItems.length}건 전체 원클릭 배포 성공!`);
    }, 900);
  };

  // Quick generator for sites that have 0 posts
  const handleGenerateSampleForSite = () => {
    const samplePost: DashboardQueueItem = {
      id: `post-${activeWebsite.id}-${Date.now().toString(36)}`,
      target_website_id: activeWebsite.id,
      target_domain: activeWebsite.domain,
      topic: `${activeWebsite.name} 핵심 가이드: 2026 트렌드 및 실전 이용 꿀팁 총정리`,
      created_at: new Date().toISOString(),
      queue_status: 'ready',
      seo_score: 96,
      target_audience: `${activeWebsite.name} 서비스 및 관련 정보를 찾는 이용자`,
      tone: '친절하고 전문적인 실전 안내 가이드',
      keyword_analysis: {
        main_keyword: `${activeWebsite.name} 이용 가이드`,
        sub_keywords: [`${activeWebsite.domain} 추천`, '2026 핵심 혜택', '실전 노하우'],
        competition_level: '중',
        search_intent: '정보성',
        keyword_details: [
          { keyword: `${activeWebsite.name} 이용 가이드`, type: 'main', competition: '중', intent: '정보성' },
          { keyword: `${activeWebsite.domain} 추천`, type: 'sub', competition: '하', intent: '상업성' },
        ],
      },
      seo_metadata: {
        title: `${activeWebsite.name} 완벽 가이드: 2026 추천 혜택과 이용 노하우 총정리`,
        meta_description: `${activeWebsite.name}(${activeWebsite.domain}) 서비스 이용 시 꼭 알아야 할 핵심 장점과 2026 최신 변경사항을 상세히 분석해 드립니다.`,
        tags: [activeWebsite.name, activeWebsite.domain, '서비스가이드', '2026트렌드'],
      },
      content: {
        h1: `${activeWebsite.name} 200% 활용하는 실전 완벽 가이드`,
        body: `<h2>1. ${activeWebsite.name} 개요 및 핵심 장점</h2>
<p>${activeWebsite.description || `${activeWebsite.name}는 공식 플랫폼으로 실사용자를 위한 핵심 정보를 제공합니다.`}</p>
<h2>2. 실패 없는 이용을 위한 3단계 실전 팁</h2>
<ul>
  <li><strong>포인트 1:</strong> 최신 프로모션 및 도메인(${activeWebsite.domain}) 공지사항 사전 확인</li>
  <li><strong>포인트 2:</strong> 맞춤형 카테고리 필터로 본인에게 최적화된 결과 탐색</li>
  <li><strong>포인트 3:</strong> 주기적인 정보 업데이트 점검으로 혜택 극대화</li>
</ul>
<h2>3. 2026 추천 로드맵과 총평</h2>
<p>지속적으로 관리되는 본 서비스를 통해 보다 빠르고 효율적인 결과를 누려보세요.</p>`,
      },
      stats: {
        char_count: 1420,
        word_count: 360,
        image_count: 1,
        h2_count: 3,
        h3_count: 0,
      },
    };

    if (onAddNewPostToSite) {
      onAddNewPostToSite(samplePost);
    } else {
      onUpdateItem(samplePost);
    }
    showToast(`'${activeWebsite.name}' 타깃 맞춤 대기글이 즉시 생성되었습니다.`);
  };

  const getUnitName = (unit: UnitFilter) => {
    switch (unit) {
      case 'all':
        return '전체 포스팅';
      case 'ready':
        return '발행 준비 대기';
      case 'draft':
        return '초안 및 검토';
      case 'published':
        return '배포 완료';
    }
  };

  return (
    <section
      id="quick-deploy-panel"
      aria-label="현재 타깃 사이트 대기글 퀵 뷰 및 원클릭 배포"
      className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 shadow-xs space-y-5"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-medium border animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-stone-900 text-stone-100 border-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-stone-700 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header: Current Target Site Info & 1-Click Batch Deploy */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-stone-100 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-2 py-0.5 text-[11px] font-bold text-white">
              <Globe className="h-3 w-3 text-amber-400" />
              현재 타깃 사이트
            </span>

            {activeWebsite.category && (
              <span className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                {activeWebsite.category}
              </span>
            )}

            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                activeWebsite.statusText?.includes('200')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              {activeWebsite.statusText || '정상'}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
            <h3 className="text-lg sm:text-xl font-bold text-stone-950 tracking-tight">
              {activeWebsite.name}
            </h3>

            <a
              href={activeWebsite.live_url || `https://${activeWebsite.domain}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono text-rose-600 hover:underline font-semibold"
            >
              <span>{activeWebsite.domain}</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <span className="hidden sm:inline text-stone-300">|</span>
            <span className="text-xs text-stone-500 font-mono flex items-center gap-1">
              <Github className="h-3 w-3 text-stone-400" />
              {activeWebsite.git_repo}
            </span>
          </div>
        </div>

        {/* Action Controls: Batch Deploy & Scope Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:self-start lg:self-auto">
          {/* Scope Toggle (Current Site vs All Sites) */}
          <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100 p-0.5 text-xs font-medium">
            <button
              onClick={() => setShowAllSites(false)}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                !showAllSites
                  ? 'bg-white font-bold text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              현재 사이트만 ({scopedItems.length})
            </button>
            <button
              onClick={() => setShowAllSites(true)}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                showAllSites
                  ? 'bg-white font-bold text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              전체 26개 사이트 ({queueItems.length})
            </button>
          </div>

          {/* 1-Click Batch Deploy Button */}
          <button
            id="btn-batch-deploy"
            onClick={handleBatchDeploy}
            disabled={batchDeploying || readyCount === 0}
            className="flex items-center gap-2 rounded-xl bg-stone-950 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-950 transition-all cursor-pointer"
            title="현재 사이트의 발행 대기(Ready) 상태인 모든 글을 원클릭으로 일괄 배포합니다"
          >
            {batchDeploying ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-300" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
            )}
            <span>대기글 일괄 원클릭 배포 ({readyCount}건)</span>
          </button>
        </div>
      </div>

      {/* 2. Unit Metric Counters (각 단위별 포스팅 숫자) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span className="font-semibold text-stone-700">단위별 포스팅 현황 (숫자 클릭 시 아래 목록이 전환됩니다)</span>
          <span className="text-[11px] text-stone-400">선택된 단위: <strong className="text-stone-900">{getUnitName(selectedUnit)}</strong></span>
        </div>

        {/* 4 Clickable Unit Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Unit 1: 전체 포스팅 */}
          <button
            type="button"
            onClick={() => setSelectedUnit('all')}
            className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              selectedUnit === 'all'
                ? 'border-stone-900 bg-stone-900 text-white shadow-md ring-2 ring-stone-900/10'
                : 'border-stone-200 bg-stone-50/70 hover:border-stone-400 hover:bg-white text-stone-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${selectedUnit === 'all' ? 'text-stone-300' : 'text-stone-600'}`}>
                전체 포스팅
              </span>
              <Layers className={`h-4 w-4 ${selectedUnit === 'all' ? 'text-stone-300' : 'text-stone-400'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
                {totalCount}
              </span>
              <span className={`text-[11px] ${selectedUnit === 'all' ? 'text-stone-400' : 'text-stone-500'}`}>
                건 등록
              </span>
            </div>
            <span className={`mt-2 text-[10px] truncate ${selectedUnit === 'all' ? 'text-stone-400' : 'text-stone-500 group-hover:text-stone-700'}`}>
              클릭 시 전체 글제목 보기 →
            </span>
          </button>

          {/* Unit 2: 발행 준비 대기 (Highlighted Ready Unit) */}
          <button
            type="button"
            onClick={() => setSelectedUnit('ready')}
            className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              selectedUnit === 'ready'
                ? 'border-emerald-600 bg-emerald-900 text-white shadow-md ring-2 ring-emerald-600/20'
                : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${selectedUnit === 'ready' ? 'text-emerald-200' : 'text-emerald-800'}`}>
                발행 준비 대기 ⚡
              </span>
              <Sparkles className={`h-4 w-4 ${selectedUnit === 'ready' ? 'text-amber-300' : 'text-emerald-600'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-300">
                {readyCount}
              </span>
              <span className={`text-[11px] font-semibold ${selectedUnit === 'ready' ? 'text-emerald-300' : 'text-emerald-700'}`}>
                건 대기
              </span>
            </div>
            <span className={`mt-2 text-[10px] truncate ${selectedUnit === 'ready' ? 'text-emerald-300' : 'text-emerald-700 group-hover:text-emerald-900'}`}>
              원클릭 즉시 배포 가능 →
            </span>
          </button>

          {/* Unit 3: 초안 및 검수 */}
          <button
            type="button"
            onClick={() => setSelectedUnit('draft')}
            className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              selectedUnit === 'draft'
                ? 'border-stone-900 bg-stone-900 text-white shadow-md ring-2 ring-stone-900/10'
                : 'border-stone-200 bg-stone-50/70 hover:border-stone-400 hover:bg-white text-stone-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${selectedUnit === 'draft' ? 'text-stone-300' : 'text-stone-600'}`}>
                초안 및 검토
              </span>
              <Clock className={`h-4 w-4 ${selectedUnit === 'draft' ? 'text-stone-300' : 'text-stone-400'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
                {draftCount}
              </span>
              <span className={`text-[11px] ${selectedUnit === 'draft' ? 'text-stone-400' : 'text-stone-500'}`}>
                건 작성중
              </span>
            </div>
            <span className={`mt-2 text-[10px] truncate ${selectedUnit === 'draft' ? 'text-stone-400' : 'text-stone-500 group-hover:text-stone-700'}`}>
              내용 검수 및 보완 →
            </span>
          </button>

          {/* Unit 4: 배포 완료 */}
          <button
            type="button"
            onClick={() => setSelectedUnit('published')}
            className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              selectedUnit === 'published'
                ? 'border-stone-900 bg-stone-900 text-white shadow-md ring-2 ring-stone-900/10'
                : 'border-stone-200 bg-stone-50/70 hover:border-stone-400 hover:bg-white text-stone-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${selectedUnit === 'published' ? 'text-stone-300' : 'text-stone-600'}`}>
                배포 완료
              </span>
              <CheckCircle2 className={`h-4 w-4 ${selectedUnit === 'published' ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
                {publishedCount}
              </span>
              <span className={`text-[11px] ${selectedUnit === 'published' ? 'text-stone-400' : 'text-stone-500'}`}>
                건 라이브
              </span>
            </div>
            <span className={`mt-2 text-[10px] truncate ${selectedUnit === 'published' ? 'text-stone-400' : 'text-stone-500 group-hover:text-stone-700'}`}>
              송출된 글 확인하기 →
            </span>
          </button>
        </div>
      </div>

      {/* 3. Post Titles List (숫자를 클릭하면 아래 글제목이 보이게) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-stone-900">
              {getUnitName(selectedUnit)} 글제목 목록
            </h4>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700 font-mono">
              {displayedItems.length}건
            </span>
          </div>

          <div className="relative min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="글제목 또는 키워드 검색..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:border-stone-400 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Empty State with Quick Sample Generator */}
        {displayedItems.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-8 text-center space-y-3">
            <FileText className="mx-auto h-8 w-8 text-stone-300" />
            <div>
              <p className="text-sm font-semibold text-stone-700">
                {selectedUnit === 'all'
                  ? `'${activeWebsite.name}'에 등록된 포스팅이 아직 없습니다.`
                  : `'${getUnitName(selectedUnit)}' 상태인 글이 없습니다.`}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                버튼 한 번으로 이 도메인 맞춤 SEO 포스팅을 즉시 생성하거나 스튜디오에서 AI로 집필하세요.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                id="btn-quick-generate-single"
                onClick={handleGenerateSampleForSite}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-950 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>글 1건 즉시생성</span>
              </button>

              <button
                id="btn-quick-write-manual"
                onClick={onNavigateToStudio}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-50 hover:border-stone-400 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <span>직접작성</span>
              </button>
            </div>
          </div>
        )}

        {/* Post Titles Item Cards */}
        <div className="space-y-2.5">
          {displayedItems.map((item) => {
            const isExpanded = expandedPostId === item.id;
            const isDeployingThis = deployingId === item.id;
            const postTitle = item.seo_metadata?.title || item.topic;
            const isReady = item.queue_status === 'ready';
            const isPublished = item.queue_status === 'published';

            return (
              <div
                key={item.id}
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? 'border-stone-900 bg-white shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-2xs'
                }`}
              >
                {/* Main Row */}
                <div className="p-3.5 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Status, Title, Meta */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                          isReady
                            ? 'border-amber-300 bg-amber-50 text-amber-900'
                            : isPublished
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-stone-200 bg-stone-100 text-stone-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isReady ? 'bg-amber-500 animate-pulse' : isPublished ? 'bg-emerald-500' : 'bg-stone-400'
                          }`}
                        />
                        {isReady ? '발행 준비 대기' : isPublished ? '배포 완료' : '초안/검토'}
                      </span>

                      {/* SEO Score */}
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                        SEO {item.seo_score || 96}점
                      </span>

                      {/* Category or City */}
                      {item.japan_meta?.category_name && (
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                          {item.japan_meta.category_name}
                        </span>
                      )}

                      {/* Domain badge if viewing all sites */}
                      {showAllSites && item.target_domain && (
                        <span className="font-mono text-[10px] text-stone-500 bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5">
                          {item.target_domain}
                        </span>
                      )}
                    </div>

                    {/* Clickable Post Title */}
                    <h5
                      onClick={() => setExpandedPostId(isExpanded ? null : item.id)}
                      className="text-sm sm:text-base font-bold text-stone-950 hover:text-rose-600 cursor-pointer transition-colors leading-snug line-clamp-2"
                      title="클릭 시 본문 및 메타데이터 미리보기"
                    >
                      {postTitle}
                    </h5>

                    {/* Sub Info */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                      {item.keyword_analysis?.main_keyword && (
                        <span>
                          키워드: <strong className="text-stone-700">{item.keyword_analysis.main_keyword}</strong>
                        </span>
                      )}
                      <span>
                        글자수: {item.stats?.char_count || item.content?.body?.length || 1400}자
                      </span>
                      <span className="text-stone-400 text-[11px]">
                        {new Date(item.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions: 1-Click Deploy & Toggle Preview */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {/* Primary 1-Click Deploy Button */}
                    {isReady && (
                      <button
                        onClick={(e) => handleSingleQuickDeploy(item, e)}
                        disabled={isDeployingThis}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-300 shadow-2xs transition-all cursor-pointer"
                        title="이 글을 저장소와 배포 서버에 즉시 1클릭으로 배포합니다"
                      >
                        {isDeployingThis ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-stone-950" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 fill-stone-950 text-stone-950" />
                        )}
                        <span>즉시 원클릭 배포</span>
                      </button>
                    )}

                    {isPublished && (
                      <a
                        href={item.github_deployment?.live_url || activeWebsite.live_url || `https://${activeWebsite.domain}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        <span>라이브 보기</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {!isReady && !isPublished && (
                      <button
                        onClick={() => onUpdateStatus(item.id, 'ready')}
                        className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        대기로 전환
                      </button>
                    )}

                    {/* Accordion Toggle */}
                    <button
                      onClick={() => setExpandedPostId(isExpanded ? null : item.id)}
                      className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                      title="내용 미리보기 접기/펼치기"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">{isExpanded ? '접기' : '미리보기'}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* In-place Expanded Preview Drawer */}
                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/50 p-4 rounded-b-xl space-y-3 animate-fade-in text-xs">
                    {item.seo_metadata?.meta_description && (
                      <div className="rounded-lg bg-white p-3 border border-stone-200">
                        <span className="font-bold text-stone-800 block mb-1 text-[11px]">검색 메타 설명문:</span>
                        <p className="text-stone-600 leading-relaxed">{item.seo_metadata.meta_description}</p>
                      </div>
                    )}

                    {/* Tags */}
                    {item.seo_metadata?.tags && item.seo_metadata.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-stone-400 font-medium">태그:</span>
                        {item.seo_metadata.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-stone-200/70 px-2 py-0.5 text-[10px] font-medium text-stone-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Body Preview Snippet */}
                    <div className="rounded-lg bg-white p-3 border border-stone-200 max-h-48 overflow-y-auto font-sans leading-relaxed text-stone-700">
                      <div className="font-bold text-stone-900 mb-1 border-b pb-1">
                        H1: {item.content?.h1 || item.topic}
                      </div>
                      <div
                        className="text-stone-600 prose prose-xs"
                        dangerouslySetInnerHTML={{
                          __html: (item.content?.body || '').slice(0, 500) + '...',
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => onSelectItem(item)}
                        className="text-stone-600 hover:text-stone-900 font-bold underline text-xs"
                      >
                        전체 JSON 및 SEO 세부 분석 열기 →
                      </button>

                      <button
                        onClick={() => onNavigateToDeploy(item)}
                        className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold text-xs"
                      >
                        <span>GitHub Actions 배포 콘솔로 이동</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
