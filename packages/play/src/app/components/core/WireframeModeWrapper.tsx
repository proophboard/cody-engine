import React, { ReactNode } from 'react';
import { useThemeMode } from '@cody-play/hooks/useThemeMode';

interface Props {
  children: ReactNode;
}

/**
 * Wrapper component that applies the wireframe-mode class when wireframe theme is active.
 * Must be used inside PlayToggleColorMode provider.
 */
export function WireframeModeWrapper({ children }: Props) {
  const { themeMode } = useThemeMode();

  return (
    <div className={themeMode === 'wireframe' ? 'wireframe-mode' : ''}>
      {children}
    </div>
  );
}

export default WireframeModeWrapper;
