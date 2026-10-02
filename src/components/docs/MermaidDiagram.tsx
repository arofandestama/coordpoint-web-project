'use client';

import { useEffect, useState } from 'react';

import { Skeleton } from '@/common/skeleton';
import { cn } from '@/utils/cn';

export interface MermaidDiagramProps {
  /** Unique base id used for the mermaid render id. */
  id: string;
  /** Raw mermaid diagram source. */
  chart: string;
  className?: string;
}

/**
 * Module-level flag so mermaid.initialize runs exactly once, even when the
 * effect re-runs (StrictMode) or multiple diagrams mount at the same time.
 */
let mermaidInitialized = false;

/**
 * Mermaid v10+ may leave a dangling temp element (`#d<id>` / `#<id>`) in the
 * DOM when a render is aborted or fails — clean it up defensively.
 */
function cleanupRenderArtifact(renderId: string): void {
  document.getElementById(renderId)?.remove();
  document.getElementById(`d${renderId}`)?.remove();
}

export function MermaidDiagram({ id, chart, className }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const renderId = `${id}-${Math.random().toString(36).slice(2, 8)}`;

    const render = async (): Promise<void> => {
      try {
        const { default: mermaid } = await import('mermaid');
        if (cancelled) return;

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'neutral',
            fontFamily: 'var(--font-geist-sans), sans-serif',
          });
          mermaidInitialized = true;
        }

        const { svg: renderedSvg } = await mermaid.render(renderId, chart);

        if (cancelled) {
          cleanupRenderArtifact(renderId);
          return;
        }

        setSvg(renderedSvg);
      } catch {
        cleanupRenderArtifact(renderId);
        if (!cancelled) {
          setFailed(true);
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (failed) {
    return (
      <pre className="overflow-x-auto rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-600">
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div
        className={cn('flex min-h-64 items-center justify-center bg-white p-6', className)}
        role="status"
        aria-label="Memuat diagram"
      >
        <div className="w-full max-w-sm space-y-3" aria-hidden="true">
          <Skeleton className="mx-auto h-3 w-1/2" />
          <Skeleton className="h-16 w-full" />
          <div className="flex items-end justify-between gap-3">
            <Skeleton className="h-14 w-2/5" />
            <Skeleton className="h-14 w-2/5" />
          </div>
          <Skeleton className="mx-auto h-3 w-2/3" />
        </div>
        <span className="sr-only">Memuat diagram&hellip;</span>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Diagram ${id}`}
      className={cn('overflow-x-auto bg-white', className)}
    >
      <div
        className="[&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

export default MermaidDiagram;
