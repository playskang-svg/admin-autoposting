import React, { useState, useEffect } from 'react';
import { Header, AppTab } from './components/Header';
import { SummaryDashboard } from './components/SummaryDashboard';
import { AgentStudio } from './components/AgentStudio';
import { PostingQueue } from './components/PostingQueue';
import { GitHubActionsManager } from './components/GitHubActionsManager';
import { JapanSiteShowcase } from './components/JapanSiteShowcase';
import { TargetSiteQuickDeployPanel } from './components/TargetSiteQuickDeployPanel';
import { PipelineGuide } from './components/PipelineGuide';
import { QueueDetailModal } from './components/QueueDetailModal';
import { AddWebsiteModal } from './components/AddWebsiteModal';
import { DashboardQueueItem, QueueStatus, JapanCategory, TargetWebsite } from './types';
import { INITIAL_QUEUE_ITEMS } from './data/initialQueue';
import { DEFAULT_JAPAN_CATEGORIES } from './data/japanTaxonomy';
import { INITIAL_TARGET_WEBSITES } from './data/targetWebsites';

const LOCAL_STORAGE_KEY = 'seo_posting_automation_queue_v1';
const CATEGORIES_STORAGE_KEY = 'japan_noluga_categories_v1';
const WEBSITES_STORAGE_KEY = 'noluga_target_websites_v1';
const ACTIVE_WEBSITE_STORAGE_KEY = 'noluga_active_website_id_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('summary');

  // Target Websites State (for multi-site management)
  const [targetWebsites, setTargetWebsites] = useState<TargetWebsite[]>(() => {
    try {
      const saved = localStorage.getItem(WEBSITES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If saved list has all remote sites (>= 20), use it, otherwise use updated INITIAL_TARGET_WEBSITES
        if (Array.isArray(parsed) && parsed.length >= 20) return parsed;
      }
    } catch (e) {
      console.error('Failed to load target websites', e);
    }
    return INITIAL_TARGET_WEBSITES;
  });

  const [activeWebsiteId, setActiveWebsiteId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_WEBSITE_STORAGE_KEY);
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TARGET_WEBSITES[0]?.id || 'site-japan-noluga-com';
  });

  const [isAddWebsiteModalOpen, setIsAddWebsiteModalOpen] = useState(false);
  const [isSyncingSites, setIsSyncingSites] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Sync sites from https://adbles-hq-dashboard.playskang.workers.dev/links
  const syncRemoteSites = async () => {
    setIsSyncingSites(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetch('/api/remote-sites');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.sites) && data.sites.length > 0) {
        setTargetWebsites(data.sites);
        setSyncStatusMsg(`원격 사이트 ${data.sites.length}개 동기화 완료`);
        setTimeout(() => setSyncStatusMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to fetch remote sites:', err);
      // Fallback: load pre-populated INITIAL_TARGET_WEBSITES if not already
      setTargetWebsites(INITIAL_TARGET_WEBSITES);
      setSyncStatusMsg(`기본 26개 사이트 목록 로드됨`);
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } finally {
      setIsSyncingSites(false);
    }
  };

  // Auto-sync remote sites on mount
  useEffect(() => {
    syncRemoteSites();
  }, []);

  const activeWebsite =
    targetWebsites.find((w) => w.id === activeWebsiteId) || targetWebsites[0];

  const [queueItems, setQueueItems] = useState<DashboardQueueItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load queue items from localStorage', e);
    }
    return INITIAL_QUEUE_ITEMS;
  });

  const [categories, setCategories] = useState<JapanCategory[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
    return DEFAULT_JAPAN_CATEGORIES;
  });

  const [selectedItem, setSelectedItem] = useState<DashboardQueueItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queueItems));
    } catch (e) {
      console.error('Failed to save queue items to localStorage', e);
    }
  }, [queueItems]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(WEBSITES_STORAGE_KEY, JSON.stringify(targetWebsites));
    } catch (e) {
      console.error('Failed to save target websites', e);
    }
  }, [targetWebsites]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_WEBSITE_STORAGE_KEY, activeWebsiteId);
    } catch (e) {
      console.error('Failed to save active website id', e);
    }
  }, [activeWebsiteId]);

  const handleAddWebsite = (newSite: TargetWebsite) => {
    setTargetWebsites((prev) => [...prev, newSite]);
    setActiveWebsiteId(newSite.id);
  };

  const handleSelectWebsite = (site: TargetWebsite) => {
    setActiveWebsiteId(site.id);
  };

  const handleAddCategory = (newCat: JapanCategory) => {
    setCategories((prev) => {
      if (prev.some((c) => c.slug === newCat.slug)) return prev;
      return [...prev, newCat];
    });
  };

  const handlePostGenerated = (newItem: DashboardQueueItem) => {
    setQueueItems((prev) => [newItem, ...prev]);
  };

  const handleSelectItem = (item: DashboardQueueItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleUpdateItem = (updated: DashboardQueueItem) => {
    setQueueItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (selectedItem?.id === updated.id) {
      setSelectedItem(updated);
    }
  };

  const handleDeleteItem = (id: string) => {
    setQueueItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) {
      handleCloseModal();
    }
  };

  const handleUpdateStatus = (id: string, newStatus: QueueStatus) => {
    setQueueItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              queue_status: newStatus,
              published_at: newStatus === 'published' ? new Date().toISOString() : item.published_at,
            }
          : item
      )
    );
  };

  const handleNavigateToQueue = (selectedId?: string) => {
    setActiveTab('queue');
    if (selectedId) {
      const found = queueItems.find((i) => i.id === selectedId);
      if (found) {
        setSelectedItem(found);
        setIsModalOpen(true);
      }
    }
  };

  const handleOpenGitHub = (item?: DashboardQueueItem) => {
    if (item) {
      setSelectedItem(item);
    }
    setActiveTab('github');
  };

  const handleResetToRecommended = () => {
    if (window.confirm('기본 추천 작업 5종으로 대기열을 초기화하시겠습니까?')) {
      setQueueItems(INITIAL_QUEUE_ITEMS);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_QUEUE_ITEMS));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleExportAllJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(queueItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `seo-posting-queue-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-stone-100/60 font-sans text-stone-900 antialiased selection:bg-amber-200 selection:text-stone-900">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueItems={queueItems}
        isGenerating={isGenerating}
        activeWebsite={activeWebsite}
        targetWebsites={targetWebsites}
        onSelectWebsite={handleSelectWebsite}
        onOpenAddWebsiteModal={() => setIsAddWebsiteModalOpen(true)}
        onSyncSites={syncRemoteSites}
        isSyncingSites={isSyncingSites}
        syncStatusMsg={syncStatusMsg}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <TargetSiteQuickDeployPanel
              queueItems={queueItems}
              activeWebsite={activeWebsite}
              targetWebsites={targetWebsites}
              onSelectWebsite={handleSelectWebsite}
              onUpdateStatus={handleUpdateStatus}
              onUpdateItem={handleUpdateItem}
              onSelectItem={handleSelectItem}
              onNavigateToStudio={() => setActiveTab('studio')}
              onNavigateToDeploy={handleOpenGitHub}
              onAddNewPostToSite={handlePostGenerated}
              onDeleteItem={handleDeleteItem}
            />
            <SummaryDashboard
              queueItems={queueItems}
              onSelectItem={handleSelectItem}
              onNavigateToStudio={() => setActiveTab('studio')}
              onNavigateToQueue={handleNavigateToQueue}
              onOpenGitHubModal={handleOpenGitHub}
              onResetToRecommended={handleResetToRecommended}
              onExportAllJson={handleExportAllJson}
              activeWebsite={activeWebsite}
              targetWebsites={targetWebsites}
            />
          </div>
        )}

        {activeTab === 'queue' && (
          <PostingQueue
            queueItems={queueItems}
            onSelectItem={handleSelectItem}
            onDeleteItem={handleDeleteItem}
            onUpdateStatus={handleUpdateStatus}
            onUpdateItem={handleUpdateItem}
            onNavigateToStudio={() => setActiveTab('studio')}
            onOpenGitHubModal={handleOpenGitHub}
            onResetToRecommended={handleResetToRecommended}
          />
        )}

        {activeTab === 'studio' && (
          <AgentStudio
            onPostGenerated={handlePostGenerated}
            onNavigateToQueue={handleNavigateToQueue}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            japanCategories={categories}
            onAddCategory={handleAddCategory}
            activeWebsite={activeWebsite}
            targetWebsites={targetWebsites}
            onSelectWebsite={handleSelectWebsite}
          />
        )}

        {activeTab === 'github' && (
          <GitHubActionsManager
            queueItems={queueItems}
            initialSelectedItem={selectedItem}
            onUpdateItem={handleUpdateItem}
            activeWebsite={activeWebsite}
            targetWebsites={targetWebsites}
            onSelectWebsite={handleSelectWebsite}
            onSyncSites={syncRemoteSites}
            isSyncingSites={isSyncingSites}
          />
        )}

        {activeTab === 'japan' && (
          <JapanSiteShowcase
            queueItems={queueItems}
            categories={categories}
            onAddCategory={handleAddCategory}
            onSelectPost={handleSelectItem}
            onPublishToGithub={handleOpenGitHub}
          />
        )}

        {activeTab === 'pipeline' && <PipelineGuide />}
      </main>

      {/* Queue Item Detail Modal */}
      {selectedItem && (
        <QueueDetailModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdateItem={handleUpdateItem}
        />
      )}

      {/* Add Target Website Modal */}
      <AddWebsiteModal
        isOpen={isAddWebsiteModalOpen}
        onClose={() => setIsAddWebsiteModalOpen(false)}
        onAddWebsite={handleAddWebsite}
      />
    </div>
  );
}
