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
const FishSpriteEditor = dynamic(
  () => import('@/components/editor/FishSpriteEditor').then(mod => ({ default: mod.FishSpriteEditor })),
  { ssr: false, loading: () => <EditorLoading /> }
);

export default function FishSpriteEditorPage() {
  return <FishSpriteEditor />;
}
