#!/usr/bin/env node
'use strict';

const args = process.argv.slice(2);
const command = args[0];
let messageIdx = 1;
let apiKeyIdx = args.findIndex(arg => arg.startsWith('--api-key=') || arg === '-k');
const apiKey = apiKeyIdx !== -1 ? (args[apiKeyIdx].split('=')[1] || args[apiKeyIdx + 1]) : process.env.MOLTBOOK_API_KEY;

if (!apiKey) {
  console.error('❌ Error: API key required (--api-key or MOLTBOOK_API_KEY)');
  console.log('Usage: node moltbook.js [post <message> | feed] [--api-key=stub]');
  process.exit(1);
}

console.log(`🔑 API Key: ${apiKey.slice(0, 8)}...`);

if (command === 'post') {
  const message = args.slice(1).join(' ').trim();
  if (!message) {
    console.error('❌ Error: Message required for post');
    process.exit(1);
  }
  console.log(`📤 POST stub: "${message}"`);
  console.log(JSON.stringify({
    success: true,
    id: `anon-${Date.now()}`,
    timestamp: new Date().toISOString()
  }, null, 2));
} else if (command === 'feed') {
  console.log('📥 FEED stub (Anon Trends Sample):');
  console.log(JSON.stringify([
    {
      id: 'anon-1',
      text: '🔥 Crypto Hype is back! #anon',
      likes: 42,
      timestamp: '2026-02-04T08:00:00Z'
    },
    {
      id: 'anon-2',
      text: '🤖 AI fears rising... privacy first!',
      likes: 37,
      timestamp: '2026-02-04T07:45:00Z'
    },
    {
      id: 'anon-3',
      text: '😂 Meme economy booming',
      likes: 29,
      timestamp: '2026-02-04T07:30:00Z'
    }
  ], null, 2));
} else if (command === '--help' || command === 'help') {
  console.log(`
Moltbook CLI Prototype (OpenClaw)

Commands:
  post <message>    Post anon message to feed
  feed              Fetch recent anon feed

Options:
  --api-key, -k     API key (stub: 'demo-stub')
  MOLTBOOK_API_KEY  Env var alternative

Examples:
  node moltbook.js feed --api-key=demo-stub
  node moltbook.js post \"Hello Anon World!\" --api-key=demo-stub
  `);
} else {
  console.log('❓ Unknown command. Run: node moltbook.js help');
  process.exit(1);
}
