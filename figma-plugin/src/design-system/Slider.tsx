import React from 'react';
import { colors, typography, spacing, borderRadius } from './tokens';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  color?: 'primary' | 'secondary';
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  color = 'primary'
}) => {
  const sliderStyles = {
    width: '100%',
    height: '4px',
    borderRadius: borderRadius.sm,
    background: `linear-gradient(to right, ${
      color === 'primary' ? colors.interactive.primary : colors.interactive.secondary
    } 0%, ${
      color === 'primary' ? colors.interactive.primary : colors.interactive.secondary
    } ${((value - min) / (max - min)) * 100}%, ${colors.bg.tertiary} ${((value - min) / (max - min)) * 100}%, ${colors.bg.tertiary} 100%)`,
    outline: 'none',
    appearance: 'none' as const,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const
  };

  const thumbStyles = `
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${color === 'primary' ? colors.interactive.primary : colors.interactive.secondary};
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      border: 2px solid ${colors.bg.primary};
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
    
    input[type="range"]::-webkit-slider-thumb:hover {
      background: ${color === 'primary' ? colors.interactive.primaryHover : colors.interactive.secondaryHover};
    }
    
    input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${color === 'primary' ? colors.interactive.primary : colors.interactive.secondary};
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      border: 2px solid ${colors.bg.primary};
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
    
    input[type="range"]::-moz-range-thumb:hover {
      background: ${color === 'primary' ? colors.interactive.primaryHover : colors.interactive.secondaryHover};
    }
  `;

  React.useEffect(() => {
    // Inject thumb styles
    const styleId = 'figma-slider-styles';
    let existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
      existingStyle = document.createElement('style');
      existingStyle.id = styleId;
      document.head.appendChild(existingStyle);
    }
    
    existingStyle.textContent = thumbStyles;
  }, [thumbStyles]);

  return React.createElement('input', {
    type: 'range',
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled) {
        onChange(parseInt(e.target.value));
      }
    },
    min,
    max,
    step,
    disabled,
    style: sliderStyles
  });
};
