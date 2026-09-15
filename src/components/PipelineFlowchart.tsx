import React, { useState } from 'react';
import {
  ArrowRight,
  Play,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Layers,
  Send,
  Github,
  Globe,
} from 'lucide-react';
import { DashboardQueueItem, QueueStatus, TargetWebsite } from '../types';
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
  const readyCount = queueItems.filter((i) => i.queue_status === 'ready').length;
  const publishedCount = queueItems.filter((i) => i.queue_status === 'published').length;

  const [activeStep, setActiveStep] = useState<number>(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number | null>(null);
  const [simMessage, setSimMessage] = useState<string>('');

  const steps: StepInfo[] = [
    {
      step: 1,
      id: 'keyword',
      name: '키워드 분석',
      desc: '검색엔진 상위 노출을 위한 롱테일 키워드와 검색 의도를 수집합니다.',
      badge: `${queueItems.length}건 분석`,
      actionText: '새 글 생성하기',
      onAction: onNavigateToStudio,
    },
    {
      step: 2,
      id: 'generate',
      name: 'AI 글 작성',
      desc: 'Gemini 모델이 1,400자 이상의 구조화된 마크다운 본문을 자동 집필합니다.',
      badge: 'AI 집필',
      actionText: '스튜디오 열기',
      onAction: onNavigateToStudio,
    },
    {
      step: 3,
      id: 'queue',
      name: '대기열 적재 & 자동화 감지',
      desc: '생성된 글이 대기열에 쌓이며, 10건 도달 시 GitHub Actions 파이프라인으로 일괄 자동 배포가 트리거됩니다.',
      badge: `${readyCount}건 대기 (10건 시 자동 배포)`,
      actionText: '대기열 확인',
      onAction: () => onNavigateToQueue(),
    },
    {
      step: 4,
      id: 'github-queue',
      name: 'GitHub 대기현황 절차',
      desc: `저장소(${activeWebsite.git_repo})의 Actions 워크플로우 러너 대기열(Queued / In-Progress) 및 Commit 배치 큐를 실시간 추적합니다.`,
      badge: 'GitHub 러너 큐',
      actionText: '대기현황 조회',
      onAction: () => onNavigateToDeploy(),
    },
    {
      step: 5,
      id: 'git',
      name: 'GitHub-Cloudflare 배포',
      desc: `기본 배포 파이프라인: GitHub 커밋 후 Cloudflare Pages / GitHub Actions 빌드가 실행됩니다.`,
      badge: '디폴트 파이프라인',
      actionText: '배포 센터 열기',
      onAction: () => onNavigateToDeploy(),
    },
    {
      step: 6,
      id: 'live',
      name: '라이브 확인 후 발행완료',
      desc: `Cloudflare / Firebase에서 HTTP 200 라이브 상태를 최종 검증한 뒤 자동으로 '발행완료(published)'로 전환합니다.`,
      badge: `${publishedCount}건 라이브 완료`,
      actionText: '라이브 검증 확인',
      onAction: () => onNavigateToDeploy(),
    },
  ];

  const current = steps.find((s) => s.step === activeStep) || steps[2];

  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const msgs = [
      '1단계: 타깃 키워드 분석 완료',
      '2단계: AI 마크다운 본문 생성 완료',
      '3단계: 대기열(10건 자동 배포 임계치) 감지 완료',
      '4단계: GitHub 대기현황 및 Actions 러너 큐 확인 완료',
      '5단계: GitHub-Cloudflare 빌드 트리거 완료',
      '6단계: Cloudflare/Firebase 라이브(200 OK) 확인 후 발행완료 반영!',
    ];

    let i = 0;
    const timer = setInterval(() => {
      if (i < 6) {
        setSimStep(i + 1);
        setActiveStep(i + 1);
        setSimMessage(msgs[i]);
        i++;
      } else {
        clearInterval(timer);
        setIsSimulating(false);
        setSimStep(null);
        setSimMessage('전체 파이프라인 (GitHub-Cloudflare 기본 + 라이브 검증) 시뮬레이션 정상 완료');
      }
    }, 900);
  };

  return (
    <div className="space-y-4">
      {/* Top Status & Test Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div className="text-xs text-stone-600">
            사이트: <strong className="text-stone-900 font-mono">{activeWebsite.domain}</strong>
            <span className="mx-2 text-stone-300">|</span>
            저장소: <span className="font-mono text-stone-700">{activeWebsite.git_repo}</span>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors shrink-0"
        >
          {isSimulating ? (
            <RefreshCw className="h-3 w-3 animate-spin text-amber-300" />
          ) : (
            <Play className="h-3 w-3 fill-amber-300 text-amber-300" />
          )}
          <span>파이프라인 테스트</span>
        </button>
      </div>

      {/* Simulation Banner (only when active or just finished) */}
      {simMessage && (
        <div className="flex items-center justify-between rounded-xl bg-stone-900 px-4 py-2 text-xs font-mono text-stone-200">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{simMessage}</span>
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        </div>
      )}

      {/* 6-Step Connected Flow Nodes */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((item, idx) => {
            const isSelected = activeStep === item.step;
            const isSimActive = simStep === item.step;

            return (
              <div
                key={item.step}
                onClick={() => setActiveStep(item.step)}
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
                      isSelected
                        ? 'bg-amber-400 text-stone-950'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.step}
                  </span>
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                        isSelected
                          ? 'bg-stone-800 text-stone-300'
                          : 'bg-white border border-stone-200 text-stone-600'
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
      </div>

      {/* Target Website Pending Posts Quick View & 1-Click Deploy Panel */}
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
