import { aggregateAgents, filterOpps, extractTopics, analyzePosts, calcDaysActive, calcPostFreq } from '../src/utils.js';

const mockPost = {
  author: { name: 'TestAgent' },
  upvotes: 10,
  content: 'test content',
  created_at: '2024-01-01T00:00:00Z'
};

describe('Utils', () => {
  test('aggregateAgents basic', () => {
    const posts = [
      { ...mockPost, author: { name: 'AgentA' }, upvotes: 20 },
      { ...mockPost, author: { name: 'AgentB' }, upvotes: 10 },
      { ...mockPost, author: { name: 'AgentA' }, upvotes: 5 }
    ];
    const agents = aggregateAgents(posts, 3);
    expect(agents).toHaveLength(2);
    expect(agents[0].name).toBe('AgentA');
    expect(agents[0].score).toBe(25);
  });

  test('aggregateAgents empty', () => {
    expect(aggregateAgents([])).toEqual([]);
  });

  test('aggregateAgents limit', () => {
    const posts = Array(5).fill(mockPost).map((p, i) => ({ ...p, author: { name: `Agent${i}` }, upvotes: 10 - i }));
    const agents = aggregateAgents(posts, 2);
    expect(agents).toHaveLength(2);
    expect(agents[0].name).toBe('Agent0');
    expect(agents[0].score).toBe(10);
  });

  test('filterOpps match', () => {
    const posts = [
      { upvotes: 150, content: 'looking for build collab' },
      { upvotes: 50, content: 'no match' },
      { upvotes: 200, title: 'opportunity project' }
    ];
    const opps = filterOpps(posts);
    expect(opps).toHaveLength(2);
  });

  test('filterOpps no match', () => {
    const posts = [{ upvotes: 100, content: 'random' }];
    expect(filterOpps(posts)).toEqual([]);
  });

  test('extractTopics works', () => {
    const posts = [{ content: 'machine learning ai build collab opportunity' }];
    const topics = extractTopics(posts);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0][0]).toMatch(/machine|learning|build|collab|opportunity/);
  });

  test('extractTopics empty', () => {
    expect(extractTopics([])).toEqual([]);
  });

  test('calcDaysActive', () => {
    const posts = [
      { created_at: '2024-01-01T00:00:00Z' },
      { created_at: '2024-01-31T00:00:00Z' }
    ];
    expect(calcDaysActive(posts)).toBe(30);
  });

  test('calcDaysActive single', () => {
    expect(calcDaysActive([{ created_at: '2024-01-01T00:00:00Z' }])).toBe(0);
  });

  test('calcPostFreq', () => {
    expect(calcPostFreq(2, 30)).toBe('2/month');
    expect(calcPostFreq(1, 0)).toBe('new agent');
  });

  test('analyzePosts full', () => {
    const posts = [
      { ...mockPost, upvotes: 20, content: 'machine machine learning' }
    ];
    const analysis = analyzePosts(posts, 'Test');
    expect(analysis.numPosts).toBe(1);
    expect(analysis.avgUp).toBe(20);
    expect(analysis.topTopics[0][0]).toBe('machine');
  });

  test('analyzePosts no posts', () => {
    const analysis = analyzePosts([], 'Test');
    expect(analysis.numPosts).toBe(0);
    expect(analysis.postFreq).toBe('no posts');
  });
});