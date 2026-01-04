'use client';

import dynamic from 'next/dynamic';

function EditorLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  );
}

// Dynamic import with SSR disabled to avoid hydration mismatch from localStorage
const TextureEditor = dynamic(
  () => import('@/components/editor/TextureEditor').then(mod => ({ default: mod.TextureEditor })),
  { ssr: false, loading: () => <EditorLoading /> }
);

export default function TextureEditorPage() {
  return <TextureEditor />;
}
