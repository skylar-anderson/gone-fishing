'use client';

type EditorTab = 'scene' | 'texture';

interface EditorTabsProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
}

export function EditorTabs({ activeTab, onTabChange }: EditorTabsProps) {
  return (
    <div className="flex gap-1 mb-6">
      <button
        onClick={() => onTabChange('scene')}
        className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${
          activeTab === 'scene'
            ? 'bg-gray-800 text-white'
            : 'bg-gray-700 text-gray-400 hover:text-white'
        }`}
      >
        Scene Editor
      </button>
      <button
        onClick={() => onTabChange('texture')}
        className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${
          activeTab === 'texture'
            ? 'bg-gray-800 text-white'
            : 'bg-gray-700 text-gray-400 hover:text-white'
        }`}
      >
        Texture Editor
      </button>
    </div>
  );
}

export type { EditorTab };
