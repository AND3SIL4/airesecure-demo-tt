import React from 'react';
import { Composition } from 'remotion';
import { Promo } from './Promo';
import { FPS, TOTAL } from './timing';

export const Root: React.FC = () => (
  <Composition id="AeroSecurePromo" component={Promo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
);
