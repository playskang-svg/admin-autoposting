import { DashboardQueueItem, SeoQueueItemPayload } from '../types';

export interface SeoAuditReport {
  score: number; // 0 - 100
  titleLength: number;
  titleStatus: 'good' | 'warning' | 'short';
  metaLength: number;
  metaStatus: 'good' | 'warning' | 'too_short' | 'too_long';
  h1Exists: boolean;
  h2Count: number;
  h3Count: number;
  imageCount: number;
  images: Array<{ src: string; alt: string }>;
  headings: Array<{ level: 'h2' | 'h3'; text: string }>;
  keywordInTitle: boolean;
  keywordInH1: boolean;
  keywordInMeta: boolean;
  checks: Array<{ label: string; passed: boolean; message: string }>;
}

export function extractImages(html: string): Array<{ src: string; alt: string }> {
  const images: Array<{ src: string; alt: string }> = [];
  const imgRegex = /<img\s+[^>]*src=['"]([^'"]*)['"][^>]*alt=['"]([^'"]*)['"][^>]*>|<img\s+[^>]*alt=['"]([^'"]*)['"][^>]*src=['"]([^'"]*)['"][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1] || match[4] || 'image_placeholder';
    const alt = match[2] || match[3] || '(대체 텍스트 없음)';
    images.push({ src, alt });
  }
  return images;
}

export function extractHeadings(html: string): Array<{ level: 'h2' | 'h3'; text: string }> {
  const headings: Array<{ level: 'h2' | 'h3'; text: string }> = [];
  const headingRegex = /<(h[23])[^>]*>(.*?)<\/\1>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: match[1].toLowerCase() as 'h2' | 'h3',
      text: match[2].replace(/<[^>]+>/g, '').trim(),
    });
  }
  return headings;
}

export function analyzeSeo(item: SeoQueueItemPayload): SeoAuditReport {
  const mainKeyword = (item.keyword_analysis?.main_keyword || '').toLowerCase();
  const title = item.seo_metadata?.title || '';
  const meta = item.seo_metadata?.meta_description || '';
  const h1 = item.content?.h1 || '';
  const body = item.content?.body || '';

  const titleLength = title.length;
  const metaLength = meta.length;

  const images = extractImages(body);
  const headings = extractHeadings(body);
  const h2Count = headings.filter((h) => h.level === 'h2').length;
  const h3Count = headings.filter((h) => h.level === 'h3').length;

  const keywordInTitle = mainKeyword ? title.toLowerCase().includes(mainKeyword) : false;
  const keywordInH1 = mainKeyword ? h1.toLowerCase().includes(mainKeyword) : false;
  const keywordInMeta = mainKeyword ? meta.toLowerCase().includes(mainKeyword) : false;

  const checks: Array<{ label: string; passed: boolean; message: string }> = [];

  // 1. Meta Title Check
  const isTitleGood = titleLength >= 25 && titleLength <= 65;
  checks.push({
    label: 'SEO 제목 길이 (25~65자)',
    passed: isTitleGood,
    message: isTitleGood
      ? `현재 ${titleLength}자로 검색 결과 노출에 최적화되어 있습니다.`
      : `현재 ${titleLength}자입니다. (권장: 25~65자)`,
  });

  // 2. Meta Description Check
  const isMetaGood = metaLength >= 110 && metaLength <= 170;
  checks.push({
    label: '메타 디스크립션 길이 (110~170자)',
    passed: isMetaGood,
    message: isMetaGood
      ? `현재 ${metaLength}자로 150자 내외 권장 기준을 만족합니다.`
      : `현재 ${metaLength}자입니다. (권장: 110~170자, 150자 내외)`,
  });

  // 3. Keyword Placement Check
  checks.push({
    label: '메인 키워드 제목/H1 포함',
    passed: keywordInTitle && keywordInH1,
    message:
      keywordInTitle && keywordInH1
        ? '메인 키워드가 제목과 H1 모두에 자연스럽게 배치되었습니다.'
        : '검색 엔진 가중치를 위해 제목 또는 H1에 메인 키워드를 보강하세요.',
  });

  // 4. Keyword in Meta
  checks.push({
    label: '메타 설명 내 키워드 포함',
    passed: keywordInMeta,
    message: keywordInMeta
      ? '메타 설명에 메인 키워드가 포함되어 클릭률 상승에 유리합니다.'
      : '메타 설명에 메인 키워드를 삽입하면 검색어 매칭 하이라이트가 적용됩니다.',
  });

  // 5. Headings Structure Check
  const isHeadingGood = h2Count >= 3;
  checks.push({
    label: 'H2 소제목 구조화 (3개 이상)',
    passed: isHeadingGood,
    message: isHeadingGood
      ? `H2 태그가 ${h2Count}개로 가독성 높은 구조를 갖추고 있습니다.`
      : `H2 태그가 ${h2Count}개입니다. 3개 이상의 소제목으로 구획화를 권장합니다.`,
  });

  // 6. Media Placement Check
  const isImageGood = images.length >= 2;
  checks.push({
    label: '미디어 배치 및 Alt 태그 (2개 이상)',
    passed: isImageGood,
    message: isImageGood
      ? `총 ${images.length}개의 이미지와 Alt 태그가 적절히 배치되었습니다.`
      : `이미지 배치가 ${images.length}개입니다. 독자 체류시간 증가를 위해 2개 이상 권장합니다.`,
  });

  // Calculate score
  let score = 50;
  if (isTitleGood) score += 10;
  if (isMetaGood) score += 10;
  if (keywordInTitle) score += 10;
  if (keywordInH1) score += 5;
  if (keywordInMeta) score += 5;
  if (isHeadingGood) score += 10;
  if (isImageGood) score += 10;
  score = Math.min(100, Math.max(0, score));

  return {
    score,
    titleLength,
    titleStatus: isTitleGood ? 'good' : titleLength < 25 ? 'short' : 'warning',
    metaLength,
    metaStatus: isMetaGood ? 'good' : metaLength < 110 ? 'too_short' : 'too_long',
    h1Exists: !!h1,
    h2Count,
    h3Count,
    imageCount: images.length,
    images,
    headings,
    keywordInTitle,
    keywordInH1,
    keywordInMeta,
    checks,
  };
}

/**
 * Filter out internal dashboard fields and return exactly the required JSON format
 */
export function formatToQueueJson(item: DashboardQueueItem | SeoQueueItemPayload): SeoQueueItemPayload {
  return {
    queue_status: item.queue_status || 'ready',
    keyword_analysis: {
      main_keyword: item.keyword_analysis?.main_keyword || '',
      sub_keywords: item.keyword_analysis?.sub_keywords || [],
      competition_level: item.keyword_analysis?.competition_level || '중',
    },
    seo_metadata: {
      title: item.seo_metadata?.title || '',
      meta_description: item.seo_metadata?.meta_description || '',
      tags: item.seo_metadata?.tags || [],
    },
    content: {
      h1: item.content?.h1 || '',
      body: item.content?.body || '',
    },
  };
}
