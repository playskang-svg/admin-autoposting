import fs from 'fs';

const filePath = '/workspaces/admin-autoposting/server.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// I need to find the place where I injected the JSON format.
// In scratch.mjs, I injected `const finalJson = { ... }` and `const frontmatter = JSON.stringify(finalJson, null, 2);`
// And `const filePath = \`\${cleanDir}/\${slug}.json\`;`

// I'll replace it with a conditional based on `repo`

const oldJsonGen = `  // Convert the generated content into japantravelsite JSON format
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

const newConditionalGen = `
  let frontmatter = "";
  let filePath = "";

  if (repo === 'japantravelsite') {
    // japantravelsite requires strict JSON format
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
      checklist: ["핵심 항목을 확인하세요"],
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
    frontmatter = JSON.stringify(finalJson, null, 2);
    filePath = \`\${cleanDir}/\${slug}.json\`;
  } else {
    // Default Markdown with Frontmatter for other sites
    frontmatter = \`---
title: "\${(postItem.seo_metadata?.title || postItem.topic || '').replace(/"/g, '\\\\"')}"
date: \${new Date().toISOString()}
draft: false
slug: "\${slug}"
category: "\${postItem.japan_meta?.category_slug || 'travel'}"
tags: \${JSON.stringify(postItem.seo_metadata?.tags || ['general'])}
meta_description: "\${(postItem.seo_metadata?.meta_description || '').replace(/"/g, '\\\\"')}"
target_url: "\${computedLiveUrl}"
---

# \${postItem.content?.h1 || postItem.topic}

\${postItem.content?.body || ''}
\`;
    filePath = \`\${cleanDir}/\${slug}.md\`;
  }
`;

content = content.replace(oldJsonGen, newConditionalGen);
fs.writeFileSync(filePath, content);
console.log("Applied conditional branch for multi-site.");
