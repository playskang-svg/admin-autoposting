import fs from 'fs';

const filePath = '/workspaces/admin-autoposting/src/components/GitHubActionsManager.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const startMarker = '<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">';
const endMarker = '{/* Execution Buttons */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newSection = `
  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
    <h5 className="font-bold text-blue-900 mb-1">GitHub 저장소 직접 커밋 (자동 배포)</h5>
    <p className="text-sm text-blue-700">
      이 시스템은 타겟 저장소에 파일을 직접 생성(Commit)합니다.<br/>
      저장소마다 설정된 고유의 자동 배포 규칙(Cloudflare, Vercel 등)이 알아서 트리거됩니다.
    </p>
  </div>
  `;
  
  content = content.substring(0, startIndex) + newSection + '\n            ' + content.substring(endIndex);
  
  // Set default mode to commit
  content = content.replace(/useState<'cloudflare' \| 'commit' \| 'workflow'>\('.*?'\)/, "useState<'cloudflare' | 'commit' | 'workflow'>('commit')");
  
  // Remove "테스트 시뮬레이션 배포" button if it exists near Execution Buttons
  content = content.replace(/<button[^>]*onClick=\{handleSimulation\}[^>]*>[\s\S]*?<\/button>/, "");
  
  // Update main button text
  content = content.replace('GitHub 저장소에 마크다운 파일 커밋 & 자동 푸시', '저장소에 콘텐츠 주입 (자동 배포 트리거)');

  fs.writeFileSync(filePath, content);
  console.log("UI updated!");
} else {
  console.log("Failed to find markers.");
}
