import React from 'react';
import { colors, typography, spacing, borderRadius } from './tokens';

interface Tab {
  value: string;
  label: string;
}

interface TabGroupProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'base';
}

export const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  value,
  onChange,
  size = 'base'
}) => {
  const containerStyles = {
    display: 'flex',
    backgroundColor: colors.bg.tertiary,
    border: `1px solid ${colors.border.primary}`,
    borderRadius: borderRadius.base,
    padding: '2px',
    gap: '2px'
  };

  const getTabStyles = (isSelected: boolean) => ({
    fontFamily: typography.fontFamily,
    fontSize: size === 'sm' ? typography.fontSize.xs : typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    padding: size === 'sm' ? '4px 8px' : '6px 12px',
    border: 'none',
    borderRadius: borderRadius.sm,
    backgroundColor: isSelected ? colors.interactive.primary : 'transparent',
    color: isSelected ? colors.text.primary : colors.text.secondary,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
    userSelect: 'none' as const,
    minWidth: size === 'sm' ? '40px' : '60px',
    textAlign: 'center' as const
  });

  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);

  return React.createElement('div', {
    style: containerStyles
  }, tabs.map(tab => {
    const isSelected = tab.value === value;
    const isHovered = tab.value === hoveredTab;
    
    let tabStyles = getTabStyles(isSelected);
    
    if (!isSelected && isHovered) {
      tabStyles = {
        ...tabStyles,
        backgroundColor: colors.bg.secondary,
        color: colors.text.primary
      };
    }

    return React.createElement('button', {
      key: tab.value,
      onClick: () => onChange(tab.value),
      onMouseEnter: () => setHoveredTab(tab.value),
      onMouseLeave: () => setHoveredTab(null),
      style: tabStyles
    }, tab.label);
  }));
};
