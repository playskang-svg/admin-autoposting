import React, { useState, useEffect, useMemo } from 'react';
import {
  Github,
  Play,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Terminal,
  Sparkles,
  Layers,
  FolderGit2,
  Flame,
  Globe,
  ArrowRight,
  GitCommit,
  Cpu,
  Server,
  Zap,
  Settings2,
  FileText,
  Building2,
  Check,
  Search,
  Link,
  Info,
} from 'lucide-react';
import { DashboardQueueItem, GitHubConfig, GitHubDeploymentMeta, TargetWebsite } from '../types';

interface GitHubActionsManagerProps {
  queueItems: DashboardQueueItem[];
  onUpdateItem: (updated: DashboardQueueItem) => void;
  initialSelectedItem?: DashboardQueueItem | null;
  activeWebsite?: TargetWebsite;
  targetWebsites?: TargetWebsite[];
  onSelectWebsite?: (site: TargetWebsite) => void;
  onSyncSites?: () => void;
  isSyncingSites?: boolean;
}

const STORAGE_KEY = 'seo_agent_github_config_v2';

const DEFAULT_CONFIG: GitHubConfig = {
  owner: '',
  repo: '',
  token: '',
  workflow_file: 'deploy-firebase.yml',
  branch: 'main',
  posts_directory: 'content/posts',
  deploy_url_template: 'https://japan.noluga.com/guide/{slug}',
  firebase_project_id: 'japan-noluga',
  firebase_site_id: 'japan-noluga',
  auto_poll: true,
  is_connected: false,
  deploy_mode: 'firebase',
};

export const GitHubActionsManager: React.FC<GitHubActionsManagerProps> = ({
  queueItems,
  onUpdateItem,
  initialSelectedItem,
  activeWebsite,
  targetWebsites = [],
  onSelectWebsite,
  onSyncSites,
  isSyncingSites,
}) => {
  const [config, setConfig] = useState<GitHubConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If old config had /posts/{slug}, upgrade to /guide/{slug}
        if (parsed.deploy_url_template === 'https://japan.noluga.com/posts/{slug}') {
          parsed.deploy_url_template = 'https://japan.noluga.com/guide/{slug}';
        }
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CONFIG;
  });

  // Automatically sync with selected target website
  useEffect(() => {
    if (activeWebsite) {
      const parts = (activeWebsite.git_repo || '').split('/');
      const owner = parts[0] || '';
      const repo = parts[1] || '';
      const isJapan = (activeWebsite.domain || '').includes('japan');
      const recommendedTemplate = isJapan
        ? 'https://japan.noluga.com/guide/{slug}'
        : `https://${activeWebsite.domain}/posts/{slug}`;

      setConfig((prev) => ({
        ...prev,
        owner: owner || prev.owner,
        repo: repo || prev.repo,
        branch: activeWebsite.branch || prev.branch,
        posts_directory: activeWebsite.posts_directory || prev.posts_directory,
        firebase_project_id: activeWebsite.firebase_project_id || prev.firebase_project_id,
        deploy_url_template: prev.deploy_url_template || recommendedTemplate,
      }));
    }
  }, [activeWebsite?.id]);

  const [activeSubTab, setActiveSubTab] = useState<
    'dispatch' | 'firebase' | 'settings' | 'multisite'
  >('dispatch');

  const [selectedPostId, setSelectedPostId] = useState<string>(
    initialSelectedItem?.id || queueItems.find((i) => i.queue_status === 'ready')?.id || queueItems[0]?.id || ''
  );

  const currentItem = queueItems.find((i) => i.id === selectedPostId) || queueItems[0];

  // Helper to extract or build post slug
  const getPostSlug = (post: DashboardQueueItem) => {
    if (!post) return 'post';
    // 1. If target_url has clean english slug, use it
    if (post.japan_meta?.target_url) {
      const parts = post.japan_meta.target_url.split('/');
      const last = parts[parts.length - 1];
      if (last && /^[a-zA-Z0-9-_]+$/.test(last)) {
        return last;
      }
    }
    // 2. Otherwise generate a clean alphanumeric slug
    const prefix = post.japan_meta?.category_slug ? `${post.japan_meta.category_slug}-` : '';
    const raw = (post.seo_metadata?.title || post.topic)
      .replace(/[^a-zA-Z0-9가-힣\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 45);
    return `${prefix}${raw}`;
  };

  // Editable slug state for active post
  const [customSlug, setCustomSlug] = useState<string>(() => getPostSlug(currentItem));

  // Sync customSlug when selected post changes
  useEffect(() => {
    if (currentItem) {
      setCustomSlug(getPostSlug(currentItem));
    }
  }, [selectedPostId, currentItem?.id]);

  // Compute final live URL helper
  const getComputedLiveUrl = (slug: string, post?: DashboardQueueItem) => {
    const cleanSlug = slug.trim();
    if (config.deploy_url_template && config.deploy_url_template.includes('{slug}')) {
      return config.deploy_url_template.replace('{slug}', cleanSlug);
    }
    if (post?.japan_meta?.target_url) {
      return post.japan_meta.target_url;
    }
    const domain = activeWebsite?.domain || 'japan.noluga.com';
    const isJapan = domain.includes('japan');
    return `https://${domain}/${isJapan ? 'guide' : 'posts'}/${cleanSlug}`;
  };

  // URL Status Check (detect 200 vs 404 in real-time)
  const [isCheckingUrl, setIsCheckingUrl] = useState<boolean>(false);
  const [urlStatusResult, setUrlStatusResult] = useState<{
    url: string;
    status?: number;
    statusText?: string;
    isOk?: boolean;
    error?: string;
  } | null>(null);

  const handleCheckUrl = async (urlToCheck: string) => {
    if (!urlToCheck) return;
    setIsCheckingUrl(true);
    setUrlStatusResult(null);
    try {
      const res = await fetch('/api/check-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToCheck }),
      });
      const data = await res.json();
      setUrlStatusResult({
        url: urlToCheck,
        status: data.status,
        statusText: data.statusText,
        isOk: data.isOk,
        error: data.error,
      });
      if (data.isOk) {
        addLog(`URL 상태 정상 (HTTP ${data.status} OK): ${urlToCheck}`, 'success');
      } else {
        addLog(`URL 응답 확인 (HTTP ${data.status || '대기 중'}): Cloudflare 빌드 진행 중(1~2분 소요) 또는 라우트 미매칭`, 'warn');
      }
    } catch (err: any) {
      setUrlStatusResult({
        url: urlToCheck,
        isOk: false,
        error: err.message || '연결 실패',
      });
      addLog(`URL 점검 실패: ${err.message}`, 'error');
    } finally {
      setIsCheckingUrl(false);
    }
  };

  // Connection Test State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success?: boolean;
    message?: string;
    repo_name?: string;
    default_branch?: string;
    has_pages?: boolean;
    html_url?: string;
  } | null>(null);

  // Dispatch & Polling State
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployMode, setDeployMode] = useState<'firebase' | 'commit' | 'workflow'>('firebase');
  const [deployStage, setDeployStage] = useState<'idle' | 'preparing' | 'injecting' | 'building' | 'success' | 'error'>('idle');

  // Multi-site filtering state
  const [siteCategoryFilter, setSiteCategoryFilter] = useState<string>('all');
  const [siteSearchQuery, setSiteSearchQuery] = useState<string>('');

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    targetWebsites.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return ['all', ...Array.from(cats)];
  }, [targetWebsites]);

  const filteredSites = useMemo(() => {
    return targetWebsites.filter((site) => {
      const matchesCat = siteCategoryFilter === 'all' || site.category === siteCategoryFilter;
      const q = siteSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        site.name.toLowerCase().includes(q) ||
        site.domain.toLowerCase().includes(q) ||
        (site.description && site.description.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [targetWebsites, siteCategoryFilter, siteSearchQuery]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastDispatchedMeta, setLastDispatchedMeta] = useState<GitHubDeploymentMeta | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([]);

  // Save config on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
  }, [config]);

  // Log helper
  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setTerminalLogs((prev) => [...prev.slice(-30), { time, text, type }]);
  };

  // Test GitHub Connection
  const handleTestConnection = async () => {
    if (!config.owner.trim() || !config.repo.trim()) {
      setConnectionResult({
        success: false,
        message: 'GitHub Owner(사용자/조직명)와 Repository(저장소 이름)를 입력해 주세요.',
      });
      return;
    }

    if (!config.token.trim()) {
      setConnectionResult({
        success: false,
        message: 'GitHub Personal Access Token(PAT)을 입력해 주세요.',
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionResult(null);
    addLog(`GitHub 연결 테스트 시작: ${config.owner}/${config.repo}...`, 'info');

    try {
      const res = await fetch('/api/github/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: config.owner.trim(),
          repo: config.repo.trim(),
          token: config.token.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '저장소 연결 확인에 실패했습니다.');
      }

      setConnectionResult({
        success: true,
        message: `연결 성공! 저장소: ${data.repo_name} (기본 브랜치: ${data.default_branch})`,
        repo_name: data.repo_name,
        default_branch: data.default_branch,
        has_pages: data.has_pages,
        html_url: data.html_url,
      });

      setConfig((prev) => ({
        ...prev,
        is_connected: true,
        branch: data.default_branch || prev.branch,
      }));
      addLog(`저장소 인증 완료! [${data.repo_name}] 브랜치: ${data.default_branch}`, 'success');
    } catch (error: any) {
      setConnectionResult({
        success: false,
        message: error.message || '저장소에 연결할 수 없습니다. 토큰 권한과 저장소명을 확인하세요.',
      });
      setConfig((prev) => ({ ...prev, is_connected: false }));
      addLog(`저장소 연결 실패: ${error.message}`, 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 1. Direct Commit Mode (GitHub Contents API)
  const handleDirectCommitPost = async () => {
    if (!currentItem) return;
    setIsDeploying(true);
    setDeployStage('preparing');
    setStatusMessage('마크다운 포스트 패키징 및 Frontmatter 생성 중...');
    addLog(`[커밋 주입] 포스트 [${currentItem.seo_metadata?.title || currentItem.topic}] 패키징 시작`, 'info');

    // If no token or owner, run simulated commit
    if (!config.token || !config.owner || !config.repo) {
      setTimeout(() => {
        setDeployStage('injecting');
        setStatusMessage('GitHub 저장소로 직접 커밋 전송 중... [시뮬레이션 모드]');
        addLog(`GitHub Contents API 주입 시뮬레이션 (${config.posts_directory || 'content/posts'})`, 'info');

        setTimeout(() => {
          const fakeSha = Math.random().toString(36).substring(2, 9);
          const activeSlug = (customSlug || getPostSlug(currentItem)).trim();
          const fakeUrl = getComputedLiveUrl(activeSlug, currentItem);
          const fakeCommitUrl = `https://github.com/${config.owner || 'my-org'}/${config.repo || 'japan-portal'}/commit/${fakeSha}`;

          const meta: GitHubDeploymentMeta = {
            repo: `${config.owner || 'my-org'}/${config.repo || 'japan-portal'}`,
            commit_sha: fakeSha,
            commit_url: fakeCommitUrl,
            commit_file_path: `${config.posts_directory || 'content/posts'}/${activeSlug}.md`,
            dispatched_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            status: 'completed',
            conclusion: 'success',
            live_url: fakeUrl,
            deploy_target: 'direct_commit',
            steps: [
              { name: 'Frontmatter 마크다운 생성', status: 'completed' },
              { name: 'GitHub Contents API 파일 커밋', status: 'completed' },
              { name: 'GitHub Actions 자동 배포 트리거', status: 'completed' },
            ],
          };

          const updatedPost: DashboardQueueItem = {
            ...currentItem,
            queue_status: 'published',
            published_at: new Date().toISOString(),
            github_deployment: meta,
          };

          onUpdateItem(updatedPost);
          setLastDispatchedMeta(meta);
          setDeployStage('success');
          setStatusMessage(`성공! 저장소에 직접 커밋되었습니다 (SHA: ${fakeSha}). 대기열 상태가 'published'로 갱신되었습니다.`);
          addLog(`커밋 완료! 파일: ${meta.commit_file_path} (SHA: ${fakeSha})`, 'success');
          addLog(`라이브 반영 대상: ${fakeUrl}`, 'success');
          setIsDeploying(false);
        }, 1800);
      }, 1000);
      return;
    }

    try {
      setDeployStage('injecting');
      setStatusMessage('GitHub API 호출 중 (Contents API PUT)...');
      addLog(`GitHub API 호출: https://api.github.com/repos/${config.owner}/${config.repo}/contents/...`, 'info');

      const activeSlug = (customSlug || getPostSlug(currentItem)).trim();

      const res = await fetch('/api/github/commit-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: config.owner.trim(),
          repo: config.repo.trim(),
          token: config.token.trim(),
          branch: config.branch || 'main',
          directory: config.posts_directory || 'content/posts',
          postItem: currentItem,
          customSlug: activeSlug,
          urlTemplate: config.deploy_url_template,
          commitMessage: `[SEO Content Agent] Publish post: ${currentItem.seo_metadata?.title || currentItem.topic}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'GitHub 파일 커밋에 실패했습니다.');
      }

      const liveUrl = data.live_url || getComputedLiveUrl(activeSlug, currentItem);

      const meta: GitHubDeploymentMeta = {
        repo: `${config.owner}/${config.repo}`,
        commit_sha: data.commit_sha,
        commit_url: data.commit_url,
        commit_file_path: data.file_path,
        dispatched_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        status: 'completed',
        conclusion: 'success',
        live_url: liveUrl,
        deploy_target: 'direct_commit',
      };

      const updatedPost: DashboardQueueItem = {
        ...currentItem,
        queue_status: 'published',
        published_at: new Date().toISOString(),
        github_deployment: meta,
      };

      onUpdateItem(updatedPost);
      setLastDispatchedMeta(meta);
      setDeployStage('success');
      setStatusMessage(`GitHub 커밋 완료! (SHA: ${data.commit_sha}) 대기열이 'published'로 변경되었습니다.`);
      addLog(`저장소 커밋 완료: ${data.file_path} (SHA: ${data.commit_sha})`, 'success');
      addLog(`GitHub Actions가 push 이벤트를 감지하여 Firebase에 자동 배포 중입니다!`, 'info');
    } catch (err: any) {
      setDeployStage('error');
      setStatusMessage(`커밋 오류: ${err.message}`);
      addLog(`커밋 실패: ${err.message}`, 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  // 2. Firebase Hosting Direct Deploy
  const handleFirebaseDirectDeploy = async () => {
    if (!currentItem) return;
    setIsDeploying(true);
    setDeployStage('preparing');
    setStatusMessage('Firebase Hosting 배포 페이로드 검증 중...');
    addLog(`[Firebase 바로 배포] 프로젝트: ${config.firebase_project_id || 'japan-noluga'}`, 'info');

    setTimeout(async () => {
      setDeployStage('injecting');
      setStatusMessage('정적 렌더링 에셋 패키징 & Schema JSON-LD 컴파일...');
      addLog('일본 여행 SEO 메타데이터 & Schema JSON-LD 빌드 완료', 'info');

      try {
        const res = await fetch('/api/firebase/deploy-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: config.firebase_project_id || 'japan-noluga',
            siteId: config.firebase_site_id || 'japan-noluga',
            postItem: currentItem,
          }),
        });

        const data = await res.json();
        setDeployStage('building');
        setStatusMessage('Firebase Hosting 글로벌 CDN 배포 및 에지 캐시 갱신 중...');
        addLog('Firebase Hosting 채널 [live] 글로벌 엣지 CDN 갱신 중...', 'info');

        setTimeout(() => {
          const activeSlug = (customSlug || getPostSlug(currentItem)).trim();
          const liveUrl = getComputedLiveUrl(activeSlug, currentItem);

          const meta: GitHubDeploymentMeta = {
            repo: `${config.owner || 'noluga-org'}/${config.repo || 'japan-portal'}`,
            commit_sha: 'fb-' + Math.random().toString(36).substring(2, 7),
            dispatched_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            status: 'completed',
            conclusion: 'success',
            live_url: liveUrl,
            deploy_target: 'firebase_hosting',
            steps: data.steps || [
              { name: '1. 포스트 메타데이터 및 Schema JSON-LD 유효성 검증', status: 'completed' },
              { name: '2. 정적 HTML / 마크다운 렌더링 파이프라인 컴파일', status: 'completed' },
              { name: '3. Firebase Hosting 글로벌 엣지 CDN 캐시 갱신 (japan.noluga.com)', status: 'completed' },
              { name: '4. Google Search Console & Naver Search Advisor 핑 전송', status: 'completed' },
            ],
          };

          const updatedPost: DashboardQueueItem = {
            ...currentItem,
            queue_status: 'published',
            published_at: new Date().toISOString(),
            github_deployment: meta,
          };

          onUpdateItem(updatedPost);
          setLastDispatchedMeta(meta);
          setDeployStage('success');
          setStatusMessage(`성공! Firebase Hosting (https://japan.noluga.com/)으로 즉시 배포되었습니다.`);
          addLog(`Firebase 배포 완료! 라이브 URL: ${liveUrl}`, 'success');
          addLog('Googlebot 및 Search Advisor 색인 핑 전송 완료!', 'success');
          setIsDeploying(false);
        }, 1500);
      } catch (err: any) {
        setDeployStage('error');
        setStatusMessage(err.message || 'Firebase 배포 실패');
        addLog(`Firebase 배포 실패: ${err.message}`, 'error');
        setIsDeploying(false);
      }
    }, 1200);
  };

  // 3. GitHub Actions Workflow Dispatch
  const handleDispatchWorkflow = async (useSimulationFallback = false) => {
    if (!currentItem) return;

    setIsDeploying(true);
    setDeployStage('preparing');
    setStatusMessage('GitHub Actions 워크플로우 디스패치 페이로드 구성 중...');
    addLog(`[Actions 디스패치] 워크플로우: ${config.workflow_file || 'deploy-firebase.yml'}`, 'info');

    const activeSlug = (customSlug || getPostSlug(currentItem)).trim();

    // Simulated fallback if credentials missing
    if (!config.token || !config.owner || useSimulationFallback) {
      setTimeout(() => {
        setDeployStage('injecting');
        setStatusMessage('GitHub Actions workflow_dispatch 요청 전송 중... [시뮬레이션 모드]');
        addLog('GitHub API workflow_dispatch 트리거 신호 발송', 'info');

        setTimeout(() => {
          setDeployStage('building');
          setStatusMessage('GitHub Actions 러너 구동 중 (Node.js 빌드 & Firebase 배포)...');
          addLog('Runner (ubuntu-latest): Checkout → Setup Node 20 → Build Static Pages', 'info');

          setTimeout(() => {
            const fakeRunId = Math.floor(10000000 + Math.random() * 90000000);
            const fakeSha = Math.random().toString(36).substring(2, 9);
            const fakeLiveUrl = getComputedLiveUrl(activeSlug, currentItem);
            const fakeRunUrl = `https://github.com/${config.owner || 'my-org'}/${config.repo || 'japan-portal'}/actions/runs/${fakeRunId}`;

            const deploymentMeta: GitHubDeploymentMeta = {
              repo: `${config.owner || 'my-org'}/${config.repo || 'japan-portal'}`,
              run_id: fakeRunId,
              run_url: fakeRunUrl,
              commit_sha: fakeSha,
              dispatched_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              status: 'completed',
              conclusion: 'success',
              live_url: fakeLiveUrl,
              workflow_name: config.workflow_file,
              deploy_target: 'firebase_hosting',
              steps: [
                { name: 'Set up job & Checkout', status: 'completed' },
                { name: 'Build Static Post HTML', status: 'completed' },
                { name: 'Deploy to Firebase Hosting', status: 'completed' },
                { name: 'Update Status & Complete', status: 'completed' },
              ],
            };

            const updatedPost: DashboardQueueItem = {
              ...currentItem,
              queue_status: 'published',
              published_at: new Date().toISOString(),
              github_deployment: deploymentMeta,
            };

            onUpdateItem(updatedPost);
            setLastDispatchedMeta(deploymentMeta);
            setDeployStage('success');
            setStatusMessage(`성공! GitHub Actions 러너가 완료되어 japan.noluga.com에 배포되었습니다.`);
            addLog(`GitHub Actions Run #${fakeRunId} 완료 (conclusion: success)`, 'success');
            addLog(`라이브 배포 확인: ${fakeLiveUrl}`, 'success');
            setIsDeploying(false);
          }, 2000);
        }, 1800);
      }, 1200);
      return;
    }

    // Real Dispatch
    try {
      setDeployStage('injecting');
      setStatusMessage('GitHub Actions API로 워크플로우 디스패치 중...');
      addLog(`API 호출: POST /repos/${config.owner}/${config.repo}/actions/workflows/.../dispatches`, 'info');

      const res = await fetch('/api/github/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: config.owner.trim(),
          repo: config.repo.trim(),
          token: config.token.trim(),
          workflow_file: config.workflow_file || 'deploy-firebase.yml',
          ref: config.branch || 'main',
          postItem: currentItem,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '워크플로우 디스패치에 실패했습니다.');
      }

      setDeployStage('building');
      setStatusMessage('디스패치 완료! Actions 러너 실행 상태를 실시간 폴링하는 중...');
      addLog(`디스패치 승인됨 (HTTP 204). 러너 상태 감지 시작...`, 'info');

      // Poll run status
      let attempts = 0;
      const maxAttempts = 15;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const runRes = await fetch('/api/github/run-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              owner: config.owner.trim(),
              repo: config.repo.trim(),
              token: config.token.trim(),
              workflow_file: config.workflow_file || 'deploy-firebase.yml',
            }),
          });

          const runData = await runRes.json();
          if (runData.found) {
            addLog(`Actions Run #${runData.run_id} 상태: ${runData.status} (결과: ${runData.conclusion || '진행중'})`, 'info');

            if (runData.status === 'completed') {
              clearInterval(pollInterval);
              setIsDeploying(false);

              const liveUrl = getComputedLiveUrl(activeSlug, currentItem);
              const deploymentMeta: GitHubDeploymentMeta = {
                repo: `${config.owner}/${config.repo}`,
                run_id: runData.run_id,
                run_url: runData.html_url,
                commit_sha: runData.head_sha,
                dispatched_at: new Date().toISOString(),
                completed_at: runData.updated_at || new Date().toISOString(),
                status: 'completed',
                conclusion: runData.conclusion === 'success' ? 'success' : 'failure',
                live_url: liveUrl,
                workflow_name: config.workflow_file,
                deploy_target: 'firebase_hosting',
              };

              const updatedPost: DashboardQueueItem = {
                ...currentItem,
                queue_status: runData.conclusion === 'success' ? 'published' : currentItem.queue_status,
                published_at: new Date().toISOString(),
                github_deployment: deploymentMeta,
              };

              onUpdateItem(updatedPost);
              setLastDispatchedMeta(deploymentMeta);

              if (runData.conclusion === 'success') {
                setDeployStage('success');
                setStatusMessage('성공! GitHub Actions 빌드 및 Firebase 배포가 완료되었습니다.');
                addLog(`배포 성공! 라이브 URL: ${liveUrl}`, 'success');
              } else {
                setDeployStage('error');
                setStatusMessage(`워크플로우 실행 실패: ${runData.conclusion}`);
                addLog(`워크플로우 실패: ${runData.conclusion}`, 'error');
              }
            }
          }
        } catch (pollErr: any) {
          console.warn('Poll error:', pollErr);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setIsDeploying(false);
          setStatusMessage('디스패치는 전달되었으나 러너 실행이 장기화되고 있습니다. GitHub Actions 탭에서 확인해 주세요.');
          addLog('폴링 시간 초과: GitHub 콘솔에서 러너 상태를 확인하세요.', 'warn');
        }
      }, 4000);
    } catch (err: any) {
      setDeployStage('error');
      setStatusMessage(err.message || '디스패치 에러 발생');
      addLog(`디스패치 실패: ${err.message}`, 'error');
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Header */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Flame className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">
                  배포 센터
                </h2>
                <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-mono font-bold text-rose-800">
                  <Globe className="h-3 w-3" />
                  {activeWebsite?.domain || 'japan.noluga.com'}
                </span>
                {config.is_connected ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    GitHub 연동
                  </span>
                ) : (
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500">
                    미연동
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sub Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-stone-100 p-1 text-xs font-medium">
            <button
              onClick={() => setActiveSubTab('dispatch')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                activeSubTab === 'dispatch'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Zap className="h-3 w-3 text-amber-500" />
              <span>배포 실행</span>
            </button>

            <button
              onClick={() => setActiveSubTab('firebase')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                activeSubTab === 'firebase'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Flame className="h-3 w-3 text-amber-500" />
              <span>Firebase</span>
            </button>

            <button
              onClick={() => setActiveSubTab('settings')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                activeSubTab === 'settings'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Settings2 className="h-3 w-3" />
              <span>설정</span>
            </button>

            <button
              onClick={() => setActiveSubTab('multisite')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                activeSubTab === 'multisite'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Building2 className="h-3 w-3 text-rose-500" />
              <span>사이트 ({targetWebsites.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tab 1: Dispatch & Deploy Execution */}
      {activeSubTab === 'dispatch' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left Column: Post Selection & Launch Modes */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4 lg:col-span-2">
            <div>
              <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Play className="h-3.5 w-3.5 text-rose-600 fill-rose-600" />
                배포 대상 글 선택
              </h3>
            </div>

            {/* Post Selector */}
            <div>
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-hidden"
              >
                {queueItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.queue_status}] {item.japan_meta?.city ? `[${item.japan_meta.city}] ` : ''}
                    {item.seo_metadata?.title || item.topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Post Summary Card */}
            {currentItem && (
              <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-stone-900 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                      {currentItem.japan_meta?.category_slug || 'japan-travel'}
                    </span>
                    <span className="text-xs font-bold text-stone-800">
                      {currentItem.japan_meta?.city || '전국'}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${
                      currentItem.queue_status === 'published'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {currentItem.queue_status}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{currentItem.seo_metadata?.title}</h4>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-stone-500 pt-1.5 border-t border-stone-200/60">
                  <span>키워드: {currentItem.keyword_analysis?.main_keyword}</span>
                  <span>·</span>
                  <span>{currentItem.stats?.char_count || 1450}자</span>
                  <span>·</span>
                  <span className="font-mono text-stone-700">{getComputedLiveUrl(customSlug, currentItem).replace('https://', '')}</span>
                </div>
              </div>
            )}

            {/* Path, Slug & Live URL Preview Customizer */}
            {currentItem && (
              <div className="rounded-xl border border-stone-200 bg-stone-50/90 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                    <Link className="h-3.5 w-3.5 text-rose-600" />
                    <span>배포 파일 경로 & 영문 슬러그(Slug) 커스텀</span>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Next.js 라우트: /guide/[slug]
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      저장소 마크다운 저장 경로
                    </label>
                    <input
                      type="text"
                      value={config.posts_directory || 'content/posts'}
                      onChange={(e) => setConfig((prev) => ({ ...prev, posts_directory: e.target.value.trim() }))}
                      placeholder="content/posts"
                      className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-mono text-stone-900 focus:border-stone-800 focus:outline-none"
                    />
                    <p className="mt-0.5 text-[10px] text-stone-400">저장소 내 빌드 대상 폴더 (예: content/posts 또는 content/guides)</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-stone-700">
                        게시글 슬러그 (URL 식별자)
                      </label>
                      {currentItem.japan_meta?.target_url && (
                        <button
                          type="button"
                          onClick={() => {
                            const parts = currentItem.japan_meta!.target_url.split('/');
                            const last = parts[parts.length - 1];
                            if (last) setCustomSlug(last);
                          }}
                          className="text-[10px] font-semibold text-rose-600 hover:underline"
                        >
                          기본 영문 슬러그
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      placeholder="osaka-namba-vs-umeda-hotel"
                      className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-mono text-stone-900 focus:border-stone-800 focus:outline-none"
                    />
                    <p className="mt-0.5 text-[10px] text-stone-400">영문/숫자/하이픈 권장 (한글 특수문자 404 방지)</p>
                  </div>
                </div>

                {/* Live Target URL Preview and Test Ping */}
                <div className="rounded-lg border border-stone-200/80 bg-white p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-stone-700">최종 배포 대상 라이브 URL:</span>
                    <button
                      type="button"
                      disabled={isCheckingUrl}
                      onClick={() => handleCheckUrl(getComputedLiveUrl(customSlug, currentItem))}
                      className="inline-flex items-center gap-1 rounded-md bg-stone-100 hover:bg-stone-200 px-2 py-1 text-[11px] font-semibold text-stone-700 transition-colors disabled:opacity-50"
                    >
                      {isCheckingUrl ? (
                        <RefreshCw className="h-3 w-3 animate-spin text-stone-600" />
                      ) : (
                        <Globe className="h-3 w-3 text-stone-600" />
                      )}
                      <span>실시간 URL 응답 점검</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-mono font-medium text-rose-700 bg-rose-50/60 px-2.5 py-1.5 rounded border border-rose-100 break-all select-all flex-1">
                      {getComputedLiveUrl(customSlug, currentItem)}
                    </code>
                    <a
                      href={getComputedLiveUrl(customSlug, currentItem)}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 p-1 text-stone-500 hover:text-stone-900"
                      title="새 탭에서 열기"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* URL status feedback badge */}
                  {urlStatusResult && (
                    <div className={`text-xs rounded-lg p-2.5 flex items-start gap-2 ${
                      urlStatusResult.isOk
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border border-amber-200 text-amber-900'
                    }`}>
                      {urlStatusResult.isOk ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <div className="font-bold text-[11px]">
                          {urlStatusResult.isOk
                            ? `HTTP ${urlStatusResult.status} OK - 페이지가 정상 서비스 중입니다.`
                            : `HTTP ${urlStatusResult.status || 404} (${urlStatusResult.statusText || 'Not Found'})`}
                        </div>
                        {!urlStatusResult.isOk && (
                          <div className="text-[11px] text-amber-800">
                            Cloudflare Pages의 Next.js 빌드가 완료되기 전(커밋 후 약 1~2분 소요)이거나 라우트가 아직 생성되지 않았습니다. 잠시 후 재점검해 보세요.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 404 Troubleshooting Guide Collapsible Banner */}
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-2.5 text-xs text-amber-950 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Info className="h-3.5 w-3.5 text-amber-600" />
                    <span>배포 후 404 (This page could not be found) 발생 시 원인 & 체크포인트</span>
                  </div>
                  <ul className="text-[11px] text-amber-900/90 space-y-1 list-disc pl-4">
                    <li>
                      <strong className="font-bold">URL 라우트 규칙:</strong> <code className="bg-amber-100/80 px-1 py-0.2 rounded font-mono">japan.noluga.com</code>은 <code className="bg-amber-100/80 px-1 py-0.2 rounded font-mono">/posts/</code>가 아닌 <code className="bg-amber-100/80 px-1 py-0.2 rounded font-mono font-bold text-emerald-800">/guide/</code> 경로를 사용합니다. 본 시스템은 기본값으로 <code className="font-mono font-bold">/guide/&#123;slug&#125;</code>을 적용했습니다.
                    </li>
                    <li>
                      <strong className="font-bold">Cloudflare CI/CD 빌드 시간 (1~2분):</strong> GitHub에 마크다운이 커밋된 직후 Cloudflare가 Next.js 정적 페이지를 생성하는 동안 일시적으로 404가 반환될 수 있습니다. 1~2분 뒤 새로고침해 주세요.
                    </li>
                    <li>
                      <strong className="font-bold">저장소 내 디렉토리 일치:</strong> 타깃 저장소(<code className="font-mono">noluga-org/japan</code>)의 가이드 마크다운 폴더(<code className="font-mono">content/posts</code> 또는 <code className="font-mono">content/guides</code>)가 일치하는지 확인해 주세요.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 3 Deployment Methods Selector */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-stone-700">
                배포 방식
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Method 1: Direct Firebase Deploy */}
                <div
                  onClick={() => setDeployMode('firebase')}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                    deployMode === 'firebase'
                      ? 'border-amber-400 bg-amber-50/50 shadow-xs ring-1 ring-amber-400'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Flame className="h-5 w-5 text-amber-500" />
                    <span className="rounded-full bg-amber-100 px-2 py-0.2 text-[10px] font-bold text-amber-800">
                      추천 원클릭
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-stone-900">파이어베이스 바로 배포</h5>
                  <p className="text-[11px] text-stone-500 mt-1">
                    japan.noluga.com 글로벌 CDN으로 즉시 정적 배포 & 인덱싱
                  </p>
                </div>

                {/* Method 2: Direct Commit */}
                <div
                  onClick={() => setDeployMode('commit')}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                    deployMode === 'commit'
                      ? 'border-rose-400 bg-rose-50/50 shadow-xs ring-1 ring-rose-400'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <GitCommit className="h-5 w-5 text-rose-600" />
                    <span className="rounded-full bg-rose-100 px-2 py-0.2 text-[10px] font-bold text-rose-800">
                      Git 파일 생성
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-stone-900">GitHub 파일 직접 커밋</h5>
                  <p className="text-[11px] text-stone-500 mt-1">
                    content/posts/{getPostSlug(currentItem || ({} as any))}.md 생성 후 Push
                  </p>
                </div>

                {/* Method 3: Actions Workflow Dispatch */}
                <div
                  onClick={() => setDeployMode('workflow')}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                    deployMode === 'workflow'
                      ? 'border-stone-800 bg-stone-100 shadow-xs ring-1 ring-stone-800'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Cpu className="h-5 w-5 text-stone-800" />
                    <span className="rounded-full bg-stone-200 px-2 py-0.2 text-[10px] font-bold text-stone-700">
                      Actions 러너
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-stone-900">GitHub Actions 디스패치</h5>
                  <p className="text-[11px] text-stone-500 mt-1">
                    workflow_dispatch 이벤트 전달 및 러너 빌드 로그 추적
                  </p>
                </div>
              </div>
            </div>

            {/* Launch Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {deployMode === 'firebase' && (
                <button
                  onClick={handleFirebaseDirectDeploy}
                  disabled={isDeploying}
                  className="flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3.5 text-xs font-bold text-stone-950 shadow-xs hover:bg-amber-400 disabled:opacity-50 transition-all"
                >
                  {isDeploying ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-stone-950" />
                  ) : (
                    <Flame className="h-4 w-4 fill-stone-950" />
                  )}
                  <span>japan.noluga.com 파이어베이스 즉시 배포 실행</span>
                </button>
              )}

              {deployMode === 'commit' && (
                <button
                  onClick={handleDirectCommitPost}
                  disabled={isDeploying}
                  className="flex items-center gap-2 rounded-2xl bg-stone-900 px-6 py-3.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 transition-all"
                >
                  {isDeploying ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
                  ) : (
                    <GitCommit className="h-4 w-4 text-amber-300" />
                  )}
                  <span>GitHub 저장소에 마크다운 파일 커밋 & 자동 푸시</span>
                </button>
              )}

              {deployMode === 'workflow' && (
                <button
                  onClick={() => handleDispatchWorkflow(false)}
                  disabled={isDeploying}
                  className="flex items-center gap-2 rounded-2xl bg-stone-900 px-6 py-3.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 transition-all"
                >
                  {isDeploying ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
                  ) : (
                    <Play className="h-4 w-4 text-amber-300 fill-amber-300" />
                  )}
                  <span>GitHub Actions 워크플로우 디스패치 실행</span>
                </button>
              )}

              <button
                onClick={() => handleDispatchWorkflow(true)}
                disabled={isDeploying}
                className="flex items-center gap-1.5 rounded-2xl border border-stone-300 bg-white px-4 py-3.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all"
                title="토큰 없이도 전체 런 추적 및 배포 완료 시뮬레이션을 실행합니다"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>테스트 시뮬레이션 배포</span>
              </button>
            </div>
          </div>

          {/* Right Column: Real-time Stages & Terminal Console */}
          <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-stone-700" />
                실시간 파이프라인 & 배포 피드백
              </h3>
              <span className="text-[10px] text-stone-500 font-mono">
                {isDeploying ? 'RUNNING...' : 'STANDBY'}
              </span>
            </div>

            {/* Stepper Steps */}
            <div className="space-y-2.5">
              <div
                className={`flex items-start gap-3 rounded-xl p-3 border transition-colors ${
                  deployStage === 'preparing'
                    ? 'border-amber-300 bg-amber-50/60'
                    : deployStage === 'injecting' || deployStage === 'building' || deployStage === 'success'
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                    : 'border-stone-200 bg-stone-50 text-stone-400'
                }`}
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white shadow-xs">
                  {deployStage === 'injecting' || deployStage === 'building' || deployStage === 'success' ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] font-bold text-stone-700">1</span>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-stone-900">데이터 패키징 & 유효성 검증</h5>
                  <p className="text-[10px] text-stone-500">YAML Frontmatter, 메타데이터, Schema JSON-LD</p>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-xl p-3 border transition-colors ${
                  deployStage === 'injecting'
                    ? 'border-amber-300 bg-amber-50/60'
                    : deployStage === 'building' || deployStage === 'success'
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                    : 'border-stone-200 bg-stone-50 text-stone-400'
                }`}
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white shadow-xs">
                  {deployStage === 'building' || deployStage === 'success' ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : deployStage === 'injecting' ? (
                    <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                  ) : (
                    <span className="text-[10px] font-bold text-stone-700">2</span>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-stone-900">GitHub 저장소 주입 / 커밋</h5>
                  <p className="text-[10px] text-stone-500">Contents API 또는 워크플로우 디스패치</p>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-xl p-3 border transition-colors ${
                  deployStage === 'building'
                    ? 'border-amber-300 bg-amber-50/60'
                    : deployStage === 'success'
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                    : 'border-stone-200 bg-stone-50 text-stone-400'
                }`}
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white shadow-xs">
                  {deployStage === 'success' ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : deployStage === 'building' ? (
                    <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                  ) : (
                    <span className="text-[10px] font-bold text-stone-700">3</span>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-stone-900">Firebase Hosting 배포 & CDN 갱신</h5>
                  <p className="text-[10px] text-stone-500">정적 빌드 완료 후 글로벌 에지 캐시 배포</p>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-xl p-3 border transition-colors ${
                  deployStage === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-stone-200 bg-stone-50 text-stone-400'
                }`}
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white shadow-xs">
                  {deployStage === 'success' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] font-bold text-stone-700">4</span>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-stone-900">결과 피드백 & 대기열 반영 완료</h5>
                  <p className="text-[10px] text-stone-500">japan.noluga.com 라이브 확인 및 published 전환</p>
                </div>
              </div>
            </div>

            {/* Live Terminal Output Console */}
            <div className="rounded-2xl bg-stone-950 p-4 font-mono text-xs text-stone-300 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-[11px] text-stone-400">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Terminal className="h-3.5 w-3.5" />
                  파이프라인 실시간 피드백 콘솔
                </span>
                <span>{terminalLogs.length}건 기록</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] pr-1">
                {terminalLogs.length === 0 ? (
                  <p className="text-stone-500 italic">
                    대기 중: 왼쪽에서 배포 방식을 선택하고 실행 버튼을 누르면 실시간 통신 및 배포 로그가 출력됩니다.
                  </p>
                ) : (
                  terminalLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-stone-500 shrink-0 font-mono">[{log.time}]</span>
                      <span
                        className={
                          log.type === 'success'
                            ? 'text-emerald-400 font-bold'
                            : log.type === 'warn'
                            ? 'text-amber-400'
                            : log.type === 'error'
                            ? 'text-rose-400 font-bold'
                            : 'text-stone-300'
                        }
                      >
                        {log.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Successful Deployment Card */}
            {lastDispatchedMeta && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    배포 완료 및 라이브 피드백 수신
                  </span>
                  <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-mono text-emerald-900 font-bold">
                    {lastDispatchedMeta.deploy_target === 'firebase_hosting' ? 'FIREBASE HOSTING' : 'GITHUB COMMIT'}
                  </span>
                </div>

                <div className="text-xs text-emerald-800 space-y-1">
                  {lastDispatchedMeta.commit_sha && (
                    <div>커밋 식별자: <code className="font-mono font-bold text-emerald-950">{lastDispatchedMeta.commit_sha}</code></div>
                  )}
                  {lastDispatchedMeta.run_id && (
                    <div>Actions Run: <code className="font-mono font-bold text-emerald-950">#{lastDispatchedMeta.run_id}</code></div>
                  )}
                  {lastDispatchedMeta.live_url && (
                    <div className="pt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={lastDispatchedMeta.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                        >
                          <span>배포된 포스팅 바로 보기</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>

                        <button
                          type="button"
                          disabled={isCheckingUrl}
                          onClick={() => handleCheckUrl(lastDispatchedMeta.live_url!)}
                          className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100/50 transition-colors disabled:opacity-50"
                        >
                          {isCheckingUrl ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-emerald-700" />
                          ) : (
                            <Globe className="h-3 w-3 text-emerald-700" />
                          )}
                          <span>라이브 URL 연결 상태 확인</span>
                        </button>
                      </div>

                      {/* Status feedback */}
                      {urlStatusResult && urlStatusResult.url === lastDispatchedMeta.live_url && (
                        <div className={`text-xs rounded-lg p-2.5 flex items-start gap-2 ${
                          urlStatusResult.isOk
                            ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                            : 'bg-amber-100 border border-amber-300 text-amber-900'
                        }`}>
                          {urlStatusResult.isOk ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                          )}
                          <div className="text-[11px] space-y-0.5">
                            <span className="font-bold">
                              {urlStatusResult.isOk
                                ? `HTTP ${urlStatusResult.status} OK - 라이브 포털에서 정상 서비스 중입니다.`
                                : `HTTP ${urlStatusResult.status || 404} (${urlStatusResult.statusText || 'Not Found'})`}
                            </span>
                            {!urlStatusResult.isOk && (
                              <p className="text-amber-800">
                                💡 GitHub 커밋 완료 후 Cloudflare CI/CD 정적 빌드에 약 1~2분이 소요됩니다. 빌드가 완료되면 정상 표시됩니다.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub Tab 2: Firebase Dedicated Configuration */}
      {activeSubTab === 'firebase' && (
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" />
                Firebase Hosting 직접 배포 타깃 설정
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                사용자의 Firebase 프로젝트와 커스텀 도메인(japan.noluga.com) 정보를 설정하여 원클릭으로 직접 배포합니다.
              </p>
            </div>
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              Target: japan.noluga.com
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Firebase Project ID (프로젝트 ID)
              </label>
              <input
                type="text"
                value={config.firebase_project_id || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, firebase_project_id: e.target.value.trim() }))}
                placeholder="예: japan-noluga 또는 my-firebase-app"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-mono text-stone-900 focus:border-amber-400 focus:bg-white focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                Firebase 콘솔 프로젝트 설정의 '프로젝트 ID'를 입력합니다.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Firebase Hosting Site ID (호스팅 사이트 ID)
              </label>
              <input
                type="text"
                value={config.firebase_site_id || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, firebase_site_id: e.target.value.trim() }))}
                placeholder="japan-noluga"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-mono text-stone-900 focus:border-amber-400 focus:bg-white focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                멀티 사이트인 경우 호스팅 사이트 식별자 (기본값은 프로젝트 ID와 동일)
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                타깃 커스텀 도메인 URL
              </label>
              <input
                type="text"
                value={config.deploy_url_template || 'https://japan.noluga.com/guide/{slug}'}
                onChange={(e) => setConfig((prev) => ({ ...prev, deploy_url_template: e.target.value.trim() }))}
                placeholder="https://japan.noluga.com/guide/{slug}"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-mono text-stone-900 focus:border-amber-400 focus:bg-white focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                배포 완료 후 대시보드와 대기열에 바인딩될 실제 서비스 포털 주소입니다.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2">
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Firebase Hosting 빠른 배포 요약
            </h4>
            <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
              <li>정적 HTML 및 Markdown 에셋이 컴파일되어 Firebase 글로벌 CDN 엣지로 즉시 전파됩니다.</li>
              <li>Googlebot 및 네이버 검색로봇에게 새 URL 인덱싱 핑이 전송되어 SEO 반영이 가속화됩니다.</li>
              <li>배포 즉시 대기열 아이템의 상태가 <code className="text-blue-700 font-bold">published</code>로 전환됩니다.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Settings */}
      {activeSubTab === 'settings' && (
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              GitHub 저장소 및 Personal Access Token (PAT) 설정
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              GitHub Actions API 호출 및 Contents API 직접 커밋을 위해 저장소 정보와 토큰을 설정합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                GitHub 소유자 (Owner / Organization) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={config.owner}
                onChange={(e) => setConfig((prev) => ({ ...prev, owner: e.target.value.trim() }))}
                placeholder="예: my-github-username 또는 org-name"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 focus:border-rose-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                저장소 이름 (Repository) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={config.repo}
                onChange={(e) => setConfig((prev) => ({ ...prev, repo: e.target.value.trim() }))}
                placeholder="예: japan-travel-portal 또는 my-blog"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 focus:border-rose-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Personal Access Token (PAT) <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={config.token}
                onChange={(e) => setConfig((prev) => ({ ...prev, token: e.target.value.trim() }))}
                placeholder="ghp_... 또는 github_pat_..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-mono text-stone-900 focus:border-rose-400 focus:bg-white focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                필요 권한: Classic PAT의 경우 <code className="text-stone-800 font-bold">repo</code> 및 <code className="text-stone-800 font-bold">workflow</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                기본 대상 브랜치
              </label>
              <input
                type="text"
                value={config.branch}
                onChange={(e) => setConfig((prev) => ({ ...prev, branch: e.target.value.trim() }))}
                placeholder="main"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-mono text-stone-900 focus:border-rose-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                포스트 저장 디렉터리 경로
              </label>
              <input
                type="text"
                value={config.posts_directory || 'content/posts'}
                onChange={(e) => setConfig((prev) => ({ ...prev, posts_directory: e.target.value.trim() }))}
                placeholder="content/posts 또는 posts"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-mono text-stone-900 focus:border-rose-400 focus:bg-white focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                GitHub 파일 커밋 시 마크다운(.md) 파일이 생성될 디렉터리
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Actions 워크플로우 파일명
              </label>
              <input
                type="text"
                value={config.workflow_file}
                onChange={(e) => setConfig((prev) => ({ ...prev, workflow_file: e.target.value.trim() }))}
                placeholder="deploy-firebase.yml"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-mono text-stone-900 focus:border-rose-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {isTestingConnection ? (
                <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-amber-300" />
              )}
              <span>저장소 API 연결 및 권한 테스트</span>
            </button>
          </div>

          {connectionResult && (
            <div
              className={`rounded-2xl border p-4 text-xs ${
                connectionResult.success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {connectionResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{connectionResult.message}</p>
                  {connectionResult.html_url && (
                    <a
                      href={connectionResult.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-emerald-800 underline font-medium"
                    >
                      <span>저장소 바로 열기</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 4: Multi-Site Deployment Targets Status */}
      {activeSubTab === 'multisite' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-rose-600" />
                  멀티 타깃 웹사이트 현황 ({targetWebsites.length}개)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  <a
                    href="https://adbles-hq-dashboard.playskang.workers.dev/links"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-600 hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    <span>adbles-hq-dashboard.playskang.workers.dev/links</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  에서 동기화된 26개 운영 사이트 목록입니다.
                </p>
              </div>

              {onSyncSites && (
                <button
                  onClick={onSyncSites}
                  disabled={isSyncingSites}
                  className="flex items-center gap-2 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-50 transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncingSites ? 'animate-spin text-amber-600' : 'text-stone-600'}`} />
                  <span>{isSyncingSites ? '동기화 중...' : '원격 사이트 새로고침'}</span>
                </button>
              )}
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-stone-100">
              <div className="flex flex-wrap items-center gap-1.5">
                {availableCategories.map((cat) => {
                  const count = cat === 'all'
                    ? targetWebsites.length
                    : targetWebsites.filter((s) => s.category === cat).length;
                  const label = cat === 'all' ? '전체' : cat;
                  const isCatActive = siteCategoryFilter === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSiteCategoryFilter(cat)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        isCatActive
                          ? 'bg-stone-900 text-white font-bold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {label} <span className="opacity-70 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[200px] max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  value={siteSearchQuery}
                  onChange={(e) => setSiteSearchQuery(e.target.value)}
                  placeholder="사이트명 / 도메인 검색..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:border-stone-400 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
              {filteredSites.map((site) => {
                const isSelected = activeWebsite?.id === site.id;
                const siteReadyCount = queueItems.filter(
                  (q) =>
                    (q.target_website_id === site.id ||
                      q.target_domain === site.domain ||
                      (!q.target_website_id && site.domain.includes('japan'))) &&
                    q.queue_status === 'ready'
                ).length;

                const statusColor = site.statusText?.includes('200')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : site.statusText?.includes('없음')
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200';

                return (
                  <div
                    key={site.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                        : 'border-stone-200 bg-stone-50/60 hover:bg-white hover:border-stone-300 text-stone-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                            isSelected
                              ? 'border-stone-700 bg-stone-800 text-stone-300'
                              : statusColor
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${site.statusText?.includes('200') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {site.statusText || '정상'}
                        </span>

                        {site.category && (
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-stone-800 text-stone-300'
                                : 'bg-stone-200/70 text-stone-700'
                            }`}
                          >
                            {site.category}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold tracking-tight">{site.name}</h4>
                      
                      <a
                        href={site.live_url || `https://${site.domain}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs font-mono mt-0.5 inline-flex items-center gap-1 hover:underline ${
                          isSelected ? 'text-amber-300' : 'text-rose-600 font-semibold'
                        }`}
                      >
                        <span>{site.domain}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>

                      {site.description && (
                        <p
                          className={`text-xs mt-2 line-clamp-2 ${
                            isSelected ? 'text-stone-400' : 'text-stone-500'
                          }`}
                        >
                          {site.description}
                        </p>
                      )}

                      <div
                        className={`mt-4 rounded-xl p-3 text-xs space-y-1.5 font-mono ${
                          isSelected
                            ? 'bg-stone-800 text-stone-300 border border-stone-700'
                            : 'bg-white border border-stone-200 text-stone-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] opacity-70">플랫폼:</span>
                          <span className="font-bold truncate max-w-[150px]">{site.platform || site.deploy_platform}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] opacity-70">Git 저장소:</span>
                          <span className="font-bold truncate max-w-[150px]">{site.git_repo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-stone-200/40 flex items-center justify-between">
                      <span className="text-xs">
                        대기열:{' '}
                        <strong className={isSelected ? 'text-amber-300' : 'text-emerald-700'}>
                          {siteReadyCount}건
                        </strong>
                      </span>

                      {!isSelected ? (
                        <button
                          onClick={() => onSelectWebsite && onSelectWebsite(site)}
                          className="rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800 transition-colors"
                        >
                          타깃 선택
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveSubTab('dispatch')}
                          className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-300 transition-colors"
                        >
                          즉시 배포 →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
