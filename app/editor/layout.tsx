'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSceneStore } from '@/store/sceneStore';
import { useTextureStore } from '@/store/textureStore';
import { useFishSpriteStore } from '@/store/fishSpriteStore';

type EditorTab = 'scene' | 'texture' | 'fish' | 'fish-config';

const TABS: { id: EditorTab; label: string; path: string }[] = [
  { id: 'scene', label: 'Scene Editor', path: '/editor/scene' },
  { id: 'texture', label: 'Texture Editor', path: '/editor/texture' },
  { id: 'fish', label: 'Fish Sprites', path: '/editor/fish' },
  { id: 'fish-config', label: 'Fish Config', path: '/editor/fish-config' },
];

function EditorTabs({ activeTab }: { activeTab: EditorTab }) {
  return (
    <div className="flex gap-1 mb-6">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.path}
          className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-gray-800 text-white'
              : 'bg-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine active tab from pathname
  const activeTab: EditorTab = pathname.includes('/texture')
    ? 'texture'
    : pathname.includes('/fish-config')
    ? 'fish-config'
    : pathname.includes('/fish')
    ? 'fish'
    : 'scene';

  // Get dirty state from all editors for beforeunload warning
  const sceneIsDirty = useSceneStore((state) => state.isDirty);
  const textureIsDirty = useTextureStore((state) => state.isDirty);
  const fishSpriteIsDirty = useFishSpriteStore((state) => state.isDirty);

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sceneIsDirty || textureIsDirty || fishSpriteIsDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sceneIsDirty, textureIsDirty, fishSpriteIsDirty]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Editor</h1>
        <div className="text-sm text-gray-400">
          Changes are automatically saved to your browser
        </div>
      </div>

      <EditorTabs activeTab={activeTab} />

      {children}
    </div>
  );
}
