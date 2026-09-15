import fs from 'fs';

const filePath = '/workspaces/admin-autoposting/server.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace the frontmatter and Markdown generation with JSON generation for japantravelsite
const oldMarkdownGen = `  const frontmatter = \`---
title: "\${(postItem.seo_metadata?.title || postItem.topic || '').replace(/"/g, '\\\\"')}"
date: \${new Date().toISOString()}
draft: false
slug: "\${slug}"
category: "\${postItem.japan_meta?.category_slug || 'travel'}"
city: "\${postItem.japan_meta?.city || 'japan'}"
travel_type: "\${postItem.japan_meta?.travel_type || '자유여행'}"
tags: \${JSON.stringify(postItem.seo_metadata?.tags || ['일본여행', '놀루가'])}
meta_description: "\${(postItem.seo_metadata?.meta_description || '').replace(/"/g, '\\\\"')}"
target_url: "\${computedLiveUrl}"
---

# \${postItem.content?.h1 || postItem.topic}

\${postItem.content?.body || ''}
\`;`;

const newJsonGen = `  // Convert the generated content into japantravelsite JSON format
  const finalJson = {
    collection: "priority",
    order: 400,
    slug: slug,
    citySlug: postItem.japan_meta?.city || "osaka",
    category: postItem.japan_meta?.category_slug || "숙소 위치",
    eyebrow: postItem.japan_meta?.city ? \`\${postItem.japan_meta.city} · 추천\` : "추천 가이드",
    title: (postItem.seo_metadata?.title || postItem.topic || "").slice(0, 45),
    summary: (postItem.seo_metadata?.meta_description || "").slice(0, 150),
    targetKeyword: postItem.keyword_analysis?.main_keyword || postItem.topic,
    audience: postItem.target_audience || "일본 여행을 준비하는 여행자",
    publishedAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    answer: "자동화 봇이 생성한 가이드 요약입니다.",
    steps: [
      {
        title: postItem.content?.h1 || "핵심 가이드",
        body: postItem.content?.body || "내용이 여기에 들어갑니다."
      }
    ],
    checklist: ["여권 챙기기", "항목을 확인하세요"],
    comparison: {
      caption: "기본 비교",
      headers: ["구분", "특징"],
      rows: [["예시", "데이터"]]
    },
    sections: [],
    mistakes: ["잘못된 정보 확인하기"],
    faq: [],
    sources: []
  };
  
  const frontmatter = JSON.stringify(finalJson, null, 2);
  
  // Force the extension to be .json instead of .md
  const filePath = \`\${cleanDir}/\${slug}.json\`;
`;

// Replace `const filePath = \`\${cleanDir}/\${slug}.md\`;` and the old markdown gen block
// Actually, it's easier to just use string replace.
content = content.replace(/const filePath = `\$\{cleanDir\}\/\$\{slug\}\.md`;/, '');
content = content.replace(oldMarkdownGen, newJsonGen);

// Update system instructions to output better steps/body
const oldInstruction = "6. 타깃 사이트: https://japan.noluga.com/ 에 최적화된 URL 슬러그와 카테고리를 설정하세요.";
const newInstruction = "6. 타깃 사이트: https://japan.noluga.com/ 에 최적화된 URL 슬러그와 카테고리를 설정하세요. JSON의 content.body 안에 HTML을 쓸 때 단계별(steps) 구분을 명확히 하고 가독성 좋게 작성하세요.";
content = content.replace(oldInstruction, newInstruction);

fs.writeFileSync(filePath, content);
console.log("server.ts modified successfully.");
