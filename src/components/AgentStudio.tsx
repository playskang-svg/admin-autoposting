import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  FileText,
  Hash,
  Layers,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  Users,
  CreditCard,
  Train,
  Globe,
} from 'lucide-react';
import { DashboardQueueItem, SeoQueueItemPayload, JapanCategory, TargetWebsite } from '../types';
import { analyzeSeo, formatToQueueJson } from '../utils/seoAnalytics';
import { matchOrCreateCategory } from '../data/japanTaxonomy';

interface AgentStudioProps {
  onPostGenerated: (item: DashboardQueueItem) => void;
  onNavigateToQueue: (selectedId?: string) => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  japanCategories?: JapanCategory[];
  onAddCategory?: (cat: JapanCategory) => void;
  activeWebsite?: TargetWebsite;
  targetWebsites?: TargetWebsite[];
  onSelectWebsite?: (site: TargetWebsite) => void;
}

const JAPAN_PRESET_TOPICS = [
  {
    label: '오사카 호텔 4종 비교',
    topic: '오사카 난바·우메다 호텔 4종 완벽 비교: 역세권 가성비 vs 온천 대욕장 vs 가족 레지던스 vs 럭셔리 호캉스',
    badge: '호텔비교',
    city: '오사카',
    type: '가족/커플',
  },
  {
    label: '후쿠오카 3박4일 효도여행',
    topic: '부모님 모시고 떠나는 3박 4일 후쿠오카·유후인 효도여행: 걷기 편한 평지 동선과 료칸 가이세키 추천',
    badge: '효도여행',
    city: '후쿠오카',
    type: '효도',
  },
  {
    label: '일본 여행 할인카드 삼국지',
    topic: '2026 일본 여행 필수 할인카드 삼국지: 트래블로그 vs 트래블월렛 vs 신한 SOL트래블 실전 혜택 및 ATM 수수료 0% 완벽 비교',
    badge: '할인카드',
    city: '전국',
    type: '전체',
  },
  {
    label: '도쿄 2인 커플 데이트 코스',
    topic: '도쿄 2인 커플 로맨틱 감성 데이트 코스: 시부야 스카이 일몰 야경부터 나카메구로 히든 카페 & 감성 부티크 호텔',
    badge: '데이트',
    city: '도쿄',
    type: '데이트',
  },
  {
    label: '오사카·교토 교통패스 총정리',
    topic: '오사카·교토 3박 4일 필수 교통패스 총정리: 하루카 특급 + 지하철 무제한 + 한큐 투어리스트 패스 본전 계산기',
    badge: '교통패스',
    city: '간사이',
    type: '가족/친구',
  },
  {
    label: '삿포로 온천 힐링 & 맛집',
    topic: '겨울 삿포로·오타루 3박 4일 온천 힐링 여행 코스: 조잔케이 노천탕 료칸과 미소라멘 맛집 베스트',
    badge: '도시/온천',
    city: '삿포로',
    type: '힐링',
  },
];

export const AgentStudio: React.FC<AgentStudioProps> = ({
  onPostGenerated,
  onNavigateToQueue,
  isGenerating,
  setIsGenerating,
  japanCategories = [],
  onAddCategory,
  activeWebsite,
  targetWebsites = [],
  onSelectWebsite,
}) => {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('자유 여행자 및 라이프스타일 탐색객 (가족/커플/단독)');
  const [tone, setTone] = useState('현지 거주자처럼 신뢰감 있고 디테일한 실전 가이드 톤');
  const [language, setLanguage] = useState('한국어');
  const [additionalNotes, setAdditionalNotes] = useState(
    `https://${activeWebsite?.domain || 'japan.noluga.com'}/ 게재 목적, 구체적인 가격대, 실전 비교 및 요약표 포함`
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync notes when activeWebsite changes
  useEffect(() => {
    if (activeWebsite) {
      setAdditionalNotes(
        `https://${activeWebsite.domain}/ 게재 목적, 구체적인 가격대, 실전 비교 및 요약표 포함`
      );
    }
  }, [activeWebsite?.id]);

  // Workflow progress simulation during generation
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [latestGeneratedItem, setLatestGeneratedItem] = useState<DashboardQueueItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartAgent = async (selectedTopic?: string) => {
    const topicToUse = selectedTopic || topic;
    if (!topicToUse.trim()) {
      setErrorMessage('분석하고 작성할 주제를 입력해 주세요.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setCurrentStep(1);

    // Step 1 progress visual
    const stepTimer1 = setTimeout(() => {
      setCurrentStep(2);
    }, 1200);

    // Step 2 progress visual
    const stepTimer2 = setTimeout(() => {
      setCurrentStep(3);
    }, 2800);

    try {
      const response = await fetch('/api/generate-seo-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          target_audience: targetAudience,
          tone,
          language,
          additional_notes: additionalNotes,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `서버 응답 오류 (${response.status})`);
      }

      const rawResult: SeoQueueItemPayload = await response.json();

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setCurrentStep(3);

      const audit = analyzeSeo(rawResult);

      // Auto-match or create category for japan.noluga.com
      const { category, isNew } = matchOrCreateCategory(
        rawResult.seo_metadata?.title || topicToUse,
        topicToUse,
        japanCategories
      );

      if (isNew && onAddCategory) {
        onAddCategory(category);
      }

      // City detection helper
      let detectedCity = '일본';
      if (topicToUse.includes('도쿄')) detectedCity = '도쿄 (Tokyo)';
      else if (topicToUse.includes('오사카')) detectedCity = '오사카 (Osaka)';
      else if (topicToUse.includes('교토')) detectedCity = '교토 (Kyoto)';
      else if (topicToUse.includes('후쿠오카')) detectedCity = '후쿠오카 (Fukuoka)';
      else if (topicToUse.includes('삿포로') || topicToUse.includes('홋카이도')) detectedCity = '삿포로/홋카이도';
      else if (topicToUse.includes('유후인')) detectedCity = '유후인/벳푸';

      // Theme detection
      let detectedTheme = '자유여행';
      if (topicToUse.includes('효도') || topicToUse.includes('부모님')) detectedTheme = '효도';
      else if (topicToUse.includes('데이트') || topicToUse.includes('커플')) detectedTheme = '데이트';
      else if (topicToUse.includes('가족') || topicToUse.includes('아이')) detectedTheme = '가족';
      else if (topicToUse.includes('혼자') || topicToUse.includes('혼행')) detectedTheme = '혼행';

      const newItem: DashboardQueueItem = {
        ...rawResult,
        id: `post-${Date.now().toString().slice(-6)}`,
        target_website_id: activeWebsite?.id || 'japan-noluga',
        target_domain: activeWebsite?.domain || 'japan.noluga.com',
        topic: topicToUse,
        created_at: new Date().toISOString(),
        target_audience: targetAudience,
        tone,
        seo_score: audit.score || 97,
        japan_meta: {
          city: detectedCity,
          travel_type: detectedTheme,
          group_size: '2~4인',
          category_id: category.id,
          category_slug: category.slug,
          category_name: category.name,
          has_hotel_comparison: topicToUse.includes('호텔') || topicToUse.includes('숙소') || topicToUse.includes('료칸'),
          target_url: `https://${activeWebsite?.domain || 'japan.noluga.com'}/${(activeWebsite?.domain || '').includes('japan') ? 'guide' : 'posts'}/${category.slug}-${Date.now().toString(36)}`,
          transport_passes: ['지하철 패스', '특급열차'],
          discount_cards: ['트래블로그', '트래블월렛'],
        },
        stats: {
          char_count: rawResult.content?.body ? rawResult.content.body.length : 0,
          word_count: rawResult.content?.body ? rawResult.content.body.split(/\s+/).length : 0,
          image_count: audit.imageCount,
          h2_count: audit.h2Count,
          h3_count: audit.h3Count,
        },
      };

      setLatestGeneratedItem(newItem);
      onPostGenerated(newItem);
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err?.message || '콘텐츠 생성 도중 문제가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyJson = () => {
    if (!latestGeneratedItem) return;
    const cleanJson = formatToQueueJson(latestGeneratedItem);
    navigator.clipboard.writeText(JSON.stringify(cleanJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Main Form & Generation Area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column: Input Form & Settings */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
            {/* Target Website Indicator & Selector */}
            {targetWebsites.length > 0 && (
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 text-xs">
                <span className="text-stone-500 font-medium">대상 사이트:</span>
                <select
                  value={activeWebsite?.id}
                  onChange={(e) => {
                    const found = targetWebsites.find((w) => w.id === e.target.value);
                    if (found && onSelectWebsite) onSelectWebsite(found);
                  }}
                  className="font-mono font-bold text-xs text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 cursor-pointer max-w-[240px] truncate hover:border-stone-400 focus:outline-hidden"
                >
                  {targetWebsites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.domain})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="topic-input"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                주제 / 키워드
              </label>
              <div className="relative">
                <input
                  id="topic-input"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleStartAgent()}
                  placeholder="예: 오사카 난바역 호텔 비교, 도쿄 지하철 패스"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-hidden"
                />
                <Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-stone-400" />
              </div>
            </div>

            {/* Compact Preset Quick Topics */}
            <div>
              <div className="text-[11px] font-semibold text-stone-400 mb-1.5">빠른 주제 추천:</div>
              <div className="flex flex-wrap gap-1.5">
                {JAPAN_PRESET_TOPICS.map((preset, idx) => (
                  <button
                    key={idx}
                    id={`preset-btn-${idx}`}
                    type="button"
                    onClick={() => {
                      setTopic(preset.topic);
                      handleStartAgent(preset.topic);
                    }}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 hover:border-stone-300 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Advanced Parameters */}
            <div className="border-t border-stone-100 pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800"
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span>옵션 설정</span>
                {showAdvanced ? (
                  <ChevronUp className="h-3 w-3 text-stone-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-stone-400" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3 rounded-xl bg-stone-50 p-3 text-xs">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600">대상 독자</label>
                      <input
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="예: 2030 자유여행자"
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600">어조</label>
                      <input
                        type="text"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        placeholder="예: 친절하고 실용적인 정보 톤"
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              id="start-agent-btn"
              type="button"
              disabled={isGenerating}
              onClick={() => handleStartAgent()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>AI 글 작성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>AI 글 생성 및 대기열 등록</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Output & Queue JSON Payload Card */}
        <div className="space-y-6 lg:col-span-5">
          {latestGeneratedItem ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Queue Format Payload Ready
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    id="copy-payload-btn"
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>복사 완료</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>JSON 복사</span>
                      </>
                    )}
                  </button>
                  <button
                    id="view-in-queue-btn"
                    onClick={() => onNavigateToQueue(latestGeneratedItem.id)}
                    className="flex items-center gap-1 rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-stone-800"
                  >
                    <Layers className="h-3 w-3" />
                    <span>대기열에서 열기</span>
                  </button>
                </div>
              </div>

              {/* Keyword & Score Highlights */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-50 p-3 text-xs">
                <div>
                  <span className="text-stone-500">메인 키워드:</span>
                  <div className="font-bold text-stone-900 truncate">
                    {latestGeneratedItem.keyword_analysis?.main_keyword}
                  </div>
                </div>
                <div>
                  <span className="text-stone-500">예상 경쟁도:</span>
                  <div className="font-bold text-amber-700">
                    {latestGeneratedItem.keyword_analysis?.competition_level} (SEO 점수: {latestGeneratedItem.seo_score}점)
                  </div>
                </div>
              </div>

              {/* Strict JSON Output Container */}
              <div className="relative rounded-xl border border-stone-800 bg-stone-950 p-3.5 text-stone-200 font-mono text-[11px] overflow-x-auto max-h-[360px] leading-relaxed">
                <pre>{JSON.stringify(formatToQueueJson(latestGeneratedItem), null, 2)}</pre>
              </div>

              {/* Quick Summary of Content */}
              <div className="space-y-2 border-t border-stone-100 pt-3 text-xs text-stone-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-800">SEO 제목:</span>
                  <span className="text-[11px] text-stone-500">
                    {latestGeneratedItem.seo_metadata?.title?.length}자
                  </span>
                </div>
                <p className="line-clamp-2 text-stone-700 font-medium bg-stone-50 p-2 rounded-lg">
                  {latestGeneratedItem.seo_metadata?.title}
                </p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {latestGeneratedItem.seo_metadata?.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-10 text-center text-stone-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-stone-900">
                대기열 출력 대기 중
              </h4>
              <p className="mt-1 text-xs text-stone-500 max-w-xs">
                주제를 입력하고 실행 버튼을 누르면 실시간으로 분석된 결과가 자동화 규격 JSON 형식으로 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
