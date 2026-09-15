import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  Users,
  Train,
  CreditCard,
  Plus,
  ExternalLink,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  Eye,
  Send,
  Star,
  Layers,
  Globe,
  Tag,
  Share2,
  Calendar,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DashboardQueueItem, JapanCategory, HotelRecommendation } from '../types';
import {
  DEFAULT_JAPAN_CATEGORIES,
  JAPAN_CITIES,
  TRAVEL_THEMES,
  HOTEL_COMPARISON_TYPES,
  DISCOUNT_CARDS_MATRIX,
  generateJapanSchemaJsonLd,
} from '../data/japanTaxonomy';

interface JapanSiteShowcaseProps {
  queueItems: DashboardQueueItem[];
  categories: JapanCategory[];
  onAddCategory: (cat: JapanCategory) => void;
  onSelectPost: (post: DashboardQueueItem) => void;
  onPublishToGithub?: (post: DashboardQueueItem) => void;
}

export const JapanSiteShowcase: React.FC<JapanSiteShowcaseProps> = ({
  queueItems,
  categories,
  onAddCategory,
  onSelectPost,
  onPublishToGithub,
}) => {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected post for viewing in the magazine / SEO inspector modal
  const [previewPost, setPreviewPost] = useState<DashboardQueueItem | null>(queueItems[0] || null);
  const [activeTab, setActiveTab] = useState<'preview' | 'seo' | 'hotel_matrix' | 'cards_passes'>('preview');

  // New Category Creation Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatSlug, setNewCatSlug] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [newCatMetaTitle, setNewCatMetaTitle] = useState<string>('');
  const [newCatMetaDesc, setNewCatMetaDesc] = useState<string>('');
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return queueItems.filter((item) => {
      // Category filter
      if (activeCategorySlug !== 'all') {
        const itemCat = item.japan_meta?.category_slug || '';
        if (itemCat !== activeCategorySlug) return false;
      }
      // City filter
      if (selectedCity !== 'all') {
        const itemCity = item.japan_meta?.city || '';
        const itemTopic = item.topic || '';
        if (!itemCity.includes(selectedCity) && !itemTopic.includes(selectedCity)) return false;
      }
      // Theme filter
      if (selectedTheme !== 'all') {
        const itemTheme = item.japan_meta?.travel_type || '';
        const itemTopic = item.topic || '';
        if (!itemTheme.includes(selectedTheme) && !itemTopic.includes(selectedTheme)) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.seo_metadata.title.toLowerCase().includes(q);
        const inTopic = item.topic.toLowerCase().includes(q);
        const inDesc = item.seo_metadata.meta_description.toLowerCase().includes(q);
        const inTags = item.seo_metadata.tags.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inTopic && !inDesc && !inTags) return false;
      }
      return true;
    });
  }, [queueItems, activeCategorySlug, selectedCity, selectedTheme, searchQuery]);

  // Handle create category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatSlug.trim()) return;

    const formattedSlug = newCatSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-');

    const created: JapanCategory = {
      id: 'cat-' + formattedSlug,
      name: newCatName.trim(),
      slug: formattedSlug,
      description: newCatDesc.trim() || `${newCatName} 관련 일본 여행 상세 큐레이션`,
      iconName: 'Compass',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      postCount: 0,
      meta_title: newCatMetaTitle.trim() || `${newCatName} 일본 여행 가이드 | japan.noluga.com`,
      meta_description: newCatMetaDesc.trim() || `${newCatName}의 최신 여행 코스, 호텔 비교 및 교통 안내`,
    };

    onAddCategory(created);
    setActiveCategorySlug(formattedSlug);
    setIsCategoryModalOpen(false);
    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
    setNewCatMetaTitle('');
    setNewCatMetaDesc('');
  };

  // Schema json for preview post
  const currentSchemaJson = useMemo(() => {
    if (!previewPost) return null;
    const url =
      previewPost.japan_meta?.target_url ||
      `https://japan.noluga.com/guide/${previewPost.japan_meta?.category_slug || 'guide'}-${previewPost.id}`;
    return generateJapanSchemaJsonLd({
      title: previewPost.seo_metadata.title,
      description: previewPost.seo_metadata.meta_description,
      url,
      datePublished: previewPost.created_at,
      keywords: previewPost.seo_metadata.tags,
      h1: previewPost.content.h1,
      cityName: previewPost.japan_meta?.city,
      categoryName: previewPost.japan_meta?.category_name,
    });
  }, [previewPost]);

  const copySchemaToClipboard = () => {
    if (!currentSchemaJson) return;
    navigator.clipboard.writeText(JSON.stringify(currentSchemaJson, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="space-y-6" id="japan-site-showcase-container">
      {/* Site Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 p-6 md:p-8 text-white shadow-xl border border-stone-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Live Target Domain
              </span>
              <span className="text-xs text-stone-400 font-mono">https://japan.noluga.com/</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>NOLUGA JAPAN</span>
              <span className="text-rose-400 text-lg md:text-xl font-normal">놀루가 재팬</span>
            </h1>
            <p className="text-sm text-stone-300 max-w-3xl leading-relaxed">
              도쿄·오사카·교토·후쿠오카·유후인 등 도시별·관광지별 초밀착 여행 가이드, 4대 숙소 유형(가성비 비즈니스 vs 온천 료칸 vs 레지던스 vs 호캉스) 실전 비교,
              동행자별(효도·데이트·가족·인원수) 맞춤 동선, 교통패스 및 트래블 할인카드 혜택이 100% 최적화되어 발행되는 일본 여행 전용 미디어 포털입니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-2 border border-rose-400/40"
              id="btn-create-category"
            >
              <Plus className="w-4 h-4" />
              카테고리 생성 및 관리
            </button>
            <a
              href="https://japan.noluga.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-600 transition-colors flex items-center gap-2"
              id="link-open-japan-noluga"
            >
              <ExternalLink className="w-4 h-4 text-stone-400" />
              japan.noluga.com 바로가기
            </a>
          </div>
        </div>

        {/* Dynamic Category Navigation Bar */}
        <div className="mt-8 pt-6 border-t border-stone-800 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setActiveCategorySlug('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategorySlug === 'all'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white'
            }`}
          >
            전체 카테고리 ({queueItems.length})
          </button>
          {categories.map((cat) => {
            const count = queueItems.filter((q) => q.japan_meta?.category_slug === cat.slug).length;
            const isActive = activeCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategorySlug(cat.slug)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm font-semibold'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-rose-800 text-white' : 'bg-stone-900 text-stone-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 border border-dashed border-rose-500/40 hover:bg-rose-500/10 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            새 카테고리
          </button>
        </div>
      </div>

      {/* Quick Filters: City & Travel Theme */}
      <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              도시별:
            </span>
            <button
              onClick={() => setSelectedCity('all')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedCity === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              전체 도시
            </button>
            {JAPAN_CITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCity(c.label)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  selectedCity === c.label ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="호텔, 교통패스, 데이트, 효도 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
          <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            여행 테마/동행자:
          </span>
          <button
            onClick={() => setSelectedTheme('all')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              selectedTheme === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            전체 테마
          </button>
          {TRAVEL_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTheme(t.name.split(' ')[0])}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedTheme === t.name.split(' ')[0]
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Showcase Layout: Left Posts Grid / Right Deep-Dive Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Posts List (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-600" />
              japan.noluga.com 최적화 포스트 목록 ({filteredPosts.length}개)
            </h2>
            <span className="text-[11px] text-stone-500">클릭하여 우측에서 디테일 검증</span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-stone-200 text-stone-500">
              <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-sm font-medium">선택한 조건에 일치하는 포스트가 없습니다.</p>
              <button
                onClick={() => {
                  setActiveCategorySlug('all');
                  setSelectedCity('all');
                  setSelectedTheme('all');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-rose-600 hover:underline font-semibold"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => {
                const isSelected = previewPost?.id === post.id;
                const city = post.japan_meta?.city || '일본';
                const catName = post.japan_meta?.category_name || '여행 가이드';
                const hasHotel = post.japan_meta?.has_hotel_comparison;

                return (
                  <div
                    key={post.id}
                    onClick={() => setPreviewPost(post)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                      isSelected
                        ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md bg-rose-50/20'
                        : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-100 text-stone-700">
                          {city}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-rose-100 text-rose-800">
                          {catName}
                        </span>
                        {hasHotel && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-amber-100 text-amber-800 flex items-center gap-0.5">
                            <Building2 className="w-2.5 h-2.5" />
                            호텔비교
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        SEO {post.seo_score || 98}점
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-stone-900 leading-snug line-clamp-2 hover:text-rose-600 transition-colors">
                      {post.seo_metadata.title}
                    </h3>
                    <p className="mt-1.5 text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                      {post.seo_metadata.meta_description}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-stone-400" />
                        {post.keyword_analysis.main_keyword}
                      </span>
                      <span className="flex items-center gap-1 text-rose-600 font-semibold group">
                        상세 검증
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Deep-Dive Preview, Hotel Matrix & SEO Inspector (7 cols on lg) */}
        <div className="lg:col-span-7">
          {previewPost ? (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-full">
              {/* Inspector Top Tabs */}
              <div className="bg-stone-50 border-b border-stone-200 p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeTab === 'preview'
                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-rose-500" />
                    매거진 라이브 뷰
                  </button>
                  <button
                    onClick={() => setActiveTab('seo')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeTab === 'seo'
                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    구글 검색 노출 (SEO & Schema)
                  </button>
                  <button
                    onClick={() => setActiveTab('hotel_matrix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeTab === 'hotel_matrix'
                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    호텔 종류별 비교
                  </button>
                  <button
                    onClick={() => setActiveTab('cards_passes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeTab === 'cards_passes'
                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    교통패스 & 할인카드
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {onPublishToGithub && (
                    <button
                      onClick={() => onPublishToGithub(previewPost)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3 text-rose-400" />
                      GitHub 배포
                    </button>
                  )}
                  <button
                    onClick={() => onSelectPost(previewPost)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    대기열 상세
                  </button>
                </div>
              </div>

              {/* Tab 1: Live Magazine Reader View */}
              {activeTab === 'preview' && (
                <div className="p-6 overflow-y-auto max-h-[720px] space-y-6">
                  {/* Article Meta Header */}
                  <div className="space-y-3 pb-5 border-b border-stone-200">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-full border border-rose-200">
                        {previewPost.japan_meta?.category_name || '일본 여행 가이드'}
                      </span>
                      <span className="text-stone-400">•</span>
                      <span className="text-stone-600 font-medium">{previewPost.japan_meta?.city || '일본 주요 도시'}</span>
                      {previewPost.japan_meta?.travel_type && (
                        <>
                          <span className="text-stone-400">•</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium text-[11px]">
                            {previewPost.japan_meta.travel_type} 맞춤
                          </span>
                        </>
                      )}
                      <span className="text-stone-400">•</span>
                      <span className="text-stone-500 font-mono text-[11px]">
                        URL: https://japan.noluga.com/guide/{previewPost.japan_meta?.category_slug || 'guide'}/
                      </span>
                    </div>

                    <h1 className="text-xl md:text-2xl font-black text-stone-900 leading-tight">
                      {previewPost.content.h1 || previewPost.seo_metadata.title}
                    </h1>

                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 leading-relaxed italic">
                      "{previewPost.seo_metadata.meta_description}"
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {previewPost.seo_metadata.tags.map((tag, idx) => (
                        <span key={idx} className="text-[11px] px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-md font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Body Content with formatted HTML */}
                  <div
                    className="prose prose-stone max-w-none text-xs leading-relaxed space-y-4 [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-stone-900 [&>h2]:pt-3 [&>h2]:border-t [&>h2]:border-stone-100 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-stone-800 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>table]:w-full [&>table]:border-collapse [&>table]:border [&>table]:border-stone-200 [&_th]:bg-stone-100 [&_th]:p-2 [&_th]:text-left [&_td]:p-2 [&_td]:border-b [&_td]:border-stone-200"
                    dangerouslySetInnerHTML={{
                      __html: previewPost.content.body.replace(
                        /<img src=['"]image_placeholder['"] alt=['"](.*?)['"]>/g,
                        `<div class="my-4 p-4 rounded-xl bg-gradient-to-br from-stone-100 to-rose-50/50 border border-stone-300 text-center text-stone-600">
                          <div class="inline-flex p-2.5 rounded-full bg-white shadow-sm mb-2 text-rose-500">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          </div>
                          <p class="text-xs font-bold text-stone-800">📸 권장 이미지 배치 위치</p>
                          <p class="text-[11px] text-stone-500 mt-0.5">Alt Tag: "$1"</p>
                        </div>`
                      ),
                    }}
                  />
                </div>
              )}

              {/* Tab 2: SEO Inspector & Schema.org JSON-LD */}
              {activeTab === 'seo' && (
                <div className="p-6 overflow-y-auto max-h-[720px] space-y-6">
                  {/* Google SERP Simulator */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-blue-600" />
                        구글 검색결과 스니펫 (Google SERP Live Preview)
                      </h3>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        최적화 완료
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-stone-300 shadow-sm space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] text-stone-600">
                        <div className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold">
                          N
                        </div>
                        <span>japan.noluga.com</span>
                        <span className="text-stone-400">›</span>
                        <span>{previewPost.japan_meta?.category_slug || 'guide'}</span>
                      </div>
                      <h4 className="text-sm md:text-base font-medium text-blue-800 hover:underline cursor-pointer leading-snug">
                        {previewPost.seo_metadata.title}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        <span className="text-stone-400 text-[11px] mr-1">2026. 9. 14. — </span>
                        {previewPost.seo_metadata.meta_description}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-700 font-semibold">
                        <div className="flex text-amber-500">
                          {'★'.repeat(5)}
                        </div>
                        <span>4.9 / 5.0 (리치 스니펫 평점 데이터 지원)</span>
                      </div>
                    </div>
                  </div>

                  {/* Social Share Card Preview */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-stone-600" />
                      소셜 공유 오픈그래프 (Kakao / Twitter / Facebook)
                    </h3>
                    <div className="rounded-xl border border-stone-200 overflow-hidden bg-stone-50 max-w-md">
                      <div className="h-32 bg-gradient-to-r from-rose-900 to-stone-900 flex items-center justify-center p-4 text-center">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-rose-300 font-bold">
                            NOLUGA JAPAN SPECIAL GUIDE
                          </span>
                          <p className="text-xs font-bold text-white mt-1 px-4 line-clamp-2">
                            {previewPost.seo_metadata.title}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 bg-white space-y-1">
                        <p className="text-[10px] uppercase text-stone-400 font-mono">japan.noluga.com</p>
                        <p className="text-xs font-bold text-stone-900 line-clamp-1">{previewPost.seo_metadata.title}</p>
                        <p className="text-[11px] text-stone-500 line-clamp-2">{previewPost.seo_metadata.meta_description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Schema.org Structured Data */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Schema.org JSON-LD 구조화 데이터 (구글 상위 노출용)
                      </h3>
                      <button
                        onClick={copySchemaToClipboard}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1"
                      >
                        {copiedSchema ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">복사됨!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-500" />
                            <span>JSON 복사</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3.5 rounded-xl bg-stone-900 text-stone-200 font-mono text-[11px] overflow-x-auto max-h-56 scrollbar-thin">
                      {JSON.stringify(currentSchemaJson, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab 3: Hotel Matrix Analysis */}
              {activeTab === 'hotel_matrix' && (
                <div className="p-6 overflow-y-auto max-h-[720px] space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      일본 숙소 4대 핵심 유형 비교 (비즈니스 vs 온천 료칸 vs 호캉스 vs 레지던스)
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      인원수, 예산, 여행 목적(효도/가족/데이트/가성비)에 따른 최적의 숙소 선정 기준
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {HOTEL_COMPARISON_TYPES.map((h, i) => (
                      <div key={i} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-stone-900">{h.type}</h4>
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            {h.price}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          <strong>특징:</strong> {h.features}
                        </p>
                        <div className="text-[11px] space-y-1">
                          <p className="text-emerald-800">
                            <strong>장점:</strong> {h.pros}
                          </p>
                          <p className="text-rose-800">
                            <strong>주의점:</strong> {h.cons}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-600">
                          <span className="font-semibold text-stone-800">추천 브랜드/체인: </span>
                          {h.recs.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Post Specific Hotels if defined */}
                  {previewPost.japan_meta?.hotels && previewPost.japan_meta.hotels.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-stone-200">
                      <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-rose-600" />
                        본 포스트 추천 호텔 상세 ({previewPost.japan_meta.hotels.length}개)
                      </h4>
                      <div className="space-y-3">
                        {previewPost.japan_meta.hotels.map((rec, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-bold text-stone-900">{rec.name}</h5>
                                {rec.japanese_name && (
                                  <p className="text-[10px] text-stone-400 font-mono">{rec.japanese_name}</p>
                                )}
                              </div>
                              <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                {rec.rating}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-stone-500">가격대:</span>{' '}
                                <span className="font-semibold text-stone-800">{rec.price_range}</span>
                              </div>
                              <div>
                                <span className="text-stone-500">위치:</span>{' '}
                                <span className="font-semibold text-stone-800">{rec.location}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-stone-700 bg-stone-50 p-2 rounded">
                              <strong>최적 추천:</strong> {rec.best_for}
                            </p>
                            {rec.booking_tip && (
                              <p className="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded">
                                <strong>예약 꿀팁:</strong> {rec.booking_tip}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Cards & Passes Matrix */}
              {activeTab === 'cards_passes' && (
                <div className="p-6 overflow-y-auto max-h-[720px] space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      2026 일본 여행 3대 할인카드 혜택 비교
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      환율 우대 100%, 현지 ATM 출금 수수료 0%, 편의점 캐시백 및 스이카 교통카드 연동
                    </p>
                  </div>

                  <div className="space-y-3">
                    {DISCOUNT_CARDS_MATRIX.map((c, i) => (
                      <div key={i} className="p-4 rounded-xl border border-stone-200 bg-white shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            {c.card}
                          </h4>
                          <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                            {c.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50 p-2.5 rounded-lg">
                          <div>
                            <span className="text-stone-500">환전 수수료:</span>{' '}
                            <span className="font-bold text-emerald-700">{c.fxFee}</span>
                          </div>
                          <div>
                            <span className="text-stone-500">ATM 제휴:</span>{' '}
                            <span className="font-semibold text-stone-800">{c.atms}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-stone-700 leading-relaxed">
                          <strong>핵심 혜택:</strong> {c.benefit}
                        </p>
                        <p className="text-[11px] text-stone-600">
                          <strong>추천 대상:</strong> {c.bestFor}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 text-stone-500">
              <Compass className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <p className="text-sm font-semibold">좌측에서 포스트를 선택하면 상세 뷰어가 열립니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Creation / Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">새 카테고리 생성 (japan.noluga.com)</h3>
                  <p className="text-xs text-stone-500">사이트 구조에 맞는 신규 카테고리와 SEO 메타를 설정합니다.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">카테고리 명칭 (국문) *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 규슈 렌터카 드라이브 코스, 디저트 카페 투어"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (!newCatSlug) {
                      setNewCatSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '-')
                          .replace(/-+/g, '-')
                      );
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  URL 슬러그 (영문 소문자/하이픈) *
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-stone-400 bg-stone-100 px-3 py-2 border border-r-0 border-stone-300 rounded-l-lg font-mono">
                    japan.noluga.com/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="kyushu-drive-guide"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-r-lg focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">카테고리 설명 (Description)</label>
                <textarea
                  rows={2}
                  placeholder="이 카테고리에서 다루는 주요 여행 주제와 대상 독자"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  검색엔진 최적화(SEO) 기본 태그 자동 세팅
                </span>
                <input
                  type="text"
                  placeholder="SEO 메타 타이틀 (비워둘 시 자동 생성)"
                  value={newCatMetaTitle}
                  onChange={(e) => setNewCatMetaTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="SEO 메타 디스크립션 (150자 내외 요약)"
                  value={newCatMetaDesc}
                  onChange={(e) => setNewCatMetaDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm"
                >
                  카테고리 생성 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
