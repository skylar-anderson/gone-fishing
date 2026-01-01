'use client';

import { memo } from 'react';
import { Player, PlayerProps } from './Player';
import { useInterpolatedPosition } from '@/lib/hooks/useInterpolatedPosition';

type InterpolatedPlayerProps = PlayerProps;

export const InterpolatedPlayer = memo(function InterpolatedPlayer(
  props: InterpolatedPlayerProps
) {
  const interpolatedPosition = useInterpolatedPosition(props.position);

  return <Player {...props} position={interpolatedPosition} />;
});
