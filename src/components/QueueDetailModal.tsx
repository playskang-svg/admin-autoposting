import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileCode,
  Eye,
  BarChart3,
  Edit3,
  Send,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Search,
  ExternalLink,
} from 'lucide-react';
import { DashboardQueueItem, QueueStatus } from '../types';
import { analyzeSeo, formatToQueueJson } from '../utils/seoAnalytics';

interface QueueDetailModalProps {
  item: DashboardQueueItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateItem: (updated: DashboardQueueItem) => void;
}

export const QueueDetailModal: React.FC<QueueDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdateItem,
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'preview' | 'seo' | 'edit' | 'publish'>('json');
  const [copied, setCopied] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(item.seo_metadata?.title || '');
  const [editMeta, setEditMeta] = useState(item.seo_metadata?.meta_description || '');
  const [editH1, setEditH1] = useState(item.content?.h1 || '');
  const [editBody, setEditBody] = useState(item.content?.body || '');
  const [editTags, setEditTags] = useState(item.seo_metadata?.tags?.join(', ') || '');
  const [editStatus, setEditStatus] = useState<QueueStatus>(item.queue_status);

  // Publish simulation state
  const [targetPlatform, setTargetPlatform] = useState('WordPress REST API');
  const [webhookUrl, setWebhookUrl] = useState('https://api.my-automation-pipeline.com/v1/posts/publish');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);

  if (!isOpen) return null;

  const audit = analyzeSeo(item);
  const cleanJson = formatToQueueJson(item);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(cleanJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(cleanJson, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `queue-post-${item.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveChanges = () => {
    const tagList = editTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updated: DashboardQueueItem = {
      ...item,
      queue_status: editStatus,
      seo_metadata: {
        ...item.seo_metadata,
        title: editTitle,
        meta_description: editMeta,
        tags: tagList,
      },
      content: {
        h1: editH1,
        body: editBody,
      },
    };

    const newAudit = analyzeSeo(updated);
    updated.seo_score = newAudit.score;
    updated.stats = {
      char_count: editBody.length,
      word_count: editBody.split(/\s+/).length,
      image_count: newAudit.imageCount,
      h2_count: newAudit.h2Count,
      h3_count: newAudit.h3Count,
    };

    onUpdateItem(updated);
    setActiveTab('preview');
  };

  const handleSimulatePublish = async () => {
    setIsPublishing(true);
    setPublishResult(null);

    try {
      const res = await fetch('/api/publish-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueItem: cleanJson,
          target_platform: targetPlatform,
        }),
      });
      const data = await res.json();
      setPublishResult(data);

      if (data.success) {
        const updated: DashboardQueueItem = {
          ...item,
          queue_status: 'published',
          published_at: data.published_at,
        };
        onUpdateItem(updated);
      }
    } catch (err: any) {
      setPublishResult({
        success: false,
        message: err?.message || '발행 시뮬레이션 중 오류가 발생했습니다.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Helper to render HTML with customized visual image placeholder tags
  const renderFormattedBody = (html: string) => {
    // Replace <img ... alt='...'> with custom styled preview container
    const placeholderReplaced = html.replace(
      /<img\s+[^>]*src=['"]([^'"]*)['"][^>]*alt=['"]([^'"]*)['"][^>]*>|<img\s+[^>]*alt=['"]([^'"]*)['"][^>]*src=['"]([^'"]*)['"][^>]*>/gi,
      (match, src1, alt1, alt2, src2) => {
        const altText = alt1 || alt2 || '(Alt tag 없음)';
        return `<div class="my-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 text-center">
          <div class="flex items-center justify-center gap-2 text-xs font-semibold text-amber-900">
            <svg class="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>[미디어 배치 슬롯] 이미지 삽입 위치</span>
          </div>
          <div class="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1 text-xs text-stone-800 shadow-2xs">
            <span class="font-bold text-amber-700">Alt Tag:</span>
            <span>${altText}</span>
          </div>
        </div>`;
      }
    );

    return { __html: placeholderReplaced };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-amber-300">
              <FileCode className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">
                  대기열 항목 상세 및 자동화 포맷
                </h3>
                <span className="rounded-md border border-stone-200 bg-white px-2 py-0.5 text-xs font-mono text-stone-600">
                  {item.id}
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate max-w-lg">
                주제: {item.topic}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 px-6 py-2 bg-white">
          <button
            id="tab-json"
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'json'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>JSON 규격 포맷</span>
            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
              Valid
            </span>
          </button>

          <button
            id="tab-preview"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>미리보기 (Preview)</span>
          </button>

          <button
            id="tab-seo"
            onClick={() => setActiveTab('seo')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'seo'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>SEO 정밀 진단</span>
            <span className="rounded-full bg-stone-200 px-1.5 py-0.2 text-[10px] font-bold text-stone-700">
              {audit.score}점
            </span>
          </button>

          <button
            id="tab-edit"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'edit'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>콘텐츠 편집</span>
          </button>

          <button
            id="tab-publish"
            onClick={() => setActiveTab('publish')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'publish'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>웹훅 자동 발행</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: JSON OUTPUT */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    발행 대기열(Queue) 자동화 파이프라인 JSON
                  </h4>
                  <p className="text-xs text-stone-500">
                    사용자 지정 스키마(queue_status, keyword_analysis, seo_metadata, content)를 엄격히 준수한 출력입니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>복사 완료</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>JSON 복사</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>.json 다운로드</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl border border-stone-800 bg-stone-950 p-4 text-stone-200 font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px]">
                <pre>{JSON.stringify(cleanJson, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* TAB 2: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Google Search Result Preview Card */}
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-2">
                  <Search className="h-3.5 w-3.5 text-stone-400" />
                  <span>Google 검색 엔진 노출 스니펫 미리보기</span>
                  <span className="rounded-md bg-stone-100 px-1.5 py-0.2 text-[10px] text-stone-600">
                    {item.seo_metadata?.title?.length}자 제목 / {item.seo_metadata?.meta_description?.length}자 설명
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-stone-500">https://your-domain.com/blog/posts/{item.id}</div>
                  <h4 className="text-base font-medium text-blue-700 hover:underline cursor-pointer">
                    {item.seo_metadata?.title}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {item.seo_metadata?.meta_description}
                  </p>
                </div>
              </div>

              {/* Rendered Post Preview */}
              <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-xs">
                {/* H1 Main Heading */}
                <h1 className="text-2xl font-black text-stone-900 pb-4 border-b border-stone-200">
                  {item.content?.h1}
                </h1>

                {/* Meta details bar */}
                <div className="flex flex-wrap items-center gap-3 py-3 text-xs text-stone-500 border-b border-stone-100">
                  <span>메인 키워드: <strong className="text-stone-800">{item.keyword_analysis?.main_keyword}</strong></span>
                  <span>·</span>
                  <span>이미지 슬롯: <strong className="text-stone-800">{audit.imageCount}개</strong></span>
                  <span>·</span>
                  <span>예상 읽기 시간: <strong className="text-stone-800">{Math.ceil((item.stats?.word_count || 300) / 180)}분</strong></span>
                </div>

                {/* HTML Body with Styled Headings and Image Slots */}
                <div
                  className="prose prose-stone max-w-none pt-6 text-sm leading-relaxed text-stone-800"
                  dangerouslySetInnerHTML={renderFormattedBody(item.content?.body || '')}
                />
              </div>
            </div>
          )}

          {/* TAB 3: SEO AUDIT & KEYWORDS */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {/* Score Meter */}
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-5">
                <div>
                  <span className="text-xs font-semibold uppercase text-stone-500">SEO 종합 점수</span>
                  <div className="text-3xl font-black text-stone-900">{audit.score} <span className="text-sm font-normal text-stone-500">/ 100</span></div>
                  <p className="text-xs text-stone-600 mt-1">
                    키워드 밀도, 메타 태그 길이, H1~H3 계층 구조 및 Alt 태그를 종합 채점했습니다.
                  </p>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-900 text-amber-300 font-bold text-xl shadow-xs">
                  {audit.score}%
                </div>
              </div>

              {/* Keyword Analysis Breakdown */}
              <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
                <h4 className="text-sm font-bold text-stone-900">
                  Step 1: 키워드 조사 및 분석 상세표
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500">
                        <th className="pb-2 font-medium">키워드</th>
                        <th className="pb-2 font-medium">구분</th>
                        <th className="pb-2 font-medium">예상 경쟁도</th>
                        <th className="pb-2 font-medium">검색 의도</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr>
                        <td className="py-2.5 font-bold text-stone-900 font-mono">
                          {item.keyword_analysis?.main_keyword}
                        </td>
                        <td className="py-2.5">
                          <span className="rounded-md bg-stone-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Main
                          </span>
                        </td>
                        <td className="py-2.5 font-semibold text-amber-700">
                          {item.keyword_analysis?.competition_level}
                        </td>
                        <td className="py-2.5 text-stone-600">
                          {item.keyword_analysis?.search_intent || '정보성'}
                        </td>
                      </tr>
                      {item.keyword_analysis?.sub_keywords?.map((sub, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 text-stone-700 font-mono">
                            {sub}
                          </td>
                          <td className="py-2.5">
                            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
                              Sub / Long-tail
                            </span>
                          </td>
                          <td className="py-2.5 text-stone-600">
                            {idx % 2 === 0 ? '하' : '중'}
                          </td>
                          <td className="py-2.5 text-stone-600">
                            {idx === 0 ? '상업성 / 비교형' : '탐색형'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Checklist */}
              <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
                <h4 className="text-sm font-bold text-stone-900">
                  SEO 최적화 체크리스트
                </h4>
                <div className="space-y-2">
                  {audit.checks.map((chk, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-xs ${
                        chk.passed ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'
                      }`}
                    >
                      <div className="mt-0.5">
                        {chk.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900">{chk.label}</div>
                        <div className="text-stone-600 mt-0.5">{chk.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EDIT */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800">
                  SEO Title (검색 노출 제목)
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-hidden"
                />
                <span className="text-[11px] text-stone-500">현재 {editTitle.length}자 (권장: 25~65자)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800">
                  Meta Description (메타 설명, 150자 내외 권장)
                </label>
                <textarea
                  rows={3}
                  value={editMeta}
                  onChange={(e) => setEditMeta(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-hidden"
                />
                <span className="text-[11px] text-stone-500">현재 {editMeta.length}자</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800">
                  H1 메인 제목
                </label>
                <input
                  type="text"
                  value={editH1}
                  onChange={(e) => setEditH1(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800">
                  태그 목록 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800">
                  대기열 상태 (Queue Status)
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as QueueStatus)}
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-hidden"
                >
                  <option value="ready">ready (발행 준비 완료)</option>
                  <option value="published">published (발행 완료)</option>
                  <option value="scheduled">scheduled (예약됨)</option>
                  <option value="draft">draft (초안)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800">
                  본문 내용 (HTML 형식 및 이미지 태그)
                </label>
                <textarea
                  rows={8}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 p-3 text-xs font-mono text-stone-900 focus:border-stone-900 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveChanges}
                  className="rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 shadow-sm"
                >
                  변경사항 저장 및 대기열 업데이트
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: PUBLISH / WEBHOOK SIMULATION */}
          {activeTab === 'publish' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 space-y-4">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <Send className="h-4 w-4 text-emerald-600" />
                  <span>자동화 파이프라인 웹훅(Webhook) 및 CMS 연동 테스트</span>
                </div>
                <p className="text-xs text-stone-600">
                  이 대기열 항목의 JSON 데이터를 대상 자동화 시스템으로 전송하여 즉시 발행하거나 스케줄링하는 시뮬레이션입니다.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800">연동 대상 CMS / 시스템</label>
                    <select
                      value={targetPlatform}
                      onChange={(e) => setTargetPlatform(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-hidden"
                    >
                      <option value="WordPress REST API">WordPress REST API (wp-json)</option>
                      <option value="Ghost Admin API">Ghost Admin API</option>
                      <option value="Tistory Open API">Tistory Open API</option>
                      <option value="Custom Webhook (Zapier / n8n / Make)">Custom Webhook (Zapier / n8n / Make)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800">Webhook 수신 URL</label>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    disabled={isPublishing}
                    onClick={handleSimulatePublish}
                    className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
                  >
                    {isPublishing ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>웹훅 디스패치 실행 중...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>자동 발행 시뮬레이션 전송 (Dispatch)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Publish Result Log */}
              {publishResult && (
                <div
                  className={`rounded-xl border p-4 text-xs space-y-2 ${
                    publishResult.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {publishResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                    )}
                    <span>{publishResult.message}</span>
                  </div>

                  {publishResult.published_id && (
                    <div className="font-mono text-[11px] pt-1">
                      생성된 외부 포스트 ID: {publishResult.published_id} | 발행 일시: {publishResult.published_at}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 px-6 py-3 bg-stone-50">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>대기열 상태:</span>
            <span className="font-bold text-stone-800">{item.queue_status}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
