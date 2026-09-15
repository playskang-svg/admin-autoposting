import React, { useState } from 'react';
import { X, Globe, GitBranch, Flame, Plus, Check } from 'lucide-react';
import { TargetWebsite } from '../types';

interface AddWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWebsite: (website: TargetWebsite) => void;
}

export const AddWebsiteModal: React.FC<AddWebsiteModalProps> = ({
  isOpen,
  onClose,
  onAddWebsite,
}) => {
  const [domain, setDomain] = useState('');
  const [name, setName] = useState('');
  const [themeLabel, setThemeLabel] = useState('');
  const [description, setDescription] = useState('');
  const [gitRepo, setGitRepo] = useState('noluga-org/new-portal');
  const [branch, setBranch] = useState('main');
  const [postsDir, setPostsDir] = useState('content/posts');
  const [deployPlatform, setDeployPlatform] = useState<TargetWebsite['deploy_platform']>('firebase_hosting');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || !name.trim()) return;

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const newSite: TargetWebsite = {
      id: `site-${Date.now().toString(36)}`,
      name: name.trim(),
      domain: cleanDomain,
      theme_label: themeLabel.trim() || '신규 큐레이션 포털',
      description: description.trim() || `${cleanDomain} 자동 발행 사이트`,
      git_repo: gitRepo.trim() || 'noluga-org/portal',
      branch: branch.trim() || 'main',
      posts_directory: postsDir.trim() || 'content/posts',
      deploy_platform: deployPlatform,
      firebase_project_id: firebaseProjectId.trim() || cleanDomain.replace(/\./g, '-'),
      status: 'active',
      created_at: new Date().toISOString(),
      total_posts: 0,
      live_url: `https://${cleanDomain}`,
    };

    onAddWebsite(newSite);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-amber-300">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">새 타깃 웹사이트 등록</h3>
              <p className="text-xs text-stone-500">
                자동 발행 파이프라인에 연결할 새로운 웹사이트를 추가합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Domain & Site Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-stone-700">도메인 URL *</label>
              <input
                type="text"
                required
                placeholder="예: tokyo.noluga.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-mono text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-stone-700">사이트 명칭 *</label>
              <input
                type="text"
                required
                placeholder="예: 놀루가 도쿄"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Theme & Description */}
          <div className="space-y-1">
            <label className="font-bold text-stone-700">핵심 주제 / 카테고리 테마</label>
            <input
              type="text"
              placeholder="예: 도쿄 핫플레이스, 미식 맛집, 지하철 패스 가이드"
              value={themeLabel}
              onChange={(e) => setThemeLabel(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700">사이트 설명</label>
            <input
              type="text"
              placeholder="예: 도쿄 자유여행객을 위한 실시간 큐레이션 및 숙소 비교 포털"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          {/* GitHub Repo & Posts Directory */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5 space-y-3">
            <span className="font-bold text-stone-800 flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-stone-600" />
              GitHub 저장소 및 배포 경로 설정
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-stone-500 block mb-0.5">저장소 (owner/repo)</label>
                <input
                  type="text"
                  value={gitRepo}
                  onChange={(e) => setGitRepo(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-500 block mb-0.5">마크다운 폴더 경로</label>
                <input
                  type="text"
                  value={postsDir}
                  onChange={(e) => setPostsDir(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] text-stone-500 block mb-0.5">배포 엔진</label>
                <select
                  value={deployPlatform}
                  onChange={(e) => setDeployPlatform(e.target.value as any)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[11px] font-semibold"
                >
                  <option value="firebase_hosting">Firebase Hosting (추천/글로벌 CDN)</option>
                  <option value="github_pages">GitHub Pages</option>
                  <option value="vercel">Vercel</option>
                  <option value="cloudflare">Cloudflare Pages</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-stone-500 block mb-0.5">Firebase 프로젝트 ID (선택)</label>
                <input
                  type="text"
                  placeholder="예: tokyo-noluga"
                  value={firebaseProjectId}
                  onChange={(e) => setFirebaseProjectId(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
            >
              <Check className="h-3.5 w-3.5 text-amber-300" />
              <span>웹사이트 등록 완료</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
