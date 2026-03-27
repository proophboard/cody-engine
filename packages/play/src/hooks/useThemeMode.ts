import { useContext } from 'react';
import { ThemeModeContext, ThemeMode, ThemeModeContextType } from '@cody-play/app/layout/PlayToggleColorMode';

/**
 * Hook to access and toggle between default and wireframe themes.
 * 
 * @returns Theme mode context with current mode and toggle function
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { themeMode, toggleThemeMode } = useThemeMode();
 *   
 *   return (
 *     <Button onClick={toggleThemeMode}>
 *       Switch to {themeMode === 'default' ? 'Wireframe' : 'Default'} Theme
 *     </Button>
 *   );
 * }
 * ```
 */
export function useThemeMode(): ThemeModeContextType {
  const context = useContext(ThemeModeContext);
  
  if (context === undefined) {
    throw new Error(
      'useThemeMode must be used within a PlayToggleColorMode provider'
    );
  }
  
  return context;
}

/**
 * Check if wireframe mode is currently active
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isWireframe } = useIsWireframe();
 *   
 *   return <div className={isWireframe ? 'wireframe-mode' : ''}>...</div>;
 * }
 * ```
 */
export function useIsWireframe(): { isWireframe: boolean } {
  const { themeMode } = useThemeMode();
  return { isWireframe: themeMode === 'wireframe' };
}

export { ThemeMode };
