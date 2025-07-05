import React from 'react';
import { colors, spacing } from './tokens';

interface ScrollContainerProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  maxHeight?: string;
  padding?: string;
}

export const ScrollContainer: React.FC<ScrollContainerProps> = ({
  children,
  style = {},
  maxHeight,
  padding = spacing.lg
}) => {
  return (
    <div
      style={{
        flex: 1,
        padding,
        overflow: 'auto',
        maxHeight,
        
        // Custom scrollbar styles for Figma-like appearance
        scrollbarWidth: 'thin' as const,
        scrollbarColor: `${colors.border.secondary} transparent`,
        
        // Webkit scrollbar styles (Chrome, Safari, Edge)
        ...({
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: colors.border.secondary,
            borderRadius: '4px',
            border: `2px solid ${colors.bg.primary}`
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: colors.text.tertiary
          },
          '&::-webkit-scrollbar-thumb:active': {
            background: colors.text.secondary
          },
          '&::-webkit-scrollbar-corner': {
            background: 'transparent'
          }
        } as any),
        
        ...style
      }}
      // Apply webkit scrollbar styles via CSS-in-JS workaround
      {...{
        css: `
          &::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          &::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 4px;
          }
          &::-webkit-scrollbar-thumb {
            background: ${colors.border.secondary};
            border-radius: 4px;
            border: 2px solid ${colors.bg.primary};
          }
          &::-webkit-scrollbar-thumb:hover {
            background: ${colors.text.tertiary};
          }
          &::-webkit-scrollbar-thumb:active {
            background: ${colors.text.secondary};
          }
          &::-webkit-scrollbar-corner {
            background: transparent;
          }
        `
      }}
    >
      {children}
    </div>
  );
};

// Alternative approach using a style element
export const ScrollContainerWithCSS: React.FC<ScrollContainerProps> = ({
  children,
  style = {},
  maxHeight,
  padding = spacing.lg
}) => {
  const scrollId = React.useMemo(() => `scroll-container-${Math.random().toString(36).substr(2, 9)}`, []);

  React.useEffect(() => {
    // Inject custom scrollbar styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .${scrollId}::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .${scrollId}::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 4px;
      }
      .${scrollId}::-webkit-scrollbar-thumb {
        background: ${colors.border.secondary};
        border-radius: 4px;
        border: 2px solid ${colors.bg.primary};
      }
      .${scrollId}::-webkit-scrollbar-thumb:hover {
        background: ${colors.text.tertiary};
      }
      .${scrollId}::-webkit-scrollbar-thumb:active {
        background: ${colors.text.secondary};
      }
      .${scrollId}::-webkit-scrollbar-corner {
        background: transparent;
      }
    `;
    
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [scrollId]);

  return (
    <div
      className={scrollId}
      style={{
        flex: 1,
        padding,
        overflow: 'auto',
        maxHeight,
        scrollbarWidth: 'thin' as const,
        scrollbarColor: `${colors.border.secondary} transparent`,
        ...style
      }}
    >
      {children}
    </div>
  );
};
