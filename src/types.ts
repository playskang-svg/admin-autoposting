export type QueueStatus = 'ready' | 'queued' | 'scheduled' | 'published' | 'draft';
export type CompetitionLevel = '상' | '중' | '하';
export type SearchIntent = '정보성' | '상업성' | '탐색형' | '거래형';

export interface KeywordDetail {
  keyword: string;
  type: 'main' | 'sub' | 'long-tail';
  competition: CompetitionLevel;
  intent: SearchIntent | string;
}

export interface KeywordAnalysis {
  main_keyword: string;
  sub_keywords: string[];
  competition_level: CompetitionLevel;
  search_intent?: SearchIntent | string;
  keyword_details?: KeywordDetail[];
}

export interface SeoMetadata {
  title: string;
  meta_description: string;
  tags: string[];
}

export interface PostContent {
  h1: string;
  body: string;
}

/**
 * Strict JSON Queue format requested by the user:
 */
export interface SeoQueueItemPayload {
  queue_status: QueueStatus;
  keyword_analysis: KeywordAnalysis;
  seo_metadata: SeoMetadata;
  content: PostContent;
}

/**
 * Complete dashboard queue item with workflow metadata
 */
export interface GitHubDeploymentMeta {
  repo?: string;
  run_id?: number | string;
  run_url?: string;
  commit_sha?: string;
  commit_url?: string;
  dispatched_at?: string;
  completed_at?: string;
  status?: 'queued' | 'in_progress' | 'completed' | 'failed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'timed_out' | null;
  live_url?: string;
  workflow_name?: string;
  deploy_target?: 'github_pages' | 'cloudflare_hosting' | 'direct_commit';
  commit_file_path?: string;
  steps?: { name: string; status: 'completed' | 'in_progress' | 'queued' | 'failure'; conclusion?: string }[];
}

export interface CloudflareDeployConfig {
  project_id: string;
  site_id: string;
  custom_domain: string;
  is_configured: boolean;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  workflow_file: string; // e.g. deploy-cloudflare.yml or publish-post.yml
  branch: string; // default main
  posts_directory: string; // e.g. content/posts or posts
  deploy_url_template: string; // e.g. https://japan.noluga.com/guide/{slug}
  cloudflare_project_id?: string;
  cloudflare_site_id?: string;
  auto_poll: boolean;
  is_connected: boolean;
  deploy_mode?: 'cloudflare' | 'commit' | 'workflow' | 'cloudflare';
}

export interface JapanCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  badgeColor?: string;
  postCount?: number;
  meta_title?: string;
  meta_description?: string;
  parent_id?: string;
}

export interface HotelRecommendation {
  name: string;
  japanese_name?: string;
  category: '비즈니스' | '온천 료칸' | '럭셔리 호캉스' | '가족 레지던스' | string;
  price_range: string; // 예: 12만~18만원/박
  location: string; // 예: 오사카 난바역 도보 3분
  rating: number; // 4.8
  pros: string;
  cons: string;
  best_for: string; // 예: 부모님 효도여행, 가성비 나홀로 여행
  booking_tip?: string;
}

export interface JapanTravelMeta {
  city?: string; // 도쿄, 오사카, 교토, 후쿠오카, 삿포로 등
  sub_area?: string; // 난바, 신주쿠, 유후인 등
  travel_type?: '효도' | '데이트' | '가족' | '혼행' | '소그룹' | string;
  group_size?: '1인' | '2인' | '3~4인' | '5인 이상' | string;
  category_id: string;
  category_slug: string;
  category_name: string;
  has_hotel_comparison?: boolean;
  hotels?: HotelRecommendation[];
  transport_passes?: string[];
  discount_cards?: string[];
  target_url?: string; // https://japan.noluga.com/...
}

export interface DashboardQueueItem extends SeoQueueItemPayload {
  id: string;
  topic: string;
  created_at: string;
  scheduled_for?: string;
  published_at?: string;
  target_website_id?: string;
  target_domain?: string;
  target_audience?: string;
  tone?: string;
  seo_score?: number; // 0 - 100 calculated based on best practices
  github_deployment?: GitHubDeploymentMeta;
  japan_meta?: JapanTravelMeta;
  stats?: {
    char_count: number;
    word_count: number;
    image_count: number;
    h2_count: number;
    h3_count: number;
  };
  schedule_minutes?: number;
  auto_publish?: boolean;
}

export interface GenerationProgressStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  details?: string;
}

export interface GeneratePostRequest {
  topic: string;
  target_audience?: string;
  tone?: string;
  language?: string;
  additional_notes?: string;
  target_website_id?: string;
}

export interface TargetWebsite {
  id: string;
  name: string; // e.g. "놀루가 재팬"
  domain: string; // e.g. "japan.noluga.com"
  theme_label: string; // e.g. "일본 여행 포털"
  description: string;
  git_repo: string; // e.g. "noluga-org/japan-portal"
  branch: string;
  posts_directory: string; // e.g. "content/posts"
  deploy_platform: 'cloudflare_hosting' | 'github_pages' | 'vercel' | 'cloudflare' | 'tistory' | 'blogger' | string;
  cloudflare_project_id?: string;
  status: 'active' | 'standby' | 'configuring';
  created_at: string;
  total_posts?: number;
  live_url: string;
  last_deployed_at?: string;
  category?: string;
  platform?: string;
  statusText?: string;
}

export type PipelineStageId =
  | 'keyword_serp'
  | 'ai_content'
  | 'seo_schema'
  | 'queue_approval'
  | 'git_commit'
  | 'cicd_runner'
  | 'cloudflare_edge'
  | 'search_indexing';

export interface PipelineStageNode {
  id: PipelineStageId;
  step_number: number;
  name: string;
  subtitle: string;
  description: string;
  category: 'planning' | 'generation' | 'verification' | 'distribution';
  tech_stack: string[];
  input_data: string;
  output_data: string;
  active_count: number;
  status: 'healthy' | 'running' | 'completed' | 'standby';
  key_spec: string;
}

