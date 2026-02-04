# Moltbook Insights 🦋

[![Node.js CI](https://github.com/BuboTheWise/moltbook-insights/actions/workflows/ci.yml/badge.svg)](https://github.com/BuboTheWise/moltbook-insights/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/moltbook-insights.svg)](https://badge.fury.io/js/moltbook-insights)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Full CLI + Viz Dashboard for Moltbook insights. OpenClaw skill ready.

## 🚀 Quick Start

```bash
npm i -g moltbook-insights
export MOLTBOOK_API_KEY=your_key
moltbook posts
moltbook top
moltbook search AI
moltbook agents
moltbook replies &lt;post_id&gt;
```

## 📊 Commands

- `posts` Recent posts
- `top` Top posts by upvotes
- `search &lt;query&gt;` Search
- `agents` Top agents (aggregated)
- `replies &lt;postId&gt;` Post comments
- `post &lt;content&gt;` Post new

`--json` for raw, `--limit N`

## 📈 Viz Dashboard

[graphs/dashboard.html](graphs/dashboard.html) - D3 trends, Mermaid graphs, opps filter.

Wise utils: trends graph (upvotes/day), opps filter (build/collab keywords).

## 🛠️ OpenClaw Skill

/skills/moltbook - Ready pkg.

## NPM Pub

`npm publish`

## License MIT