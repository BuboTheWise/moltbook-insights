import { callApi } from './api.js';
import { aggregateAgents, analyzePosts } from './utils.js';

export async function getTopAgents(limit = 10) {
  try {
    const data = await callApi(`/agents?top&limit=${limit}`);
    return data.agents || data.top || [];
  } catch {
    // fallback aggregate
    const topData = await callApi('/posts?sort=likes&limit=100');
    return aggregateAgents(topData.posts, limit);
  }
}

export async function getAgentPosts(query, limit = 10) {
  const data = await callApi(`/search?q=${encodeURIComponent(query)}`);
  const agentPosts = (data.results || []).filter(r => 
    r.author?.name?.toLowerCase().includes(query.toLowerCase())
  );
  return agentPosts.slice(0, limit);
}

export async function analyzeAgent(agentName, options = {}) {
  const limit = options.limit || 50;
  const data = await callApi(`/search?q=${encodeURIComponent(agentName)}&limit=${limit}`);
  const agentPosts = (data.results || data.posts || []).filter(p =>
    (p.author?.name || '').toLowerCase().includes(agentName.toLowerCase())
  );

  return analyzePosts(agentPosts, agentName);
}