import fs from 'fs';

const filePath = '/workspaces/admin-autoposting/src/components/GitHubActionsManager.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// I need to simplify the Deployment Method section.
// The UI has:
// <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
// ...
// </div>

// We can just find the "배포 방식" section and replace the 3 boxes with a single description.
const startMarker = '<h4 className="text-sm font-bold text-stone-700 mb-3">배포 방식</h4>';
const endMarker = '{/* Action Buttons */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newSection = `
  <h4 className="text-sm font-bold text-stone-700 mb-3">배포 방식</h4>
  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
    <h5 className="font-bold text-blue-900 mb-1">GitHub 저장소 직접 커밋 (CI/CD 자동 트리거)</h5>
    <p className="text-sm text-blue-700">
      이 대시보드는 타겟 저장소(예: japantravelsite, sunmool 등)에 JSON 또는 마크다운 파일을 직접 생성(Commit)합니다.<br/>
      커밋이 완료되면, 각 저장소에 설정된 자동 배포 규칙(Cloudflare, Vercel, Firebase 등)에 따라 알아서 라이브 배포가 진행됩니다.
    </p>
  </div>
  `;
  
  content = content.substring(0, startIndex) + newSection + '\n      ' + content.substring(endIndex);
  
  // Also force deployMode to 'commit' so the logic doesn't break
  content = content.replace(/const \[deployMode, setDeployMode\] = useState<'cloudflare' | 'commit' | 'workflow'>\('.*?'\);/, "const [deployMode, setDeployMode] = useState<'cloudflare' | 'commit' | 'workflow'>('commit');");

  // Remove the '테스트 시뮬레이션 배포' button to make it even cleaner
  const simBtnStart = content.indexOf('<button\n            onClick={handleSimulation}');
  if (simBtnStart !== -1) {
    const simBtnEnd = content.indexOf('</button>', simBtnStart) + 9;
    content = content.substring(0, simBtnStart) + content.substring(simBtnEnd);
  }
  
  // Update the deploy button text
  content = content.replace('GitHub 저장소에 마크다운 파일 커밋 & 자동 푸시', '저장소에 콘텐츠 주입 (자동 배포 시작)');

  fs.writeFileSync(filePath, content);
  console.log("UI simplified successfully.");
} else {
  console.log("Could not find markers.");
}
