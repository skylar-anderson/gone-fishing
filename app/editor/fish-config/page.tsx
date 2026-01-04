'use client';

import dynamic from 'next/dynamic';

function EditorLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  );
}

const FishConfigEditor = dynamic(
  () => import('@/components/editor/FishConfigEditor').then(mod => ({ default: mod.FishConfigEditor })),
  { ssr: false, loading: () => <EditorLoading /> }
);

export default function FishConfigEditorPage() {
  return <FishConfigEditor />;
}
