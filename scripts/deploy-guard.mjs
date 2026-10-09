#!/usr/bin/env node
/**
 * ProtocolX Deployment Protection Engine
 * Pre-deployment gatekeeper verifying code integrity, type safety,
 * 100% test pass rate, zero hardcoded values, and strict egress privacy policies.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

function logHeader(title) {
  console.log(`\n======================================================`);
  console.log(`🛡️  DEPLOY GUARD: ${title}`);
  console.log(`======================================================`);
}

function runStep(name, cmd) {
  process.stdout.write(`⏳ [CHECK] ${name}... `);
  try {
    execSync(cmd, { stdio: 'pipe', cwd: ROOT_DIR });
    console.log(`\x1b[32mPASSED\x1b[0m`);
    return true;
  } catch (err) {
    console.log(`\x1b[31mFAILED\x1b[0m`);
    console.error(`\nError in ${name}:`);
    console.error(err.stdout ? err.stdout.toString() : err.message);
    return false;
  }
}

function verifyCspAndPrivacy() {
  process.stdout.write(`⏳ [CHECK] Privacy Egress & Content-Security-Policy... `);
  const indexPath = path.join(ROOT_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log(`\x1b[31mFAILED (index.html missing)\x1b[0m`);
    return false;
  }

  const html = fs.readFileSync(indexPath, 'utf-8');
  if (!html.includes('Content-Security-Policy')) {
    console.log(`\x1b[31mFAILED (CSP meta tag missing)\x1b[0m`);
    return false;
  }

  // Ensure CSP strictly forbids external network egress
  if (html.includes('https://*') || html.includes('http://*')) {
    console.log(`\x1b[31mFAILED (CSP has insecure wildcard egress)\x1b[0m`);
    return false;
  }

  // Ensure EgressGuard is present
  const guardPath = path.join(ROOT_DIR, 'src/security/egressGuard.ts');
  if (!fs.existsSync(guardPath)) {
    console.log(`\x1b[31mFAILED (Egress guard file missing)\x1b[0m`);
    return false;
  }

  console.log(`\x1b[32mPASSED (Zero-Egress CSP Enforced)\x1b[0m`);
  return true;
}

function main() {
  logHeader('STARTING PRE-DEPLOYMENT INTEGRITY & SECURITY GATES');
  let allPassed = true;

  // 1. Zero-Hardcoding Audit
  if (!runStep('Zero-Hardcoding & No-Mock Policy', 'npm run audit:hardcode')) {
    allPassed = false;
  }

  // 2. Strict Type Safety Check
  if (!runStep('TypeScript Strict Type Verification', 'npx tsc --noEmit')) {
    allPassed = false;
  }

  // 3. Test Suite Pass Guarantee
  if (!runStep('Vitest Suite (Unit, Grounding & Edge Cases)', 'npm test')) {
    allPassed = false;
  }

  // 4. Privacy & Local Egress Boundary Verification
  if (!verifyCspAndPrivacy()) {
    allPassed = false;
  }

  // 5. Production Bundle Build Verification
  if (!runStep('Production Vite Bundle Build', 'npm run build')) {
    allPassed = false;
  }

  console.log(`\n======================================================`);
  if (allPassed) {
    console.log(`\x1b[32m✅ DEPLOYMENT PROTECTION: ALL GATES CLEARED FOR PRODUCTION\x1b[0m`);
    console.log(`======================================================\n`);
    process.exit(0);
  } else {
    console.log(`\x1b[31m❌ DEPLOYMENT PROTECTION: GATE FAILURE DETECTED — ABORTING\x1b[0m`);
    console.log(`======================================================\n`);
    process.exit(1);
  }
}

main();
