import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useDocsContent, clearDocsCache } from '@/hooks/use-docs-content';
import { cn } from '@/lib/utils';

export interface DocsSyncSectionProps {
  source: string;
  title: string;
  description?: string;
  className?: string;
  showExternalLink?: boolean;
  fallbackContent?: React.ReactNode;
  onContentLoad?: (content: string) => void;
}

/**
 * Component that fetches and renders documentation content from cc-docs
 * Automatically syncs content and caches for performance
 */
export function DocsSyncSection({
  source,
  title,
  description,
  className,
  showExternalLink = true,
  fallbackContent,
  onContentLoad,
}: DocsSyncSectionProps) {
  const { content, loading, error } = useDocsContent(source);

  // Notify parent when content is loaded
  React.useEffect(() => {
    if (content && onContentLoad) {
      onContentLoad(content);
    }
  }, [content, onContentLoad]);

  const handleRefresh = () => {
    clearDocsCache(source);
    window.location.reload();
  };

  const docsBaseUrl = import.meta.env.VITE_DOCS_BASE_URL || 'https://docs.controlcore.io';
  const fullUrl = `${docsBaseUrl}${source}`;

  // Loading state
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <Skeleton className="h-10 w-10 rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('w-full border-destructive', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {title}
              </CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to Load Documentation</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>Unable to fetch content from: {source}</p>
              <p className="text-xs">{error.message}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                {showExternalLink && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Online
                    </a>
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Show fallback content if provided */}
          {fallbackContent && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Fallback content:</p>
              {fallbackContent}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Success state with content
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            {showExternalLink && (
              <Button size="sm" variant="ghost" asChild>
                <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Customize heading rendering
              h1: ({ node, ...props }) => (
                <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h3 className="text-xl font-semibold mt-5 mb-2" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h4 className="text-lg font-semibold mt-4 mb-2" {...props} />
              ),
              // Customize link rendering
              a: ({ node, ...props }) => (
                <a
                  className="text-primary hover:underline"
                  target={props.href?.startsWith('http') ? '_blank' : undefined}
                  rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  {...props}
                />
              ),
              // Customize code block rendering
              code: ({ node, inline, ...props }) => (
                inline ? (
                  <code
                    className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                    {...props}
                  />
                ) : (
                  <code
                    className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono"
                    {...props}
                  />
                )
              ),
              // Customize list rendering
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside space-y-1 my-3" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside space-y-1 my-3" {...props} />
              ),
              // Customize blockquote rendering
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground"
                  {...props}
                />
              ),
              // Customize table rendering
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full divide-y divide-border" {...props} />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th className="px-3 py-2 text-left text-sm font-semibold bg-muted" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="px-3 py-2 text-sm border-t border-border" {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version of DocsSyncSection for embedding in smaller spaces
 */
export function DocsSyncSectionCompact({
  source,
  title,
  className,
}: Pick<DocsSyncSectionProps, 'source' | 'title' | 'className'>) {
  const { content, loading, error } = useDocsContent(source);

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Failed to load: {title}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Helper to preload documentation sections
 * Use this to prefetch content before it's displayed
 */
export { preloadDocsContent as preloadDocumentation } from '@/hooks/use-docs-content';

