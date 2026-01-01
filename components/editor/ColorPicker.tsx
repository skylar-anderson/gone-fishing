'use client';

import { HexColorPicker, HexColorInput } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <HexColorPicker color={color} onChange={onChange} style={{ width: '100%' }} />
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded border-2 border-gray-600"
          style={{ backgroundColor: color }}
        />
        <HexColorInput
          color={color}
          onChange={onChange}
          prefixed
          className="flex-1 bg-gray-700 rounded px-3 py-2 text-sm font-mono uppercase"
        />
      </div>
    </div>
  );
}
