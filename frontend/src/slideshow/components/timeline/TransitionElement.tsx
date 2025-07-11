import React from 'react';
import { TimelineItem, TransitionConfig } from '../../types/slideshow.types';

// Sub-components
interface TransitionIconProps {
  type?: string;
}

const TransitionIcon: React.FC<TransitionIconProps> = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case 'fade':
      case 'fadeblack':
      case 'fadewhite':
        return '🌅';
      case 'slide':
      case 'slideleft':
      case 'slideright':
      case 'slideup':
      case 'slidedown':
        return '➡️';
      case 'zoom':
      case 'zoomin':
        return '🔍';
      case 'dissolve':
        return '✨';
      case 'cut':
        return '⚡';
      // Movement category
      case 'coverleft':
      case 'coverright':
      case 'coverup':
      case 'coverdown':
      case 'revealleft':
      case 'revealright':
      case 'revealup':
      case 'revealdown':
        return '↗️';
      // Effects category
      case 'pixelize':
      case 'distance':
      case 'hblur':
        return '⚡';
      // Wipe category
      case 'wipeleft':
      case 'wiperight':
      case 'wipeup':
      case 'wipedown':
      case 'wipetl':
      case 'wipetr':
      case 'wipebl':
      case 'wipebr':
        return '◐';
      // Squeeze category
      case 'squeezev':
      case 'squeezeh':
        return '⬌';
      default:
        return '🔄'; // Consistent fallback
    }
  };

  return (
    <div
      style={{
        fontSize: '18px',
        marginBottom: '2px'
      }}
    >
      {getIcon()}
    </div>
  );
};

interface TransitionLabelProps {
  text: string;
  isActive: boolean;
}

const TransitionLabel: React.FC<TransitionLabelProps> = ({ text, isActive }) => (
  <div
    style={{
      fontSize: '10px',
      color: isActive ? '#ec4899' : '#6b7280',
      textAlign: 'center',
      fontFamily: '"Space Mono", monospace',
      fontWeight: isActive ? 'bold' : 'normal',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}
  >
    {text}
  </div>
);

// EditButton removed - relying on color + text feedback only

// Main component interfaces
export interface TransitionData {
  id: string;
  fromItemId: string;
  toItemId: string;
  config?: TransitionConfig;
}

export interface TransitionHandlers {
  onEdit: (itemId: string) => void;
}

export interface TransitionElementProps {
  fromItem: TimelineItem;
  toItem: TimelineItem;
  index: number;
  handlers: {
    onEdit: (itemId: string) => void;
  };
}

const TransitionElement: React.FC<TransitionElementProps> = ({
  fromItem,
  toItem,
  index,
  handlers
}) => {
  const transition = fromItem.transition;
  const hasTransition = !!transition;
  
  return (
    <div
      className="transition-element"
      data-from-item={fromItem.id}
      data-to-item={toItem.id}
      data-index={index}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '70px',  // Increased to better proportion with larger cards
        height: '100px', // Match the height of the new cards
        background: hasTransition
          ? 'rgba(236, 72, 153, 0.1)'
          : 'rgba(55, 65, 81, 0.3)',
        border: hasTransition
          ? '2px solid rgba(236, 72, 153, 0.5)'
          : '2px solid #374151',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' // Subtle shadow for depth
      }}
      onClick={() => handlers.onEdit(fromItem.id)}
      onMouseEnter={(e) => {
        const element = e.currentTarget;
        if (hasTransition) {
          element.style.background = 'rgba(236, 72, 153, 0.2)';
          element.style.borderColor = '#ec4899';
          element.style.transform = 'scale(1.02)';
          element.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.2)';
        } else {
          element.style.background = 'rgba(55, 65, 81, 0.5)';
          element.style.borderColor = '#6b7280';
          element.style.transform = 'scale(1.02)';
          element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        const element = e.currentTarget;
        if (hasTransition) {
          element.style.background = 'rgba(236, 72, 153, 0.1)';
          element.style.borderColor = 'rgba(236, 72, 153, 0.5)';
        } else {
          element.style.background = 'rgba(55, 65, 81, 0.3)';
          element.style.borderColor = '#374151';
        }
        element.style.transform = 'scale(1)';
        element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }}
    >
      <TransitionIcon type={transition?.type} />

      <TransitionLabel
        text={transition?.type || 'none'}
        isActive={hasTransition}
      />

      {/* Connection line to next item */}
      <div
        style={{
          position: 'absolute',
          right: '-10px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '20px',
          height: '2px',
          background: hasTransition
            ? 'linear-gradient(to right, rgba(236, 72, 153, 0.5), rgba(236, 72, 153, 0.2))'
            : 'linear-gradient(to right, #374151, rgba(55, 65, 81, 0.3))',
          borderRadius: '1px'
        }}
      />
    </div>
  );
};

export default TransitionElement;
