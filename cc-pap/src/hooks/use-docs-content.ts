import { useState, useEffect } from 'react';

export interface DocsContentState {
  content: string;
  loading: boolean;
  error: Error | null;
}

interface UseDocsContentOptions {
  enabled?: boolean;
  cacheDuration?: number; // in milliseconds
}

const contentCache = new Map<string, { content: string; timestamp: number }>();

/**
 * Hook to fetch and cache documentation content from cc-docs
 * 
 * @param source - The documentation path (e.g., "/guides/user-guide")
 * @param options - Configuration options
 * @returns DocsContentState with content, loading, and error states
 */
export function useDocsContent(
  source: string,
  options: UseDocsContentOptions = {}
): DocsContentState {
  const { enabled = true, cacheDuration = 5 * 60 * 1000 } = options; // 5 minutes default cache
  
  const [state, setState] = useState<DocsContentState>({
    content: '',
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ content: '', loading: false, error: null });
      return;
    }

    const fetchContent = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Check cache first
        const cached = contentCache.get(source);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < cacheDuration) {
          setState({
            content: cached.content,
            loading: false,
            error: null,
          });
          return;
        }

        // Fetch from docs service
        // In production, this would fetch from the cc-docs deployment
        // For development, we can use static content or fetch from local docs server
        const docsBaseUrl = import.meta.env.VITE_DOCS_BASE_URL || 'https://docs.controlcore.io';
        const response = await fetch(`${docsBaseUrl}${source}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch documentation: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        let content: string;

        if (contentType?.includes('text/html')) {
          // Extract main content from HTML
          const html = await response.text();
          content = extractMainContent(html);
        } else if (contentType?.includes('text/markdown') || contentType?.includes('text/plain')) {
          // Direct markdown content
          content = await response.text();
        } else {
          // Try as text
          content = await response.text();
        }

        // Cache the result
        contentCache.set(source, { content, timestamp: now });

        setState({
          content,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error(`Error fetching docs content from ${source}:`, error);
        setState({
          content: '',
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    fetchContent();
  }, [source, enabled, cacheDuration]);

  return state;
}

/**
 * Extract main content from HTML documentation page
 * This removes navigation, headers, footers, etc.
 */
function extractMainContent(html: string): string {
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Try to find main content area
  // Common selectors for documentation content
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.documentation-content',
    '.markdown-body',
    '#content',
  ];

  for (const selector of contentSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      return element.textContent || element.innerHTML || '';
    }
  }

  // Fallback: return body content
  return doc.body.textContent || doc.body.innerHTML || '';
}

/**
 * Clear the content cache
 * Useful for forcing a refresh of documentation
 */
export function clearDocsCache(source?: string): void {
  if (source) {
    contentCache.delete(source);
  } else {
    contentCache.clear();
  }
}

/**
 * Preload documentation content
 * Useful for prefetching content that will be displayed soon
 */
export async function preloadDocsContent(source: string): Promise<void> {
  const docsBaseUrl = import.meta.env.VITE_DOCS_BASE_URL || 'https://docs.controlcore.io';
  
  try {
    const response = await fetch(`${docsBaseUrl}${source}`);
    if (response.ok) {
      const content = await response.text();
      contentCache.set(source, { content, timestamp: Date.now() });
    }
  } catch (error) {
    console.error(`Error preloading docs content from ${source}:`, error);
  }
}

/**
 * Hook to fetch multiple documentation sources
 * Returns a map of source to content state
 */
export function useMultipleDocsContent(
  sources: string[],
  options: UseDocsContentOptions = {}
): Map<string, DocsContentState> {
  const [states, setStates] = useState<Map<string, DocsContentState>>(
    new Map(sources.map(source => [source, { content: '', loading: true, error: null }]))
  );

  useEffect(() => {
    if (!options.enabled && options.enabled !== undefined) {
      setStates(new Map(sources.map(source => [source, { content: '', loading: false, error: null }])));
      return;
    }

    const fetchAll = async () => {
      const results = await Promise.allSettled(
        sources.map(async (source) => {
          const cached = contentCache.get(source);
          const now = Date.now();
          const cacheDuration = options.cacheDuration || 5 * 60 * 1000;

          if (cached && (now - cached.timestamp) < cacheDuration) {
            return { source, content: cached.content, error: null };
          }

          try {
            const docsBaseUrl = import.meta.env.VITE_DOCS_BASE_URL || 'https://docs.controlcore.io';
            const response = await fetch(`${docsBaseUrl}${source}`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch: ${response.statusText}`);
            }

            const content = await response.text();
            contentCache.set(source, { content, timestamp: now });
            
            return { source, content, error: null };
          } catch (error) {
            return {
              source,
              content: '',
              error: error instanceof Error ? error : new Error('Unknown error'),
            };
          }
        })
      );

      const newStates = new Map<string, DocsContentState>();
      results.forEach((result, index) => {
        const source = sources[index];
        if (result.status === 'fulfilled') {
          newStates.set(source, {
            content: result.value.content,
            loading: false,
            error: result.value.error,
          });
        } else {
          newStates.set(source, {
            content: '',
            loading: false,
            error: new Error(result.reason?.message || 'Failed to fetch'),
          });
        }
      });

      setStates(newStates);
    };

    fetchAll();
  }, [sources.join(','), options.enabled, options.cacheDuration]);

  return states;
}

