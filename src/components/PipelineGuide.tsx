import React, { useState } from 'react';
import {
  Terminal,
  Code2,
  Copy,
  Check,
  Zap,
  Globe,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export const PipelineGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copySnippet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const curlSnippet = `curl -X POST http://localhost:3000/api/generate-seo-post \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "2026 AI 기반 노코드 자동화 도구 추천",
    "target_audience": "1인 창업가 및 마케터",
    "tone": "전문적이고 신뢰감 있는 톤"
  }'`;

  const pythonSnippet = `import requests
import json

# 1. 포스팅 오토메이션 에이전트로부터 대기열 항목 생성 요청
url = "http://localhost:3000/api/generate-seo-post"
payload = {
    "topic": "2026 초보자를 위한 홈카페 에스프레소 머신 가이드",
    "target_audience": "홈카페 입문자",
    "tone": "친절하고 실용적인 가이드"
}

response = requests.post(url, json=payload)
data = response.json()

# 2. 규격화된 Queue 포맷 파싱
if data.get("queue_status") == "ready":
    kw_analysis = data["keyword_analysis"]
    seo_meta = data["seo_metadata"]
    content = data["content"]

    print(f"[*] 메인 키워드: {kw_analysis['main_keyword']}")
    print(f"[*] SEO 제목: {seo_meta['title']}")
    print(f"[*] 메타 설명: {seo_meta['meta_description']}")
    print(f"[*] 본문 길이: {len(content['body'])} chars")

    # 3. 자동 발행 시스템 (WordPress, Ghost, Webhook 등)으로 디스패치
    # dispatch_to_cms(seo_meta, content)
`;

  const nodeSnippet = `// Node.js Automated Posting Consumer
async function processSeoQueue() {
  const res = await fetch('http://localhost:3000/api/generate-seo-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: '미국 배당성장 ETF 투자 전략',
    }),
  });

  const postPayload = await res.json();

  if (postPayload.queue_status === 'ready') {
    const { keyword_analysis, seo_metadata, content } = postPayload;
    console.log('발행 준비 완료 포스트:', seo_metadata.title);
    // 자동화 발행 파이프라인 연동
  }
}
processSeoQueue();`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-stone-100">
            <Terminal className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              자동 발행 시스템(Queue Pipeline) 연동 가이드
            </h2>
            <p className="text-xs text-stone-600">
              이 SEO 콘텐츠 에이전트가 출력하는 JSON 포맷은 모든 자동화 스크립트(Python, Node.js, Zapier, n8n)와 100% 호환됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Flow */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-stone-900 mb-4">
          전체 자동화 아키텍처 흐름도
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-amber-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900">1. 사용자 주제 제시</h4>
            <p className="text-[11px] text-stone-600">
              작성할 테마 및 타깃 오디언스 지정
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-amber-300">
              <Zap className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900">2. SEO 에이전트 처리</h4>
            <p className="text-[11px] text-stone-600">
              키워드 분석 + H1~H3 본문 + 이미지 Alt 태그
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-amber-300">
              <Database className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900">3. Queue JSON 포맷팅</h4>
            <p className="text-[11px] text-stone-600">
              ready 상태와 엄격한 JSON 스키마 검증
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-900 text-white">
              <Globe className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900">4. GitHub & Firebase 배포</h4>
            <p className="text-[11px] text-stone-600">
              Contents API 커밋 → GitHub Actions → Firebase Hosting (japan.noluga.com) 무인 배포
            </p>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Python Snippet */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <Code2 className="h-4 w-4 text-emerald-600" />
              <span>Python 자동화 워커 (Worker) 스크립트</span>
            </div>
            <button
              onClick={() => copySnippet(pythonSnippet, 1)}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              {copiedIndex === 1 ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>코드 복사</span>
                </>
              )}
            </button>
          </div>
          <div className="rounded-xl bg-stone-950 p-3.5 text-stone-200 font-mono text-xs overflow-x-auto">
            <pre>{pythonSnippet}</pre>
          </div>
        </div>

        {/* Node.js / cURL Snippet */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <Terminal className="h-4 w-4 text-blue-600" />
              <span>cURL 터미널 직접 호출</span>
            </div>
            <button
              onClick={() => copySnippet(curlSnippet, 2)}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              {copiedIndex === 2 ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>cURL 복사</span>
                </>
              )}
            </button>
          </div>
          <div className="rounded-xl bg-stone-950 p-3.5 text-stone-200 font-mono text-xs overflow-x-auto">
            <pre>{curlSnippet}</pre>
          </div>

          <div className="border-t border-stone-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900">Node.js Fetch 예시</span>
              <button
                onClick={() => copySnippet(nodeSnippet, 3)}
                className="text-xs text-stone-500 hover:text-stone-900"
              >
                {copiedIndex === 3 ? '복사됨' : '복사'}
              </button>
            </div>
            <div className="rounded-xl bg-stone-950 p-3.5 text-stone-200 font-mono text-xs overflow-x-auto">
              <pre>{nodeSnippet}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
