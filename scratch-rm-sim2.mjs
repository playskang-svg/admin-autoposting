import fs from 'fs';

const filePath = '/workspaces/admin-autoposting/src/components/GitHubActionsManager.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const btnStart = content.indexOf('<button\\n                onClick={() => handleDispatchWorkflow(true)}');

// Using regex to remove the button block
content = content.replace(/<button[\s\S]*?onClick=\{\(\) => handleDispatchWorkflow\(true\)\}[\s\S]*?<\/button>/, '');

fs.writeFileSync(filePath, content);
console.log("Deleted empty button wrapper");
