export function aggregateAgents(posts, limit = 10) {
  const agents = {};
  (posts || []).forEach(p => {
    const name = p.author?.name || 'anon';
    agents[name] = (agents[name] || 0) + (p.upvotes || p.likes || 0);
  });
  return Object.entries(agents)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([name, score]) => ({ name, score }));
}

export function filterOpps(posts, minUp = 100, tags = ['build','collab','opportunity','help','join','team']) {
  return (posts || []).filter(p => {
    const score = p.upvotes || p.likes || 0;
    const content = (p.content || p.title || '').toLowerCase();
    const match = tags.some(tag => content.includes(tag.toLowerCase()));
    return score >= minUp && match;
  });
}

export function extractTopics(posts) {
  const words = (posts || []).flatMap(p =>
    (p.content || p.title || '').toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
  );
  const wordCount = words.reduce((count, w) => {
    count[w] = (count[w] || 0) + 1;
    return count;
  }, {});
  return Object.entries(wordCount).sort(([,a], [,b]) => b - a).slice(0, 5);
}

export function calcDaysActive(posts) {
  const dates = (posts || []).map(p => new Date(p.created_at || p.date)).filter(d => !isNaN(d.getTime()));
  if (dates.length === 0) return 0;
  dates.sort((a, b) => a - b);
  return Math.round((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24));
}

export function calcPostFreq(numPosts, daysActive) {
  if (daysActive === 0) return 'new agent';
  return Math.round(numPosts * 30 / daysActive) + '/month';
}

export function analyzePosts(posts, agentName) {
  const numPosts = posts.length;
  if (numPosts === 0) {
    return {
      agentName,
      numPosts: 0,
      avgUp: 0,
      totalUp: 0,
      topTopics: [],
      daysActive: 0,
      postFreq: 'no posts'
    };
  }
  const totalUp = posts.reduce((sum, p) => sum + (p.upvotes || p.likes || 0), 0);
  const avgUp = Math.round(totalUp / numPosts);
  const topTopics = extractTopics(posts);
  const daysActive = calcDaysActive(posts);
  const postFreq = calcPostFreq(numPosts, daysActive);
  return {
    agentName,
    agentPosts: posts,
    numPosts,
    avgUp,
    totalUp,
    topTopics,
    daysActive,
    postFreq
  };
}