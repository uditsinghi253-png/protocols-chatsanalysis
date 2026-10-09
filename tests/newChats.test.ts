import { describe, it, expect } from 'vitest';
import { sniffAndParseChat } from '../src/adapters/sniffer';
import { execSync } from 'child_process';
import fs from 'fs';

describe('New Chat Exports Benchmark', () => {
  it('parses CSE 6 and Maths CSE 6', () => {
    // 1. CSE 6 Cohort Test (local zip or bundled public asset)
    const cseZip = '/Users/uditsinghi/Downloads/WhatsApp Chat - Cse 6 🫂.zip';
    let cseRaw = '';
    if (fs.existsSync(cseZip)) {
      cseRaw = execSync(`unzip -p "${cseZip}" _chat.txt`, { maxBuffer: 20 * 1024 * 1024 }).toString('utf-8');
    } else if (fs.existsSync('public/data/cse6_chat.txt')) {
      cseRaw = fs.readFileSync('public/data/cse6_chat.txt', 'utf-8');
    }

    if (cseRaw) {
      const cseParsed = sniffAndParseChat(cseRaw);
      console.log('CSE 6 Messages:', cseParsed.messages.length, 'Format:', cseParsed.formatDetected, 'Participants:', cseParsed.participants.length);
      expect(cseParsed.messages.length).toBeGreaterThan(100);
    }

    // 2. Maths CSE 6 Group Test (local zip or bundled public asset)
    const mathsZip = '/Users/uditsinghi/Desktop/WhatsApp Chat - Maths CSE 6.zip';
    let mathsRaw = '';
    if (fs.existsSync(mathsZip)) {
      mathsRaw = execSync(`unzip -p "${mathsZip}" _chat.txt`, { maxBuffer: 20 * 1024 * 1024 }).toString('utf-8');
    } else if (fs.existsSync('public/data/maths_chat.txt')) {
      mathsRaw = fs.readFileSync('public/data/maths_chat.txt', 'utf-8');
    }

    if (mathsRaw) {
      const mathsParsed = sniffAndParseChat(mathsRaw);
      console.log('Maths CSE 6 Messages:', mathsParsed.messages.length, 'Format:', mathsParsed.formatDetected, 'Participants:', mathsParsed.participants.length);
      expect(mathsParsed.messages.length).toBeGreaterThan(10);
    }
  });
});
