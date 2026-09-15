import fs from 'fs';

const filePath = '/workspaces/admin-autoposting/src/components/GitHubActionsManager.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const simBtnStart = content.indexOf('<button\n                onClick={handleSimulation}');
if (simBtnStart !== -1) {
  const simBtnEnd = content.indexOf('</button>', simBtnStart) + 9;
  content = content.substring(0, simBtnStart) + content.substring(simBtnEnd);
  fs.writeFileSync(filePath, content);
  console.log("Removed Simulation Button");
} else {
  console.log("Not found 1");
  // Try another approach
  const altStart = content.indexOf('<button\\n                onClick={handleSimulation}');
  console.log(altStart);
}
