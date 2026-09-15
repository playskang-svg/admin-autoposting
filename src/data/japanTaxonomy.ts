import { JapanCategory } from '../types';

export const DEFAULT_JAPAN_CATEGORIES: JapanCategory[] = [
  {
    id: 'cat-city-guide',
    name: '도시 & 관광지 가이드',
    slug: 'city-guide',
    description: '도쿄, 오사카, 교토, 후쿠오카, 삿포로 등 주요 도시와 숨은 소도시 명소 초밀착 가이드',
    iconName: 'MapPin',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    postCount: 12,
    meta_title: '일본 도시별 & 관광지 상세 여행 코스 가이드 | japan.noluga.com',
    meta_description: '도쿄 시부야부터 교토 아라시야마, 후쿠오카 텐진까지 현지인 추천 명소와 디테일한 여행 코스를 확인하세요.',
  },
  {
    id: 'cat-hotel-comparison',
    name: '호텔 & 숙소 비교 분석',
    slug: 'hotel-comparison',
    description: '역세권 가성비 비즈니스 호텔부터 전통 온천 료칸, 럭셔리 호캉스, 대가족 레지던스 철저 비교',
    iconName: 'Building2',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    postCount: 8,
    meta_title: '일본 호텔 종류별 추천 & 가격·위치 실전 비교 | japan.noluga.com',
    meta_description: '온천 료칸 가이세키 vs 가성비 역세권 비즈니스 호텔 vs 가족 맞춤 아파트 호텔의 1박 요금, 장단점 완벽 비교.',
  },
  {
    id: 'cat-travel-theme',
    name: '여행 테마 & 동행자별',
    slug: 'travel-theme',
    description: '부모님 효도여행, 연인 커플 감성 데이트, 영유아 동반 가족여행, 인원수별(1인 혼행~단체)',
    iconName: 'Users',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    postCount: 9,
    meta_title: '일본 여행 테마별 맞춤 코스: 효도·데이트·가족·인원수별 | japan.noluga.com',
    meta_description: '부모님 휠체어/엘리베이터 동선 배려부터 커플 야경 데이트, 아이 동반 키즈 프렌들리 일정까지 맞춤 설계.',
  },
  {
    id: 'cat-transport-pass',
    name: '교통수단 & 패스권',
    slug: 'transport-pass',
    description: '신칸센, 특급 하루카, 도쿄 지하철 72시간권, 간사이 패스, 렌터카 운전 팁 & 손익분기점 계산',
    iconName: 'Train',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    postCount: 7,
    meta_title: '일본 교통패스권 & 신칸센·지하철 손익분기점 총정리 | japan.noluga.com',
    meta_description: '하루카 특급열차, 도쿄 메트로 패스, 간사이 쓰루패스 사야 할까? 노선별 요금 비교와 본전 계산법.',
  },
  {
    id: 'cat-discount-cards',
    name: '할인카드 & 환전 결제',
    slug: 'discount-cards',
    description: '트래블로그 vs 트래블월렛 vs SOL트래블 수수료 0% 비교, 일본 현지 세븐뱅크 ATM 출금 꿀팁',
    iconName: 'CreditCard',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    postCount: 5,
    meta_title: '일본 여행 할인카드 혜택 비교 & 엔화 무료 환전 꿀팁 | japan.noluga.com',
    meta_description: '트래블로그와 트래블월렛 중 어떤 카드가 유리할까? 엔화 환전 수수료 우대 100%와 돈키호테 면세 할인 총정리.',
  },
  {
    id: 'cat-gourmet-spots',
    name: '미식 & 현지 맛집 핫플',
    slug: 'gourmet-spots',
    description: '타베로그 3.5점 이상 현지인 야키토리, 와규 오마카세, 라멘 격전지, 조용한 카페 골목',
    iconName: 'Utensils',
    badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
    postCount: 6,
    meta_title: '일본 현지인 인정 미식 & 타베로그 고득점 맛집 지도 | japan.noluga.com',
    meta_description: '관광객 줄 없는 숨은 로컬 맛집, 100% 예약 방법 및 웨이팅 없는 시간대 팁.',
  },
];

export const JAPAN_CITIES = [
  { id: 'tokyo', name: '도쿄 (Tokyo)', label: '도쿄', subAreas: ['신주쿠', '시부야', '긴자', '아사쿠사', '우에노', '롯폰기'] },
  { id: 'osaka', name: '오사카 (Osaka)', label: '오사카', subAreas: ['난바/도톤보리', '우메다', '신사이바시', '덴노지', '유니버설 시티'] },
  { id: 'kyoto', name: '교토 (Kyoto)', label: '교토', subAreas: ['가와라마치/기온', '아라시야마', '교토역', '후시미이나리'] },
  { id: 'fukuoka', name: '후쿠오카 (Fukuoka)', label: '후쿠오카', subAreas: ['하카타', '텐진', '나카스', '모모치해변'] },
  { id: 'yufuin', name: '유후인/벳푸 (Onsen)', label: '유후인/온천', subAreas: ['긴린코 호수', '유노쓰보 거리', '벳푸 지옥온천'] },
  { id: 'sapporo', name: '삿포로/홋카이도 (Hokkaido)', label: '삿포로', subAreas: ['오도리 공원', '스스키노', '오타루 운하', '비에이/후라노'] },
  { id: 'okinawa', name: '오키나와 (Okinawa)', label: '오키나와', subAreas: ['나하 국제거리', '아메리칸빌리지', '온나손', '츄라우미'] },
  { id: 'minor-cities', name: '소도시 (다카마쓰/마쓰야마)', label: '소도시', subAreas: ['다카마쓰 리쓰린공원', '마쓰야마 도고온천', '가나자와'] },
];

export const TRAVEL_THEMES = [
  { id: 'hyodo', name: '부모님 효도여행', icon: 'HeartHandshake', desc: '동선 최소화, 엘리베이터 접근성, 고급 가이세키 료칸' },
  { id: 'date', name: '연인 커플 데이트', icon: 'Heart', desc: '로맨틱 야경, 감성 부티크 호텔, 아기자기한 디저트 골목' },
  { id: 'family', name: '아이 동반 가족여행', icon: 'Baby', desc: '침대 가드, 키즈 어메니티, 테마파크, 온돌/다다미 객실' },
  { id: 'solo', name: '1인 혼자 여행(혼행)', icon: 'User', desc: '치안 좋은 캡슐/비즈니스 호텔, 1인 다이닝 맛집' },
  { id: 'group', name: '3~4인 친구/대가족', icon: 'Users2', desc: '주방 구비 아파트먼트, 렌터카 드라이브, 가성비 분할' },
];

export const HOTEL_COMPARISON_TYPES = [
  {
    type: '비즈니스 호텔',
    features: '역 도보 1~3분 초역세권, 깔끔한 콤팩트 룸, 코인 세탁기, 조식 뷔페',
    price: '1박 9만~16만 원',
    recs: ['도미인 (대욕장/무료 야식라멘)', '다이와 로이넷', '베셀 인', '소테츠 프레사 인'],
    pros: '탁월한 이동 동선과 가성비, 밤늦게 귀가해도 안전',
    cons: '객실 크기가 비교적 아담하여 캐리어 2개 펼치기 협소',
  },
  {
    type: '전통 온천 료칸',
    features: '객실 내 다다미방, 프라이빗 노천탕, 10품 이상 정통 가이세키 조/석식',
    price: '1박 35만~80만 원 (2인 식사 포함)',
    recs: ['유후인 바이엔', '교토 아라시야마 벤케이', '하코네 긴노사토'],
    pros: '궁극의 휴식과 온천 테라피, 부모님 효도여행 만족도 1위',
    cons: '도심에서 기차로 1~2시간 이동 필요, 사전 예약 필수',
  },
  {
    type: '럭셔리 5성급 호캉스',
    features: '고층 파노라마 시티뷰, 인피니티 풀/스파, 최고급 다이닝 라운지',
    price: '1박 45만~120만 원',
    recs: ['도쿄 콘래드', '안다즈 도쿄', '오사카 W 호텔', '포시즌스 교토'],
    pros: '기념일/프로포즈 데이트 최고, 넓은 룸과 극진한 서비스',
    cons: '높은 숙박 비용',
  },
  {
    type: '가족형 레지던스 & 아파트',
    features: '취사 가능한 풀 키친, 대형 냉장고, 드럼 세탁기, 다인실 침대 4~6개',
    price: '1박 20만~40만 원 (4~6인 기준)',
    recs: ['미마루 (MIMARU 포켓몬룸 등)', '레솔 트리니티', '스테이색스'],
    pros: '어린이/부모님 동반 시 식사 조리 용이, 1인당 숙박비 절약',
    cons: '호텔식 매일 턴다운 청소 서비스가 유료이거나 제한적',
  },
];

export const DISCOUNT_CARDS_MATRIX = [
  {
    card: '하나 트래블로그 (Travelog)',
    type: '체크카드 / 신용카드',
    fxFee: '무료 (100% 환율 우대)',
    atms: '세븐뱅크 ATM 출금 수수료 무료',
    benefit: '엔화 즉시 충전, 실물카드 현지 터치결제(컨택리스), 교통카드 Suica 충전 지원',
    bestFor: '일본 세븐일레븐이 많은 도심 여행자, 초보 여행자',
  },
  {
    card: '트래블월렛 (TravelWallet)',
    type: '외화 선불 충전형',
    fxFee: '무료 (100% 환율 우대)',
    atms: '이온(AEON) 은행 ATM 출금 수수료 무료',
    benefit: '남은 엔화 환불 수수료 없음, 다양한 글로벌 통화 지원',
    bestFor: '대형 쇼핑몰(이온몰) 이용자, 다국가 여행자',
  },
  {
    card: '신한 SOL트래블 체크카드',
    type: '신한은행 계좌 직결 체크카드',
    fxFee: '무료 (100% 환율 우대)',
    atms: '전 세계 해외 ATM 인출 수수료 무료',
    benefit: '더라운지 공항 라운지 무료 이용 (반기 1회), 일본 편의점(세븐/로손/패밀리) 5% 캐시백',
    bestFor: '공항 라운지 이용 및 편의점 쇼핑이 많은 여행자',
  },
];

/**
 * Automatically match or suggest a category for japan.noluga.com
 */
export function matchOrCreateCategory(
  title: string,
  topic: string,
  categories: JapanCategory[]
): { category: JapanCategory; isNew: boolean } {
  const combined = (title + ' ' + topic).toLowerCase();

  if (combined.includes('호텔') || combined.includes('숙소') || combined.includes('료칸') || combined.includes('리조트') || combined.includes('에어비앤비')) {
    const found = categories.find((c) => c.slug === 'hotel-comparison');
    if (found) return { category: found, isNew: false };
  }

  if (combined.includes('카드') || combined.includes('환전') || combined.includes('트래블') || combined.includes('할인') || combined.includes('세금') || combined.includes('엔화')) {
    const found = categories.find((c) => c.slug === 'discount-cards');
    if (found) return { category: found, isNew: false };
  }

  if (combined.includes('패스') || combined.includes('교통') || combined.includes('지하철') || combined.includes('신칸센') || combined.includes('하루카') || combined.includes('렌터카')) {
    const found = categories.find((c) => c.slug === 'transport-pass');
    if (found) return { category: found, isNew: false };
  }

  if (combined.includes('효도') || combined.includes('부모님') || combined.includes('데이트') || combined.includes('가족') || combined.includes('아이') || combined.includes('혼행')) {
    const found = categories.find((c) => c.slug === 'travel-theme');
    if (found) return { category: found, isNew: false };
  }

  if (combined.includes('맛집') || combined.includes('라멘') || combined.includes('와규') || combined.includes('스시') || combined.includes('이자카야')) {
    const found = categories.find((c) => c.slug === 'gourmet-spots');
    if (found) return { category: found, isNew: false };
  }

  const cityCat = categories.find((c) => c.slug === 'city-guide');
  if (cityCat) return { category: cityCat, isNew: false };

  // Generate new category if none matched
  const newSlug = 'japan-' + Date.now().toString(36);
  const newCat: JapanCategory = {
    id: 'cat-' + newSlug,
    name: '신규 테마 가이드',
    slug: newSlug,
    description: '자동 생성된 신규 테마 가이드 카테고리',
    iconName: 'FolderPlus',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
    postCount: 1,
    meta_title: `${title} - 신규 일본 여행 가이드 | japan.noluga.com`,
    meta_description: `${title} 관련 최신 일본 여행 정보와 상세 가이드`,
  };

  return { category: newCat, isNew: true };
}

/**
 * Generate Schema.org JSON-LD Structured Data for Google/Naver rich snippet SEO
 */
export function generateJapanSchemaJsonLd(post: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  keywords: string[];
  h1: string;
  cityName?: string;
  categoryName?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${post.url}#article`,
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://japan.noluga.com/#website',
          name: 'Noluga Japan (놀루가 재팬)',
          url: 'https://japan.noluga.com/',
        },
        headline: post.title,
        description: post.description,
        inLanguage: 'ko-KR',
        datePublished: post.datePublished,
        dateModified: post.datePublished,
        author: {
          '@type': 'Organization',
          name: 'Noluga Travel Lab',
          url: 'https://japan.noluga.com/about',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Noluga Japan',
          logo: {
            '@type': 'ImageObject',
            url: 'https://japan.noluga.com/logo.png',
          },
        },
        keywords: post.keywords.join(', '),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${post.url}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '홈',
            item: 'https://japan.noluga.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: post.categoryName || '일본 여행',
            item: `https://japan.noluga.com/category/${post.categoryName || 'guide'}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title,
            item: post.url,
          },
        ],
      },
      ...(post.cityName
        ? [
            {
              '@type': 'TouristDestination',
              name: post.cityName,
              description: `${post.cityName}의 상세 관광 명소, 호텔 비교 및 교통 안내`,
              url: post.url,
            },
          ]
        : []),
    ],
  };
}
