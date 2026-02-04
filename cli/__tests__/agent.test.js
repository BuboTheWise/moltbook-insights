import { getTopAgents, getAgentPosts, analyzeAgent } from '../src/agent.js';

const mockPost = {
  id: '1',
  title: 'Test Post',
  content: 'test content',
  author: { name: 'TestAgent' },
  upvotes: 10,
  likes: 10,
  created_at: '2024-01-01T00:00:00Z'
};

describe('Agent Feature', () => {
  beforeAll(() => {
    process.env.MOLTBOOK_API_KEY = 'testkey';
  });

  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getTopAgents aggregates from posts fallback', async () => {
    const mockPosts = [
      { ...mockPost, author: { name: 'AgentA' }, upvotes: 20 },
      { ...mockPost, author: { name: 'AgentB' }, upvotes: 10 },
      { ...mockPost, author: { name: 'AgentA' }, upvotes: 5 },
    ];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ posts: mockPosts })
    });

    const agents = await getTopAgents(3);
    expect(agents).toHaveLength(2);
    expect(agents[0].name).toBe('AgentA');
    expect(agents[0].score).toBe(25);
  });

  test('getAgentPosts filters by query', async () => {
    const mockPosts = [
      { ...mockPost, author: { name: 'TestAgent' } },
      { ...mockPost, author: { name: 'Other' } },
    ];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockPosts })
    });

    const posts = await getAgentPosts('Test');
    expect(posts).toHaveLength(1);
    expect(posts[0].author.name).toBe('TestAgent');
  });

  test('analyzeAgent calculates stats', async () => {
    const mockPosts = [
      { ...mockPost, upvotes: 10 },
      { ...mockPost, upvotes: 20, content: 'machine machine learning ai', created_at: '2024-01-02T00:00:00Z' },
    ];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockPosts })
    });

    const analysis = await analyzeAgent('TestAgent');
    expect(analysis.numPosts).toBe(2);
    expect(analysis.avgUp).toBe(15);
    expect(analysis.topTopics[0][0]).toBe('machine'); // example
  });

  test('getTopAgents handles empty posts', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ posts: [] })
    });
    const agents = await getTopAgents();
    expect(agents).toHaveLength(0);
  });

  test('getAgentPosts no match', async () => {
    const mockPosts = [{ ...mockPost, author: { name: 'Other' } }];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockPosts })
    });
    const posts = await getAgentPosts('NoMatch');
    expect(posts).toHaveLength(0);
  });

  test('analyzeAgent no posts', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] })
    });
    const analysis = await analyzeAgent('NoAgent');
    expect(analysis.numPosts).toBe(0);
  });

  test('getTopAgents direct API', async () => {
    const mockAgents = [{ name: 'DirectA', score: 100 }];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ agents: mockAgents })
    });
    const agents = await getTopAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('DirectA');
  });

  // more tests for edge cases
  test('getAgentPosts case insensitive', async () => {
    const mockPosts = [{ ...mockPost, author: { name: 'testagent' } }];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockPosts })
    });
    const posts = await getAgentPosts('Test');
    expect(posts).toHaveLength(1);
  });

  test('analyzeAgent single post', async () => {
    const mockPosts = [{ ...mockPost }];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockPosts })
    });
    const analysis = await analyzeAgent('TestAgent');
    expect(analysis.numPosts).toBe(1);
    expect(analysis.daysActive).toBe(0);
  });

  test('analyzeAgent topics extraction', async () => {
    const mockPosts = [{ content: 'build collaboration opportunity project team', upvotes: 5 }];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockPosts })
    });
    const analysis = await analyzeAgent('Test');
    expect(analysis.topTopics.length).toBeGreaterThan(0);
  });

  test('getTopAgents limit', async () => {
    const mockPosts = Array(5).fill(mockPost).map((p, i) => ({ ...p, author: { name: `Agent${i}` }, upvotes: 10 - i }));
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ posts: mockPosts })
    });
    const agents = await getTopAgents(2);
    expect(agents).toHaveLength(2);
  });

  test('analyzeAgent freq calculation', async () => {
    const dates = [
      { ...mockPost, created_at: '2024-01-01T00:00:00Z' },
      { ...mockPost, created_at: '2024-02-01T00:00:00Z' }
    ];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: dates })
    });
    const analysis = await analyzeAgent('Test');
    expect(analysis.postFreq).toContain('/month');
  });
});
