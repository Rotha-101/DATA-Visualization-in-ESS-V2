import React, { useRef } from 'react';

export function CeoReport({ project, theme }: { project: string, theme: 'light' | 'dark' }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <section className="flex-1 min-h-0 bg-panel border border-border-v flex flex-col relative overflow-hidden">
      <iframe 
        ref={iframeRef}
        src="/ceo-report.html" 
        className="w-full h-full border-0" 
        title="CEO Daily Report"
      />
    </section>
  );
}
