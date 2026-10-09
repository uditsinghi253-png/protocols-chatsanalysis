/**
 * Static Hardcode Audit Scanner
 * Enforces Prime Directive 1: Banned literals static scan.
 * Why: Guarantees zero hardcoding before claiming slice completion.
 */

import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');

// Banned patterns in production logic:
const BANNED_PATTERNS = [
  {
    name: 'Hardcoded urgency keyword list',
    regex: /\[\s*['"`](?:urgent|asap|deadline|emergency|important)['"`]\s*,/i,
  },
  {
    name: 'Hardcoded participant names (Alice/Bob)',
    regex: /\b(?:sender|author|user)\s*===\s*['"`](?:Alice|Bob|Charlie|Dave)['"`]/i,
  },
  {
    name: 'Hardcoded specific model name in logic',
    regex: /model:\s*['"`](?:llama|mistral|gpt-4|claude|qwen|gemma)[\w.-]*['"`]/i,
  },
  {
    name: 'Mock canned summary string',
    regex: /['"`]Here is a summary of the unread chat:['"`]/i,
  },
  {
    name: 'TODO fake data comments',
    regex: /\bTODO\s*:\s*(?:mock|fake|dummy|hardcode)\b/i,
  },
];

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function runHardcodeAudit() {
  console.log('🔍 Running Static Hardcode Audit on', SRC_DIR);
  const files = getAllFiles(SRC_DIR);
  let violationCount = 0;
  const violations = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);

    for (const pattern of BANNED_PATTERNS) {
      const match = content.match(pattern.regex);
      if (match) {
        violationCount++;
        const record = `❌ Violation in ${relativePath}: ${pattern.name} -> Found: "${match[0]}"`;
        violations.push(record);
        console.error(record);
      }
    }
  }

  if (violationCount === 0) {
    console.log(`✅ Hardcode Audit PASSED: 0 violations across ${files.length} source files.`);
    return true;
  } else {
    console.error(`🚨 Hardcode Audit FAILED: ${violationCount} violations found.`);
    return false;
  }
}

// Run directly if invoked from CLI
if (process.argv[1].endsWith('hardcode-audit.mjs')) {
  const success = runHardcodeAudit();
  process.exit(success ? 0 : 1);
}
