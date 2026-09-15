import React, { useState } from 'react';
import {
  ArrowRight, Play, RefreshCw, CheckCircle2, Sparkles,
  Layers, Send, Github, Globe, ExternalLink, AlertTriangle
} from 'lucide-react';
import { DashboardQueueItem, QueueStatus, TargetWebsite, GitHubConfig } from '../types';
import { TargetSiteQuickDeployPanel } from './TargetSiteQuickDeployPanel';

interface PipelineFlowchartProps {
  queueItems: DashboardQueueItem[];
  activeWebsite: TargetWebsite;
  targetWebsites: TargetWebsite[];
  onSelectWebsite: (site: TargetWebsite) => void;
  onOpenAddWebsiteModal: () => void;
  onNavigateToStudio: () => void;
  onNavigateToQueue: (id?: string) => void;
  onNavigateToDeploy: (item?: DashboardQueueItem) => void;
  onUpdateStatus?: (id: string, newStatus: QueueStatus) => void;
  onUpdateItem?: (item: DashboardQueueItem) => void;
  onSelectItem?: (item: DashboardQueueItem) => void;
  onAddNewPostToSite?: (newPost: DashboardQueueItem) => void;
}

interface StepInfo {
  step: number;
  id: string;
  name: string;
  desc: string;
  badge?: string;
  actionText: string;
  onAction: () => void;
  getItems: () => DashboardQueueItem[];
}

export const PipelineFlowchart: React.FC<PipelineFlowchartProps> = ({
  queueItems,
  activeWebsite,
  targetWebsites,
  onSelectWebsite,
  onOpenAddWebsiteModal,
  onNavigateToStudio,
  onNavigateToQueue,
  onNavigateToDeploy,
  onUpdateStatus = () => {},
  onUpdateItem = () => {},
  onSelectItem = () => {},
  onAddNewPostToSite,
}) => {
  const readyCount = queueItems.filter((i) => i.queue_status === 'ready' || i.queue_status === 'scheduled').length;
  const publishedCount = queueItems.filter((i) => i.queue_status === 'published').length;
  const inProgressCount = queueItems.filter((i) => i.queue_status === 'queued').length;

  const [activeStep, setActiveStep] = useState<number>(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number | null>(null);
  const [simMessage, setSimMessage] = useState<string>('');
  const [showItemDetail, setShowItemDetail] = useState(false);

  const steps: StepInfo[] = [
    {
      step: 1,
      id: 'keyword',
      name: '키워드 분석',
      desc: '검색엔진 상위 노출을 위한 롱테일 키워드와 검색 의도를 수집합니다.',
      badge: `${queueItems.length}건 분석`,
      actionText: '새 글 생성하기',
      onAction: onNavigateToStudio,
      getItems: () => queueItems,
    },
    {
      step: 2,
      id: 'generate',
      name: 'AI 글 작성',
      desc: 'Gemini 모델이 1,400자 이상의 구조화된 마크다운 본문을 자동 집필합니다.',
      badge: 'AI 집필',
      actionText: '스튜디오 열기',
      onAction: onNavigateToStudio,
      getItems: () => queueItems.filter(i => i.queue_status === 'draft'),
    },
    {
      step: 3,
      id: 'queue',
      name: '대기열 적재 & 자동화 감지',
      desc: '생성된 글이 대기열에 쌓이며, 10건 도달 시 GitHub Actions 파이프라인으로 일괄 자동 배포가 트리거됩니다.',
      badge: `${readyCount}건 대기 (10건 시 자동 배포)`,
      actionText: '대기열 확인',
      onAction: () => onNavigateToQueue(),
      getItems: () => queueItems.filter(i => i.queue_status === 'ready' || i.queue_status === 'scheduled'),
    },
    {
      step: 4,
      id: 'github-queue',
      name: 'GitHub 대기현황 절차',
      desc: `저장소(${activeWebsite.git_repo})의 Actions 워크플로우 러너 대기열(Queued / In-Progress) 및 Commit 배치 큐를 실시간 추적합니다.`,
      badge: `${inProgressCount}건 큐 대기`,
      actionText: '대기현황 조회',
      onAction: () => onNavigateToDeploy(),
      getItems: () => queueItems.filter(i => i.queue_status === 'queued'),
    },
    {
      step: 5,
      id: 'git',
      name: 'GitHub-Cloudflare 배포',
      desc: `기본 배포 파이프라인: GitHub 커밋 후 Cloudflare Pages / GitHub Actions 빌드가 실행됩니다.`,
      badge: '디폴트 파이프라인',
      actionText: '배포 센터 열기',
      onAction: () => onNavigateToDeploy(),
      getItems: () => queueItems.filter(i => i.queue_status === 'queued'),
    },
    {
      step: 6,
      id: 'live',
      name: '라이브 확인 후 발행완료',
      desc: `Cloudflare / Firebase에서 HTTP 200 라이브 상태를 최종 검증한 뒤 자동으로 '발행완료(published)'로 전환합니다.`,
      badge: `${publishedCount}건 라이브 완료`,
      actionText: '라이브 검증 확인',
      onAction: () => onNavigateToDeploy(),
      getItems: () => queueItems.filter(i => i.queue_status === 'published'),
    },
  ];

  const current = steps.find((s) => s.step === activeStep) || steps[2];
  const stepItems = current.getItems();

  return (
    <div className="space-y-4">
      {/* Top Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div className="text-xs text-stone-600">
            사이트: <strong className="text-stone-900 font-mono">{activeWebsite.domain}</strong>
            <span className="mx-2 text-stone-300">|</span>
            저장소: <span className="font-mono text-stone-700">{activeWebsite.git_repo}</span>
          </div>
        </div>
      </div>

      {/* 6-Step Connected Flow Nodes */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((item, idx) => {
            const isSelected = activeStep === item.step;
            const isSimActive = simStep === item.step;

            return (
              <div
                key={item.step}
                onClick={() => {
                  setActiveStep(item.step);
                  if (isSelected) {
                    setShowItemDetail(!showItemDetail); // Toggle list if clicked again
                  } else {
                    setShowItemDetail(true); // Open on first click
                  }
                }}
                className={`cursor-pointer rounded-xl border p-3 transition-all ${
                  isSimActive
                    ? 'border-amber-400 bg-amber-50 shadow-xs'
                    : isSelected
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50/70 hover:border-stone-300 hover:bg-white text-stone-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.step}
                  </span>
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                        isSelected
                          ? 'bg-stone-800 text-stone-300 cursor-pointer hover:bg-stone-700'
                          : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <div className="font-bold text-xs truncate">{item.name}</div>
              </div>
            );
          })}
        </div>

        {/* Concise Active Step Inspector */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-stone-600">
            <span className="font-bold text-stone-900 mr-2">
              STEP {current.step}. {current.name}:
            </span>
            <span>{current.desc}</span>
          </div>

          <button
            onClick={current.onAction}
            className="flex items-center justify-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800 transition-colors shrink-0"
          >
            <span>{current.actionText}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        
        {/* Step Items List Popup/Expansion */}
        {showItemDetail && (
          <div className="mt-4 bg-stone-50 border border-stone-200 rounded-xl p-3 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="flex justify-between items-center mb-2 px-1">
              <h4 className="text-xs font-bold text-stone-800">
                {current.name} 해당 항목 ({stepItems.length}건)
              </h4>
              <button 
                onClick={() => setShowItemDetail(false)}
                className="text-[10px] text-stone-500 hover:text-stone-900 font-bold"
              >
                닫기 ✕
              </button>
            </div>
            {stepItems.length === 0 ? (
              <div className="text-xs text-stone-400 p-4 text-center border border-dashed border-stone-300 rounded-lg">
                해당하는 항목이 없습니다.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {stepItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-white border border-stone-200 p-2 rounded-lg hover:border-stone-400 transition-colors cursor-pointer" onClick={() => onSelectItem && onSelectItem(item)}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-stone-800 truncate max-w-[200px] sm:max-w-sm">
                        {item.seo_metadata?.title || item.topic || '제목 없음'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-500">{item.queue_status}</span>
                        {item.schedule_minutes && item.auto_publish && (
                          <span className="text-[10px] text-amber-600 font-bold">자동예약됨</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-stone-300" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <TargetSiteQuickDeployPanel
        queueItems={queueItems}
        activeWebsite={activeWebsite}
        targetWebsites={targetWebsites}
        onSelectWebsite={onSelectWebsite}
        onUpdateStatus={onUpdateStatus}
        onUpdateItem={onUpdateItem}
        onSelectItem={onSelectItem}
        onNavigateToStudio={onNavigateToStudio}
        onNavigateToDeploy={onNavigateToDeploy}
        onAddNewPostToSite={onAddNewPostToSite}
      />
    </div>
  );
};
