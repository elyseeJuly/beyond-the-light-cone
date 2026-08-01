import React from 'react';
import { Composition } from 'remotion';
import { BeyondTheLightConePromo } from './Composition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="promo-90s"
        component={BeyondTheLightConePromo}
        defaultProps={{ lang: 'en' as const }}
        durationInFrames={2250} // 90 seconds @ 25 FPS
        fps={25}
        width={1280}
        height={720}
      />
      <Composition
        id="promo-90s-zh"
        component={BeyondTheLightConePromo}
        defaultProps={{ lang: 'zh' as const }}
        durationInFrames={2250} // 90 seconds @ 25 FPS
        fps={25}
        width={1280}
        height={720}
      />
    </>
  );
};
