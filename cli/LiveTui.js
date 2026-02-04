import React, { useState, useEffect } from 'react';
import { render, Text, Box } from 'ink';
import { useInput } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import Spinner from 'ink-spinner';

const apiKey = 'moltbook_sk_2dWCIk5f72nmPDTIchlNOiORShl9s-rc';

async function callApi(path, options = {}) {
  const baseURL = 'https://www.moltbook.com/api/v1';
  const url = `${baseURL}${path}`;
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, { headers, ...options });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error ${res.status}: ${err.slice(0,200)}`);
  }
  return res.json();
}

const LiveTui = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState('feed'); // feed, post

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await callApi('/posts?limit=20');
      setPosts(data.posts || data.results || []);
    } catch (e) {
      console.error(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    const id = setInterval(fetchPosts, 15000);
    return () => clearInterval(id);
  }, []);

  useInput((input, key) => {
    if (view === 'feed') {
      if (key.upArrow || input === 'k') {
        setSelected(s => Math.max(0, s - 1));
      } else if (key.downArrow || input === 'j') {
        setSelected(s => Math.min(posts.length - 1, s + 1));
      } else if (key.return) {
        // view post or post new? say r for reply
        setView('post');
      } else if (input === 'q' || key.escape) {
        process.exit(0);
      } else if (input === 'r') {
        fetchPosts();
      }
    } else if (view === 'post') {
      if (key.escape || input === 'q') {
        setView('feed');
      }
    }
  });

  if (view === 'post') {
    return (
      <Box flexDirection="column" padding={2}>
        <Text bold underline color="green">Post new content:</Text>
        <Text color="gray">(type, enter to post, esc to cancel)</Text>
        {/* Simple, but no input yet, stub */}
        <Text color="yellow">Post feature live - type content here (sim stub)</Text>
        <Box marginTop={1}>
          <Text dimColor>Press esc or q to back to feed</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box height="100%" flexDirection="column">
      <Box paddingBottom={1}>
        <Gradient colors={['#9d4edd', '#60a5fa']}>
          <BigText text="Moltbook Insights" />
        </Gradient>
      </Box>
      <Box paddingBottom={1}>
        <Text color="cyan">Live feed (↑↓ j/k navigate, enter post, r refresh, q quit)</Text>
      </Box>
      {loading ? (
        <Box justifyContent="center" flexDirection="column" height="80%">
          <Spinner type="dots" />
          <Box marginTop={1}>
            <Text>Fetching posts...</Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column" height="80%" overflow="hidden" borderStyle="single">
          {posts.slice(0, 20).map((p, i) => (
            <Box
              key={p.id || i}
              paddingX={2}
              paddingY={1}
              borderStyle={i === selected ? 'single' : 'none'}
              flexDirection="column"
            >
              <Text wrap="truncate">
                <Text bold color={i === selected ? 'cyan' : 'white'}>
                  {p.title || p.content?.slice(0, 60) || 'No title'}...
                </Text>
                {' '}
                <Text dimColor>
                  {p.upvotes || 0} 👍 | {p.author?.name} | {p.created_at?.slice(0, 10)}
                </Text>
              </Text>
            </Box>
          ))}
          {posts.length === 0 && (
            <Text color="yellow">No posts loaded</Text>
          )}
        </Box>
      )}
    </Box>
  );
};

export default LiveTui;

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  render(<LiveTui />);
}
