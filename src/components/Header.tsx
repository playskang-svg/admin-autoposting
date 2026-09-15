import React from 'react';
import {
  Sparkles,
  Layers,
  Send,
  SlidersHorizontal,
  Plus,
  Globe,
  Github,
  BarChart2,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { DashboardQueueItem, TargetWebsite } from '../types';

export type AppTab = 'flowchart' | 'queue' | 'studio' | 'github' | 'summary';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  queueItems: DashboardQueueItem[];
  isGenerating: boolean;
  activeWebsite: TargetWebsite;
  targetWebsites: TargetWebsite[];
  onSelectWebsite: (site: TargetWebsite) => void;
  onOpenAddWebsiteModal: () => void;
  onOpenSiteLogModal?: () => void;
  onSyncSites?: () => void;
  isSyncingSites?: boolean;
  syncStatusMsg?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  queueItems,
  isGenerating,
  activeWebsite,
  targetWebsites,
  onSelectWebsite,
  onOpenAddWebsiteModal,
  onSyncSites,
  isSyncingSites,
  syncStatusMsg,
}) => {
  const readyCount = queueItems.filter((i) => i.queue_status === 'ready').length;

  // Group sites by category
  const groupedSites: Record<string, TargetWebsite[]> = {};
  targetWebsites.forEach((site) => {
    const cat = site.category || '기타';
    if (!groupedSites[cat]) groupedSites[cat] = [];
    groupedSites[cat].push(site);
  });

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand & Site Selector */}
          <div className="flex items-center gap-3">
            <span id="header-brand-title" className="font-bold text-stone-950 tracking-tight text-sm whitespace-nowrap">
              Auto Posting
            </span>
            
            <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs">
              <Globe className="h-3 w-3 text-rose-500 shrink-0" />
              <select
                value={activeWebsite.id}
                onChange={(e) => {
                  const found = targetWebsites.find((w) => w.id === e.target.value);
                  if (found) onSelectWebsite(found);
                }}
                aria-label="타깃 웹사이트 선택"
                className="font-mono text-xs font-semibold text-stone-800 bg-transparent pr-1 cursor-pointer focus:outline-hidden max-w-[220px] truncate"
              >
                {Object.entries(groupedSites).map(([category, sites]) => (
                  <optgroup key={category} label={`── ${category} (${sites.length}) ──`}>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.domain})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {onSyncSites && (
                <button
                  onClick={onSyncSites}
                  disabled={isSyncingSites}
                  title="원격 사이트 목록 새로고침 (adbles-hq-dashboard.playskang.workers.dev/links)"
                  className="text-stone-400 hover:text-stone-800 p-0.5 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncingSites ? 'animate-spin text-amber-600' : ''}`} />
                </button>
              )}

              <button
                onClick={onOpenAddWebsiteModal}
                title="사이트 직접 추가"
                className="text-stone-400 hover:text-stone-700 ml-0.5"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {syncStatusMsg && (
              <span className="hidden md:inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md animate-fade-in">
                {syncStatusMsg}
              </span>
            )}
          </div>

          {/* Navigation Tabs - Minimal 4-5 tabs */}
          <nav className="flex items-center gap-1 rounded-xl bg-stone-100 p-1 text-xs">


            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'queue'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>대기열</span>
              {readyCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    activeTab === 'queue'
                      ? 'bg-amber-400 text-stone-950'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {readyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'studio'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>글 생성</span>
              {isGenerating && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('github')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'github'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Github className="h-3.5 w-3.5" />
              <span>배포</span>
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-all ${
                activeTab === 'summary'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="운영 현황"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">현황</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

