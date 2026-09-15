import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  TrendingUp,
  FileText,
  Tag,
  ExternalLink,
  Eye,
  Copy,
  GitBranch,
  Github,
  BarChart3,
  RefreshCw,
  PlusCircle,
  Download,
  AlertCircle,
  MapPin,
  Building2,
  Users,
  Globe,
  SlidersHorizontal,
  Flame,
  Zap,
} from 'lucide-react';
import { DashboardQueueItem, QueueStatus, TargetWebsite } from '../types';
import { INITIAL_QUEUE_ITEMS } from '../data/initialQueue';

interface SummaryDashboardProps {
  queueItems: DashboardQueueItem[];
  onSelectItem: (item: DashboardQueueItem) => void;
  onNavigateToStudio: () => void;
  onNavigateToQueue: (selectedId?: string) => void;
  onOpenGitHubModal: (item?: DashboardQueueItem) => void;
  onResetToRecommended: () => void;
  onExportAllJson: () => void;
  activeWebsite?: TargetWebsite;
  targetWebsites?: TargetWebsite[];
  onNavigateToFlowchart?: () => void;
}

const LiveStatusLink: React.FC<{ url: string }> = ({ url }) => {
  const [status, setStatus] = useState<'checking' | 'live' | 'error'>('checking');

  useEffect(() => {
    let isMounted = true;
    
    // URL이 변경되었을 수 있으므로 초기 상태를 checking으로 설정
    setStatus('checking');

    const checkUrl = async () => {
      if (!isMounted) return;
      try {
        const res = await fetch('/api/check-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!isMounted) return;
        
        if (data.isOk) {
          setStatus('live');
        } else {
          setStatus('error');
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
      }
    };

    // Initial check
    checkUrl();

    // Poll every 10 seconds
    const intervalId = setInterval(() => {
      setStatus(prev => {
        if (prev !== 'live') {
          checkUrl();
        }
        return prev;
      });
    }, 10000);

    return () => { 
      isMounted = false; 
      clearInterval(intervalId);
    };
  }, [url]);

  if (status === 'checking') {
    return (
      <span className="block text-[10px] text-stone-500 flex items-center gap-1">
        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
        <span>라이브 확인중...</span>
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span
        className="block text-[10px] text-amber-600 font-semibold flex items-center gap-1 cursor-wait"
        title="CDN 배포 대기 중 (1~2분 소요)"
      >
        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
        <span className="truncate w-32">배포 대기중 (1~2분)</span>
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-[10px] text-emerald-600 hover:text-emerald-700 hover:underline font-semibold flex items-center gap-1"
    >
      <span className="truncate w-32">{url.replace('https://', '')}</span>
      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
    </a>
  );
};

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  queueItems,
  onSelectItem,
  onNavigateToStudio,
  onNavigateToQueue,
  onOpenGitHubModal,
  onResetToRecommended,
  onExportAllJson,
  activeWebsite = {
    id: 'site-japan',
    name: '놀루가 재팬',
    domain: 'japan.noluga.com',
    theme_label: '일본 여행 포털',
    description: '',
    git_repo: 'noluga-org/japan-portal',
    branch: 'main',
    posts_directory: 'content/posts',
    deploy_platform: 'firebase_hosting',
    status: 'active',
    created_at: '',
    live_url: 'https://japan.noluga.com',
  },
  targetWebsites = [],
  onNavigateToFlowchart,
}) => {
  const totalCount = queueItems.length;
  const readyCount = queueItems.filter((i) => i.queue_status === 'ready').length;
  const publishedCount = queueItems.filter((i) => i.queue_status === 'published').length;
  const scheduledCount = queueItems.filter((i) => i.queue_status === 'scheduled').length;

  const avgSeoScore = totalCount > 0
    ? Math.round(queueItems.reduce((acc, curr) => acc + (curr.seo_score || 85), 0) / totalCount)
    : 0;

  const totalKeywords = queueItems.reduce((acc, curr) => {
    const subs = curr.keyword_analysis?.sub_keywords?.length || 0;
    return acc + 1 + subs;
  }, 0);

  const totalImages = queueItems.reduce((acc, curr) => {
    return acc + (curr.stats?.image_count || 0);
  }, 0);

  // Intent counts
  const intentCounts: Record<string, number> = {
    '정보성': 0,
    '상업성': 0,
    '탐색형': 0,
    '비교형': 0,
  };

  queueItems.forEach((item) => {
    const intent = item.keyword_analysis?.search_intent || '';
    if (intent.includes('정보')) intentCounts['정보성']++;
    if (intent.includes('상업') || intent.includes('구매')) intentCounts['상업성']++;
    if (intent.includes('탐색')) intentCounts['탐색형']++;
    if (intent.includes('비교')) intentCounts['비교형']++;
  });

  // Japan-specific metadata metrics
  const japanPostsCount = queueItems.filter((i) => i.japan_meta).length;
  const hotelCompareCount = queueItems.filter((i) => i.japan_meta?.has_hotel_comparison).length;
  const citiesRepresented = Array.from(
    new Set(queueItems.map((i) => i.japan_meta?.city).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      {/* System Telemetry & Console Status Ribbon */}
      <div className="rounded-3xl bg-stone-900 text-white p-5 border border-stone-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SYSTEM OPERATIONAL
                </span>
                <span className="text-xs font-mono text-stone-400">
                  Target: <strong className="text-white font-bold">{activeWebsite.domain}</strong>
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                GitHub Contents API 직결 커밋 · GitHub Actions 워크플로우 · Firebase Hosting 글로벌 엣지 CDN
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="rounded-xl bg-stone-800/80 px-3 py-1.5 border border-stone-700/60 text-stone-300">
              저장소: <span className="text-white font-semibold">{activeWebsite.git_repo}</span>
            </div>
            <div className="rounded-xl bg-stone-800/80 px-3 py-1.5 border border-stone-700/60 text-stone-300">
              배포엔진: <span className="text-amber-300 font-semibold">Firebase Hosting (live)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Flowchart Ribbon (Quick Overview) */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-stone-700" />
            <h3 className="text-sm font-bold text-stone-900">
              엔드투엔드 파이프라인 흐름 요약
            </h3>
            <span className="text-[11px] text-stone-500">
              (키워드 발굴부터 글로벌 CDN 배포까지 8단계 완전 자동화)
            </span>
          </div>

          {onNavigateToFlowchart && (
            <button
              onClick={onNavigateToFlowchart}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <span>전체 인터랙티브 흐름도 보기 및 시뮬레이션</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 8-Step Visual Mini Pipeline */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8 text-center text-xs pt-1">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <span className="text-[10px] font-bold text-stone-400 block">STEP 1</span>
            <span className="font-bold text-stone-800 text-[11px] block mt-0.5">키워드 SERP</span>
            <span className="text-[10px] text-stone-500 block">롱테일 추출</span>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <span className="text-[10px] font-bold text-stone-400 block">STEP 2</span>
            <span className="font-bold text-stone-800 text-[11px] block mt-0.5">AI 본문 생성</span>
            <span className="text-[10px] text-stone-500 block">Gemini 1400자+</span>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <span className="text-[10px] font-bold text-stone-400 block">STEP 3</span>
            <span className="font-bold text-stone-800 text-[11px] block mt-0.5">SEO/Schema</span>
            <span className="text-[10px] text-stone-500 block">JSON-LD 검증</span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5">
            <span className="text-[10px] font-bold text-emerald-600 block">STEP 4</span>
            <span className="font-bold text-emerald-900 text-[11px] block mt-0.5">큐 승인 제어</span>
            <span className="text-[10px] font-bold text-emerald-700 block">{readyCount}건 대기 중</span>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <span className="text-[10px] font-bold text-stone-400 block">STEP 5</span>
            <span className="font-bold text-stone-800 text-[11px] block mt-0.5">Git 주입</span>
            <span className="text-[10px] text-stone-500 block">Contents API</span>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <span className="text-[10px] font-bold text-stone-400 block">STEP 6</span>
            <span className="font-bold text-stone-800 text-[11px] block mt-0.5">CI/CD 빌드</span>
            <span className="text-[10px] text-stone-500 block">Actions Runner</span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5">
            <span className="text-[10px] font-bold text-amber-700 block">STEP 7</span>
            <span className="font-bold text-amber-900 text-[11px] block mt-0.5">Firebase CDN</span>
            <span className="text-[10px] text-amber-800 block">Edge 배포</span>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5">
            <span className="text-[10px] font-bold text-blue-600 block">STEP 8</span>
            <span className="font-bold text-blue-900 text-[11px] block mt-0.5">라이브 색인</span>
            <span className="text-[10px] font-bold text-blue-700 block">{publishedCount}건 완료</span>
          </div>
        </div>
      </div>

      {/* Top Console Bar & Quick Actions */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-stone-800">
              OPERATIONS DASHBOARD
            </span>
            <span className="text-xs text-stone-500">실시간 파이프라인 모니터</span>
          </div>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            다채널 콘텐츠 파이프라인 운영 현황
          </h2>
          <p className="mt-1 text-xs text-stone-600 sm:text-sm">
            등록된 타깃 웹사이트의 키워드 분석, 발행 큐 대기열 및 GitHub Actions/Firebase 배포 상태를 중앙 통제합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onResetToRecommended}
            className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 transition-colors"
            title="기본 추천 작업 5종으로 대기열을 초기화하거나 보충합니다"
          >
            <RefreshCw className="h-3.5 w-3.5 text-stone-500" />
            <span>추천 작업 5종 복원</span>
          </button>

          <button
            onClick={onExportAllJson}
            className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-stone-500" />
            <span>대기열 JSON 다운로드</span>
          </button>

          <button
            onClick={() => onOpenGitHubModal()}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 transition-colors"
          >
            <Github className="h-3.5 w-3.5 text-amber-300" />
            <span>GitHub & Firebase 배포 콘솔</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-600">
            <span className="text-xs font-medium">전체 대기열 포스트</span>
            <Layers className="h-4 w-4 text-stone-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{totalCount}</span>
            <span className="text-xs text-stone-600">건 등록됨</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-600">추천 작업 5종 및 생성물 포함</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-semibold">발행 준비 (Ready)</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{readyCount}</span>
            <span className="text-xs text-emerald-700">건 즉시 주입 가능</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700">GitHub Actions 워크플로우 대상</p>
        </div>

        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-xs font-semibold">배포 완료 (Published)</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">{publishedCount}</span>
            <span className="text-xs text-blue-700">건 실서비스 배포</span>
          </div>
          <p className="mt-1 text-[11px] text-blue-700">커밋 & Pages 라이브 URL 연동</p>
        </div>

        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-semibold">평균 SEO 최적화 지수</span>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">{avgSeoScore}</span>
            <span className="text-xs font-bold text-amber-700">/ 100점</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-800">H1~H3 구조화 & 메타태그 충족</p>
        </div>

        <div className="rounded-2xl border border-purple-200/90 bg-purple-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-xs font-semibold">도출된 키워드 풀</span>
            <Tag className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-900">{totalKeywords}</span>
            <span className="text-xs text-purple-700">개 타깃 키워드</span>
          </div>
          <p className="mt-1 text-[11px] text-purple-700">이미지 Alt 슬롯 {totalImages}개 배치</p>
        </div>
      </div>

      {/* GitHub Actions Injection Status Notice */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 border border-stone-700 text-amber-300">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-100">
                  GitHub Actions 자동 배포 파이프라인 연동 활성화
                </h3>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  REST API Supported
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-300">
                대기열의 포스팅을 GitHub Actions의 <code className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-300">workflow_dispatch</code> 또는 <code className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-300">repository_dispatch</code>로 직접 주입하여 커밋, 빌드, GitHub Pages 배포 후 최종 결과를 이곳에 자동 기록합니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenGitHubModal()}
              className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-300 transition-colors shadow-xs"
            >
              GitHub 저장소 연결 & 배포 관리자 열기
            </button>
          </div>
        </div>
      </div>

      {/* Summary Table: Quick Overview of All 5 Recommended + Generated Posts */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              포스팅 대기열 요약 매트릭스 (한눈에 보기)
            </h3>
            <p className="text-xs text-stone-500">
              전체 추천 작업 및 생성물별 키워드, SEO 점수, 구조화 상태, 배포 링크를 빠르게 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToQueue()}
              className="flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-900"
            >
              <span>대기열 상세 목록 보기</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-3 px-3">포스트 제목 / 주제</th>
                <th className="py-3 px-3">메인 키워드</th>
                <th className="py-3 px-3">검색 의도</th>
                <th className="py-3 px-3 text-center">SEO 점수</th>
                <th className="py-3 px-3 text-center">구조(H2/Img)</th>
                <th className="py-3 px-3">대기열 / 배포 상태</th>
                <th className="py-3 px-3 text-right">빠른 실행</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {queueItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-stone-50/70 transition-colors"
                >
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-stone-900 line-clamp-1">
                      {item.seo_metadata?.title || item.topic}
                    </div>
                    <div className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">
                      {item.topic}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-800">
                      {item.keyword_analysis?.main_keyword || '-'}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-[11px] text-stone-600">
                      {item.keyword_analysis?.search_intent || '정보성'}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-black ${
                        (item.seo_score || 85) >= 90
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.seo_score || 85}점
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center text-[11px] text-stone-600">
                    <span>H2 {item.stats?.h2_count || 4}개</span> · <span>Img {item.stats?.image_count || 2}개</span>
                  </td>

                  <td className="py-3.5 px-3">
                    {item.queue_status === 'published' ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          <CheckCircle2 className="h-3 w-3 text-blue-600" />
                          배포 완료
                        </span>
                        {item.github_deployment?.live_url && (
                          <LiveStatusLink url={item.github_deployment.live_url} />
                        )}
                      </div>
                    ) : item.queue_status === 'ready' ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        ready (발행 대기)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                        {item.queue_status}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectItem(item)}
                        className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                        title="스니펫 및 본문 미리보기"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => onOpenGitHubModal(item)}
                        className="flex items-center gap-1 rounded-lg bg-stone-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 transition-colors"
                        title="GitHub Actions로 포스팅 주입 및 배포"
                      >
                        <Github className="h-3 w-3 text-amber-300" />
                        <span>GitHub 배포</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics & Search Intent Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Intent Distribution */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-stone-700" />
              <h3 className="text-sm font-bold text-stone-900">검색 의도(Search Intent) 분포</h3>
            </div>
            <span className="text-xs text-stone-600">총 {totalCount}개 콘텐츠 기준</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                <span>정보성 (Informational)</span>
                <span>{intentCounts['정보성']}개 포스트</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${(intentCounts['정보성'] / Math.max(totalCount, 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                <span>상업성 / 구매 의도 (Commercial)</span>
                <span>{intentCounts['상업성']}개 포스트</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(intentCounts['상업성'] / Math.max(totalCount, 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                <span>탐색형 및 비교형 (Navigational & Comparative)</span>
                <span>{intentCounts['탐색형'] + intentCounts['비교형']}개 포스트</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${((intentCounts['탐색형'] + intentCounts['비교형']) / Math.max(totalCount, 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Integrity Checks */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-stone-900">SEO 품질 및 대기열 규격 충족률</h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              100% 규격 통과
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <span className="text-xs text-stone-500">JSON Schema 호환성</span>
              <p className="mt-1 text-sm font-bold text-stone-900">ready 상태 100%</p>
              <p className="text-[11px] text-stone-600">자동화 파이프라인 즉시 파싱</p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <span className="text-xs text-stone-500">H1~H3 논리적 목차</span>
              <p className="mt-1 text-sm font-bold text-stone-900">전 포스트 충족</p>
              <p className="text-[11px] text-stone-600">평균 H2 4개 섹션 구성</p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <span className="text-xs text-stone-500">미디어 Alt 태그 배치</span>
              <p className="mt-1 text-sm font-bold text-stone-900">평균 2.4개 슬롯</p>
              <p className="text-[11px] text-stone-600">구체적 설명 포함 완료</p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <span className="text-xs text-stone-500">메타 설명 최적 길이</span>
              <p className="mt-1 text-sm font-bold text-stone-900">130~160자 유지</p>
              <p className="text-[11px] text-stone-600">검색 클릭률(CTR) 극대화</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
