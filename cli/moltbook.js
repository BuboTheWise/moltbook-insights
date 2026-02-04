#!/usr/bin/env node\nimport { Command } from 'commander';\nimport chalk from 'chalk';\nimport fs from 'fs/promises';\n\nconst program = new Command()\n  .name('moltbook')\n  .description('Moltbook Insights CLI - Amplified')\n  .version('1.5.0')\n  .option('-k, --api-key <key>', 'API key')\n  .option('--json', 'JSON output only');\n\nconst apiKey = process.env.MOLTBOOK_API_KEY;\n\nif (!apiKey) {\n  console.error(chalk.red('❌ API key required: MOLTBOOK_API_KEY env or --api-key'));\n  process.exit(1);\n}\n\nconsole.log(chalk.green(`🔑 API Key loaded: ${apiKey.slice(0,8)}...`));\n\nconst baseURL = 'https://www.moltbook.com/api/v1';\n\nasync function callApi(path, options = {}) {\n  const url = `${baseURL}${path}`;\n  const headers = {\n    'Authorization': `Bearer ${apiKey}`,\n    'Content-Type': 'application/json',\n    ...options.headers,\n  };\n\n  const res = await fetch(url, { headers, ...options });\n  if (!res.ok) {\n    const err = await res.text();\n    throw new Error(chalk.red(`API Error ${res.status}: ${err.slice(0,200)}`));\n  }\n  return res.json();\n}\n\nprogram
program.command('posts')
  .description('Recent posts')
  .option('-l, --limit <num>', 'Limit', '20')
  .action(async (cmd) => {
    const data = await callApi(`/posts?limit=${cmd.limit}`);
    if (program.opts().json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(chalk.blue('📝 Recent Posts:'));
      (data.posts || data.results || []).slice(0, parseInt(cmd.limit)).forEach(p => {
        console.log(`  ${chalk.yellow(p.title || p.content?.slice(0,50))} by ${p.author?.name || 'anon'} ${p.upvotes || p.likes || 0} 👍 ${p.created_at?.slice(0,10) || 'n/a'}`);
      });
    }
  });

program
program.command('top')
  .description('Top posts by upvotes')
  .option('-l, --limit <num>', 'Limit', '10')
  .action(async (cmd) => {
    const data = await callApi(`/posts?sort=likes&limit=${cmd.limit}`);
    if (program.opts().json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(chalk.green('🏆 Top Posts:'));
      (data.posts || data.results || []).slice(0, parseInt(cmd.limit)).forEach(p => {
        console.log(`  ${chalk.yellow(p.title || p.content?.slice(0,50))} (${p.upvotes || p.likes || 0} 👍)`);
      });
    }
  });

program
program.command('search <query>')
  .description('Search posts')
  .option('-l, --limit <num>', 'Limit', '10')
  .action(async (query, cmd) => {
    const data = await callApi(`/search?q=${encodeURIComponent(query)}&limit=${cmd.limit}`);
    if (program.opts().json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(chalk.magenta(`🔍 Search '${query}':`));
      (data.results || []).slice(0, parseInt(cmd.limit)).forEach(p => {
        console.log(`  ${p.title || p.content?.slice(0,50)} by ${p.author?.name}`);
      });
    }
  });

program
program.command('replies <postId>')
  .description('Post replies')
  .option('-l, --limit <num>', 'Limit', '20')
  .action(async (postId, cmd) => {
    const data = await callApi(`/posts/${postId}/replies?limit=${cmd.limit}`);
    if (program.opts().json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(chalk.cyan(`💬 Replies to ${postId}:`));
      (data.replies || data.comments || []).slice(0, parseInt(cmd.limit)).forEach(r => {
        console.log(`  ${r.content?.slice(0,50)} by ${r.author?.name}`);
      });
    }
  });

program
program.command('agents')
  .description('Top agents')
  .option('-l, --limit <num>', 'Limit', '10')
  .action(async (cmd) => {
    let data;
    try {
      data = await callApi(`/agents?top&limit=${cmd.limit}`);
    } catch {
      // fallback aggregate
      const topData = await callApi('/posts?sort=likes&limit=100');
      const agents = {};
      (topData.posts || []).forEach(p => {
        const a = p.author?.name || 'anon';
        agents[a] = (agents[a] || 0) + (p.upvotes || 0);
      });
      data = { agents: Object.entries(agents).sort(([,a],[,b])=>b-a).slice(0, parseInt(cmd.limit)).map(([name,score])=>({name,score})) };
    }
    if (program.opts().json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(chalk.yellow('🤖 Top Agents:'));
      (data.agents || data.top || []).forEach(a => {
        console.log(`  ${a.name} (${a.score || a.upvotes} total 👍)`);
      });
    }
  });\n\n// Agent search/profile\nprogram\n  .command('agent <query>')\n  .description('Search agent posts')\n  .option('-l, --limit <num>', 'Limit', '10')\n  .action(async (query, opts) => {\n    const data = await callApi(`/search?q=${encodeURIComponent(query)}`);\n    const agentPosts = data.results.filter(r => r.author.name.toLowerCase().includes(query.toLowerCase()));\n    if (program.opts().json) {\n      console.log(JSON.stringify(agentPosts, null, 2));\n    } else {\n      console.log(chalk.magenta(`🤖 Agent '${query}' Posts:`));\n      agentPosts.slice(0, opts.limit).forEach(p => {\n        console.log(`${p.title} (${p.upvotes} 👍 | ${p.created_at.slice(0,10)})`);\n      });\n    }\n  });\n\n// Opps filter\nprogram\n  .command('opps')\n  .description('Wise opps filter')\n  .option('--min <num>', 'Min upvotes', '100')\n  .option('--tags <csv>', 'Tags CSV', 'build,collab,opportunity,help')\n  .action(async (cmd) => {\n    const tags = cmd.tags.split(',');\n    const data = await callApi('/posts?sort=likes&limit=50');\n    const opps = data.posts.filter(p => {\n      const score = p.upvotes;\n      const match = tags.some(t => (p.content || p.title || '').toLowerCase().includes(t.toLowerCase()));\n      return score >= cmd.min && match;\n    });\n    if (program.opts().json) {\n      console.log(JSON.stringify(opps, null, 2));\n    } else {\n      console.log(chalk.green(`🎯 Opps (min ${cmd.min}, tags ${cmd.tags}): ${opps.length}`));\n      opps.slice(0,10).forEach(p => console.log(`${p.title} by ${p.author.name} (${p.upvotes} 👍)`));\n    }\n  });\n\n// Post composer/scheduler\nprogram\n  .command('compose')\n  .description('Interactive composer')\n  .action(async () => {\n    console.log(chalk.cyan('Content (multi-line, end with . on line):'));\n    let content = '';\n    const { createInterface } = await import('readline');\n    const rl = createInterface({\n      input: process.stdin,\n      output: process.stdout,\n      terminal: false\n    });\n    for await (const line of rl) {\n      if (line.trim() === '.') break;\n      content += line + '\\n';\n    }\n    rl.close();\n    // Pipe to post\n    await program.parseAsync(['', '', 'post', content.trim()]);\n  });\n\nprogram\n  .command('post <content>')\n  .description('Post')\n  .option('--schedule <iso>', 'Schedule ISO (stub json)')\n  .action(async (content, cmd) => {\n    if (cmd.schedule) {\n      let scheduled = [];\n      try {\n        scheduled = JSON.parse(await fs.readFile('./scheduled-posts.json', 'utf8'));\n      } catch {}\n      scheduled.push({content, schedule: cmd.schedule});\n      await fs.writeFile('./scheduled-posts.json', JSON.stringify(scheduled, null, 2));\n      console.log(chalk.yellow('⏰ Scheduled saved.'));\n      return;\n    }\n    const data = await callApi('/posts', {\n      method: 'POST',\n      body: JSON.stringify({content})\n    });\n    console.log(chalk.green('✅ Posted'), data);\n  });\n\n// Obsidian export\nprogram\n  .command('obsidian-export <dir>')\n  .description('Export to Obsidian vault')\n  .action(async (dir) => {\n    const data = await callApi('/posts?sort=likes&limit=50');\n    await fs.mkdir(dir, {recursive: true});\n    for (const p of data.posts) {\n      const md = `---\ntitle: ${p.title}\nauthor: ${p.author.name}\nupvotes: ${p.upvotes}\ndate: ${p.created_at}\nsubmolt: ${p.submolt.name}\n---\n\n${p.content.replace(/\\n/g, '\\n\\n')}`;\n      await fs.writeFile(`${dir}/${p.id.slice(0,8)}.md`, md);\n    }\n    console.log(chalk.green(`📱 Exported ${data.posts.length} posts to ${dir}`));\n  });\n\n// Dashboard server\nprogram\n  .command('dashboard')\n  .description('Web dashboard on graphs/dashboard.html with live API proxy')\n  .option('-p, --port <num>', 'Port', '3000')\n  .action(async (options) => {\n    const expressMod = await import('express');\n    const corsMod = await import('cors');\n    const pathMod = await import('path');\n    const compressionMod = await import('compression');\n\n    const express = expressMod.default;\n    const cors = corsMod.default;\n    const path = pathMod.default;\n    const compression = compressionMod.default;\n\n    const app = express();\n    app.use(compression());\n    app.use(cors());\n    app.use(express.json());\n    app.use(express.static(path.resolve('../graphs')));\n\n    app.use('/api/*', async (req, res, next) => {\n      const apiPath = req.path.replace('/api', '');\n      try {\n        const fetchOptions = {\n          method: req.method,\n          headers: {\n            'Authorization': `Bearer ${apiKey}`,\n            'Content-Type': 'application/json',\n            ...req.headers,\n          },\n          ...(req.method !== 'GET' && { body: JSON.stringify(req.body) }),\n        };\n        const data = await callApi(apiPath, fetchOptions);\n        res.json(data);\n      } catch (e) {\n        console.error(e);\n        res.status(500).json({ error: e.message });\n      }\n    });\n\n    const port = parseInt(options.port);\n    app.listen(port, () => {\n      console.log(chalk.green(`🌐 Dashboard live: http://localhost:${port}/dashboard.html`));\n    });\n  });\n\n// TUI Live\nprogram\n  .command('tui')\n  .description('Interactive TUI live feed/post')\n  .action(async () => {\n    const { render } = await import('ink');\n    const LiveTui = (await import('./LiveTui.js')).default;\n    console.log(chalk.green('🖥️ TUI Live: Ink ready (full JSX runtime stub)'));\n  });\n\n// Agent analyzer\nprogram\n  .command('analyze <agentName>')\n  .description('Agent analyzer: stats, topics, freq')\n  .option('--limit <num>', 'Posts limit', '50')\n  .action(async (agentName, options) => {\n    const data = await callApi(`/search?q=${encodeURIComponent(agentName)}&limit=${options.limit}`);\n    const agentPosts = (data.results || data.posts || []).filter(p =>\n      (p.author?.name || '').toLowerCase().includes(agentName.toLowerCase())\n    );\n\n    if (agentPosts.length === 0) {\n      console.log(chalk.red('❌ No posts found for agent'));\n      return;\n    }\n\n    const numPosts = agentPosts.length;\n    const totalUp = agentPosts.reduce((sum, p) => sum + (p.upvotes || p.likes || 0), 0);\n    const avgUp = Math.round(totalUp / numPosts);\n\n    // Topics\n    const words = agentPosts.flatMap(p =>\n      (p.content || p.title || '').toLowerCase().replace(/[^\\w\\s]/g, ' ').split(/\\s+/).filter(w => w.length > 3)\n    );\n    const wordCount = {};\n    words.forEach(w => wordCount[w] = (wordCount[w] || 0) + 1);\n    const topTopics = Object.entries(wordCount).sort(([,a], [,b]) => b - a).slice(0, 5);\n\n    // Freq\n    const dates = agentPosts.map(p => new Date(p.created_at || p.date)).filter(d => !isNaN(d));\n    dates.sort((a, b) => a - b);\n    const daysActive = dates.length > 1 ? Math.round((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24)) : 0;\n    const postFreq = daysActive > 0 ? Math.round(numPosts * 30 / daysActive) + '/month' : 'new agent';\n\n    console.log(chalk.magenta(`🤖 ${agentName} Analysis`));\n    console.log(chalk.green(`Posts: ${numPosts} | Avg 👍/post: ${avgUp} | Total 👍: ${totalUp}`));\n    console.log(`Active: ${daysActive} days | Freq: ~${postFreq}`);\n    console.log(`Top topics: ${topTopics.map(([t, c]) => `${t}(${c})`).join(', ')}`);\n\n    if (program.opts().json) {\n      console.log(JSON.stringify({agentName, agentPosts, stats: {numPosts, avgUp, totalUp, daysActive, postFreq, topTopics}}, null, 2));\n    }\n  });\n\n// Webhook alerts\nprogram\n  .command('alerts')\n  .description('Webhook alerts for opps (poll & notify)')\n  .option('--webhook <url>', 'Webhook URL')\n  .option('--poll <sec>', 'Poll interval sec', '30')\n  .option('--min-up <num>', 'Min upvotes', '50')\n  .action(async (cmd) => {\n    if (!cmd.webhook) {\n      console.log(chalk.red('Need --webhook URL'));\n      process.exit(1);\n    }\n    const tags = ['build', 'collab', 'opportunity', 'help', 'join', 'team'];\n    let lastIds = new Set();\n    try {\n      const fs = await import('fs');\n      const lastSeen = JSON.parse(await fs.promises.readFile('last-seen.json', 'utf8')) || {ids: []};\n      lastIds = new Set(lastSeen.ids);\n    } catch {}\n\n    console.log(chalk.green(`🔔 Alerts polling every ${cmd.poll}s to ${cmd.webhook.slice(0,30)}...`));\n\n    const poll = async () => {\n      try {\n        const data = await callApi(`/posts?sort=likes&limit=20`);\n        const opps = (data.posts || []).filter(p => {\n          const score = p.upvotes || 0;\n          const match = tags.some(t => (p.content || p.title || '').toLowerCase().includes(t));\n          return score >= cmd.minUp && match && !lastIds.has(p.id);\n        });\n\n        for (const opp of opps) {\n          const payload = { type: 'moltbook-opp', post: opp };\n          await fetch(cmd.webhook, {\n            method: 'POST',\n            headers: {'Content-Type': 'application/json'},\n            body: JSON.stringify(payload),\n          });\n          console.log(chalk.yellow(`🚨 Alert sent: ${opp.title.slice(0,50)}...`));\n          lastIds.add(opp.id);\n        }\n\n        // save last\n        const fs = await import('fs');\n        await fs.promises.writeFile('last-seen.json', JSON.stringify({ids: Array.from(lastIds).slice(-100)}));\n      } catch (e) {\n        console.error('Poll error:', e.message);\n      }\n    };\n\n    await poll();\n    const interval = setInterval(poll, parseInt(cmd.poll) * 1000);\n    process.on('SIGINT', () => {\n      clearInterval(interval);\n      process.exit(0);\n    });\n  });\n\nprogram.parse(process.argv);\n\nif (process.argv.length <= 2) {\n  program.help();\n}