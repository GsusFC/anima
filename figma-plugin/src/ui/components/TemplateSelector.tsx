import React from 'react';
import { ConfigurationTemplate } from '../../types/slideshow.types';

interface TemplateSelectorProps {
  templates: ConfigurationTemplate[];
  selectedTemplate?: ConfigurationTemplate;
  onTemplateSelect: (template: ConfigurationTemplate) => void;
  onCustomizeTemplate?: (template: ConfigurationTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onCustomizeTemplate
}) => {
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  }, [
    React.createElement('h4', {
      key: 'title',
      style: {
        margin: 0,
        fontSize: '12px',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }
    }, 'Export Templates'),
    
    React.createElement('div', {
      key: 'templates',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '8px'
      }
    }, templates.map(template => 
      React.createElement('div', {
        key: template.id,
        style: {
          backgroundColor: selectedTemplate?.id === template.id ? '#ec4899' : '#2a2a2b',
          border: `1px solid ${selectedTemplate?.id === template.id ? '#ec4899' : '#343536'}`,
          borderRadius: '6px',
          padding: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ':hover': {
            backgroundColor: selectedTemplate?.id === template.id ? '#d946ef' : '#343536'
          }
        },
        onClick: () => onTemplateSelect(template)
      }, [
        React.createElement('div', {
          key: 'name',
          style: {
            fontSize: '13px',
            fontWeight: 'bold',
            color: selectedTemplate?.id === template.id ? 'white' : '#e5e7eb',
            marginBottom: '4px'
          }
        }, template.name),
        
        React.createElement('div', {
          key: 'description',
          style: {
            fontSize: '11px',
            color: selectedTemplate?.id === template.id ? 'rgba(255,255,255,0.8)' : '#9ca3af',
            marginBottom: '8px',
            lineHeight: '1.3'
          }
        }, template.description),
        
        React.createElement('div', {
          key: 'specs',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }
        }, [
          React.createElement('div', {
            key: 'format',
            style: {
              fontSize: '10px',
              color: selectedTemplate?.id === template.id ? 'rgba(255,255,255,0.7)' : '#6b7280'
            }
          }, `${template.exportSettings.format.toUpperCase()} • ${template.exportSettings.quality}`),
          
          React.createElement('div', {
            key: 'resolution',
            style: {
              fontSize: '10px',
              color: selectedTemplate?.id === template.id ? 'rgba(255,255,255,0.7)' : '#6b7280'
            }
          }, `${template.exportSettings.resolution.width}×${template.exportSettings.resolution.height}`),
          
          React.createElement('div', {
            key: 'duration',
            style: {
              fontSize: '10px',
              color: selectedTemplate?.id === template.id ? 'rgba(255,255,255,0.7)' : '#6b7280'
            }
          }, `${template.defaultDuration}ms • ${template.defaultTransition.type}`)
        ]),
        
        onCustomizeTemplate && template.id === 'custom' ? React.createElement('button', {
          key: 'customize',
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onCustomizeTemplate(template);
          },
          style: {
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '10px',
            cursor: 'pointer',
            width: '100%'
          }
        }, 'Customize') : null
      ])
    ))
  ]);
};
