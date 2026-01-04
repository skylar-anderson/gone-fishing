'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Canvas renderer to handle WASM loading
const CanvasGameRenderer = dynamic(
  () => import('./CanvasGameRenderer').then((mod) => ({ default: mod.CanvasGameRenderer })),
  {
    ssr: false,
    loading: () => <RendererLoading message="Loading graphics engine..." />,
  }
);

// Keep the SVG renderer as fallback
const GameCanvas = dynamic(
  () => import('./GameCanvas').then((mod) => ({ default: mod.GameCanvas })),
  {
    ssr: false,
    loading: () => <RendererLoading message="Loading game..." />,
  }
);

function RendererLoading({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
      <p className="text-gray-400">{message}</p>
    </div>
  );
}

// Check if WASM is supported
async function checkWasmSupport(): Promise<boolean> {
  try {
    // Check if WebAssembly is available
    if (typeof WebAssembly !== 'object') {
      return false;
    }

    // Try to load the WASM module
    const { initWasm } = await import('@/lib/wasm/pngGenerator');
    await initWasm();
    return true;
  } catch (err) {
    console.warn('WASM not supported, falling back to SVG renderer:', err);
    return false;
  }
}

export function GameRenderer() {
  const [useCanvas, setUseCanvas] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkWasmSupport()
      .then((supported) => {
        setUseCanvas(supported);
        if (supported) {
          console.log('Using Canvas/PNG renderer (WASM available)');
        } else {
          console.log('Using SVG renderer (WASM not available)');
        }
      })
      .catch((err) => {
        console.error('Error checking WASM support:', err);
        setError(err.message);
        setUseCanvas(false);
      });
  }, []);

  // Still checking
  if (useCanvas === null) {
    return <RendererLoading message="Initializing..." />;
  }

  // Error state - fall back to SVG
  if (error) {
    console.warn('Falling back to SVG renderer due to error:', error);
    return <GameCanvas />;
  }

  // Use Canvas renderer with WASM if supported
  if (useCanvas) {
    return (
      <Suspense fallback={<RendererLoading message="Loading graphics..." />}>
        <CanvasGameRenderer />
      </Suspense>
    );
  }

  // Fallback to SVG renderer
  return <GameCanvas />;
}
