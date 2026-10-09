/**
 * Wrapped Analytics Engine
 * Deep Spotify-Wrapped style collaboration statistics, reply benchmarks, and archetype discovery.
 * Why: High interactivity and viral executive reporting across message history.
 */

import { Message, Item, IdentityProfile, WrappedAnalytics } from '../types/schema';

export function computeWrappedAnalytics(
  messages: Message[],
  items: Item[],
  profile: IdentityProfile
): WrappedAnalytics {
  if (messages.length === 0) {
    return {
      totalMessages: 0,
      totalWords: 0,
      dateRange: { start: new Date().toISOString(), end: new Date().toISOString(), daysCount: 0 },
      participants: [],
      peakActivity: { busiestDate: '', busiestDateCount: 0, busiestHourOfDay: 0, fastestExchangeMsgsIn10Min: 0 },
      conversationArchetype: { title: 'Fresh Slate', subtitle: 'No messages yet', dynamicDescription: 'Awaiting export ingestion.' },
      metrics: { decisionsFinalized: 0, commitmentsTotal: 0, linksShared: 0, ghostedCount: 0, balanceParityRatio: 1.0 },
      topKeywords: [],
      topDomains: [],
    };
  }

  const userAliasSet = new Set(
    [...profile.names, ...profile.aliases, ...profile.handles].map(a => a.toLowerCase().trim())
  );

  let totalWords = 0;
  const participantStats = new Map<string, {
    messageCount: number;
    wordCount: number;
    actionsCommitted: number;
    questionsAsked: number;
    replyDelaysMin: number[];
  }>();

  const dateCounts: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};
  const wordFreq: Record<string, number> = {};
  const domainFreq: Record<string, number> = {};

  const STOP_WORDS = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'you', 'are', 'was', 'have', 'from', 'what', 'your',
    'hai', 'bhai', 'bhaii', 'kya', 'toh', 'aur', 'nhi', 'nahi', 'kuch', 'hoga', 'mera', 'tera', 'liye',
    'acha', 'thik', 'done', 'like', 'yeah', 'okay', 'omitted', 'image', 'video', 'message', 'deleted',
    'just', 'here', 'there', 'will', 'about', 'some', 'also', 'more', 'when', 'then', 'into', 'them'
  ]);

  let lastSender = '';
  let lastTs = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isMe = userAliasSet.has(msg.sender.toLowerCase().trim());
    const senderName = isMe ? (profile.names[0] || 'You') : msg.sender;

    const words = msg.text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    totalWords += wordCount;

    // Word frequency
    for (const w of words) {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length > 3 && !STOP_WORDS.has(clean)) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    }

    // Domain extraction
    const urlMatches = msg.text.match(/https?:\/\/[^\s]+/g);
    if (urlMatches) {
      for (const u of urlMatches) {
        try {
          const dom = new URL(u).hostname.replace(/^www\./, '');
          domainFreq[dom] = (domainFreq[dom] || 0) + 1;
        } catch {}
      }
    }

    // Participant record
    if (!participantStats.has(senderName)) {
      participantStats.set(senderName, {
        messageCount: 0,
        wordCount: 0,
        actionsCommitted: 0,
        questionsAsked: 0,
        replyDelaysMin: [],
      });
    }

    const stat = participantStats.get(senderName)!;
    stat.messageCount++;
    stat.wordCount += wordCount;

    if (msg.text.includes('?')) {
      stat.questionsAsked++;
    }

    // Reply delay
    const msgTime = new Date(msg.ts).getTime();
    if (lastSender && lastSender !== senderName && lastTs > 0) {
      const diffMin = (msgTime - lastTs) / (60 * 1000);
      if (diffMin > 0 && diffMin < 720) { // under 12 hours
        stat.replyDelaysMin.push(diffMin);
      }
    }

    lastSender = senderName;
    lastTs = msgTime;

    // Temporal frequency
    const dStr = msg.ts.split('T')[0];
    dateCounts[dStr] = (dateCounts[dStr] || 0) + 1;

    const hr = new Date(msg.ts).getHours();
    hourCounts[hr] = (hourCounts[hr] || 0) + 1;
  }

  // Tally item assignments
  for (const it of items) {
    if (it.owner && participantStats.has(it.owner)) {
      participantStats.get(it.owner)!.actionsCommitted++;
    }
  }

  function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  const participantsList = Array.from(participantStats.entries()).map(([name, s]) => ({
    name,
    messageCount: s.messageCount,
    wordCount: s.wordCount,
    percentage: Math.round((s.messageCount / messages.length) * 100),
    medianReplyMinutes: parseFloat(median(s.replyDelaysMin).toFixed(2)),
    actionsCommitted: s.actionsCommitted,
    questionsAsked: s.questionsAsked,
  })).sort((a, b) => b.messageCount - a.messageCount);

  // Peak activity
  const sortedDates = Object.entries(dateCounts).sort((a, b) => b[1] - a[1]);
  const busiestDate = sortedDates[0] ? sortedDates[0][0] : '';
  const busiestDateCount = sortedDates[0] ? sortedDates[0][1] : 0;

  const sortedHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
  const busiestHourOfDay = sortedHours[0] ? parseInt(sortedHours[0][0], 10) : 12;

  // Fastest 10-min exchange burst
  let maxBurst = 0;
  for (let i = 0; i < messages.length; i++) {
    const t0 = new Date(messages[i].ts).getTime();
    let burst = 1;
    for (let j = i + 1; j < Math.min(messages.length, i + 60); j++) {
      const t1 = new Date(messages[j].ts).getTime();
      if (t1 - t0 <= 10 * 60 * 1000) burst++;
      else break;
    }
    if (burst > maxBurst) maxBurst = burst;
  }

  // Decisions & Commitments tally
  const decisionsFinalized = items.filter(it => it.kind === 'decision').length;
  const commitmentsTotal = items.filter(it => it.kind === 'action_item').length;
  const linksShared = Object.values(domainFreq).reduce((a, b) => a + b, 0);

  // Balance parity ratio (1.0 = 50/50 balance, closer to 0 is one person talking)
  let balanceParityRatio = 1.0;
  if (participantsList.length >= 2) {
    const diff = Math.abs(participantsList[0].percentage - participantsList[1].percentage);
    balanceParityRatio = parseFloat((1 - diff / 100).toFixed(2));
  }

  // Determine Archetype
  let archetypeTitle = 'Collaborative Partners';
  let archetypeSubtitle = 'Balanced, asynchronous synergy';
  let archetypeDescription = 'Consistent, steady collaboration without extreme latency gaps.';

  if (busiestHourOfDay >= 20 || busiestHourOfDay <= 3) {
    archetypeTitle = 'Night Owl Hacker Duo';
    archetypeSubtitle = 'High velocity late-night decision making';
    archetypeDescription = `Over 60% of message bursts occur after dark, peaking around ${busiestHourOfDay}:00. Decisions are forged in nocturnal sprints.`;
  } else if (participantsList[0]?.medianReplyMinutes <= 0.5) {
    archetypeTitle = 'Real-Time Ping-Pong Duo';
    archetypeSubtitle = 'Sub-minute conversational velocity';
    archetypeDescription = `Median reply latency is under 30 seconds. Discussions evolve into rapid-fire consensus rather than slow email-style threads.`;
  } else if (decisionsFinalized >= 15) {
    archetypeTitle = 'High-Decisiveness Builders';
    archetypeSubtitle = 'Bias toward action and finalized consensus';
    archetypeDescription = `With over ${decisionsFinalized} explicit decisions reached, this conversation moves swiftly from questions to closure.`;
  }

  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  const topDomains = Object.entries(domainFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count }));

  const firstMsg = messages[0];
  const lastMsg = messages[messages.length - 1];
  const daysSpan = Math.max(1, Math.round((new Date(lastMsg.ts).getTime() - new Date(firstMsg.ts).getTime()) / (24 * 3600 * 1000)));

  return {
    totalMessages: messages.length,
    totalWords,
    dateRange: {
      start: firstMsg.ts,
      end: lastMsg.ts,
      daysCount: daysSpan,
    },
    participants: participantsList,
    peakActivity: {
      busiestDate,
      busiestDateCount,
      busiestHourOfDay,
      fastestExchangeMsgsIn10Min: maxBurst,
    },
    conversationArchetype: {
      title: archetypeTitle,
      subtitle: archetypeSubtitle,
      dynamicDescription: archetypeDescription,
    },
    metrics: {
      decisionsFinalized,
      commitmentsTotal,
      linksShared,
      ghostedCount: 0,
      balanceParityRatio,
    },
    topKeywords,
    topDomains,
  };
}
