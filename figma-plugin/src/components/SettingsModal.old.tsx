import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius } from '../design-system/tokens';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Select } from '../design-system/Select';
import { TabGroup } from '../design-system/TabGroup';
import { usePluginContext } from '../context/PluginContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { config, updateConfig, resetConfig } = usePluginContext();
  const [localConfig, setLocalConfig] = useState(config);
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const handleSave = () => {
    updateConfig(localConfig);
    onClose();
  };

  const handleReset = () => {
    resetConfig();
    setLocalConfig(config);
  };

  const transitionOptions = [
    { value: 'fade', label: 'Fade' },
    { value: 'cut', label: 'Cut' },
    { value: 'slide', label: 'Slide' },
    { value: 'dissolve', label: 'Dissolve' }
  ];

  const tabs = [
    { value: 'general', label: 'General' },
    { value: 'export', label: 'Export' },
    { value: 'gif', label: 'GIF' },
    { value: 'debug', label: 'Debug' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <>
            {/* API URL */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: spacing.xs,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                fontWeight: typography.fontWeight.medium
              }}>
                API Base URL
              </label>
              <Input
                value={localConfig.apiBaseURL}
                onChange={(value) => setLocalConfig(prev => ({ ...prev, apiBaseURL: String(value) }))}
                placeholder="http://localhost:3001"
              />
            </div>

            {/* Default Duration */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: spacing.xs,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                fontWeight: typography.fontWeight.medium
              }}>
                Default Frame Duration (ms)
              </label>
              <Input
                type="number"
                value={localConfig.defaultDuration.toString()}
                onChange={(value) => setLocalConfig(prev => ({ 
                  ...prev, 
                  defaultDuration: parseInt(value.toString()) || 1000 
                }))}
                min={100}
                max={10000}
                step={100}
              />
            </div>

            {/* Default Transition */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: spacing.xs,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                fontWeight: typography.fontWeight.medium
              }}>
                Default Transition
              </label>
              <Select
                value={localConfig.defaultTransition}
                onChange={(value) => setLocalConfig(prev => ({ ...prev, defaultTransition: value }))}
                options={transitionOptions}
              />
            </div>

            {/* Max Image Size */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: spacing.xs,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                fontWeight: typography.fontWeight.medium
              }}>
                Max Image Size (MB)
              </label>
              <Input
                type="number"
                value={(localConfig.maxImageSize / (1024 * 1024)).toString()}
                onChange={(value) => setLocalConfig(prev => ({ 
                  ...prev, 
                  maxImageSize: (parseFloat(value.toString()) || 1) * 1024 * 1024 
                }))}
                min={1}
                max={50}
                step={1}
              />
            </div>
          </>
        );

      case 'gif':
        return (
          <>
            {/* GIF FPS */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing.xs
              }}>
                Frames per Second (FPS)
              </label>
              <Input
                type="number"
                value={localConfig.gif.fps.toString()}
                onChange={(value) => setLocalConfig(prev => ({
                  ...prev,
                  gif: { ...prev.gif, fps: parseInt(value.toString()) || 15 }
                }))}
                min={1}
                max={30}
                placeholder="15"
              />
            </div>

            {/* GIF Colors */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing.xs
              }}>
                Color Palette
              </label>
              <Select
                value={localConfig.gif.colors.toString()}
                onChange={(value) => setLocalConfig(prev => ({
                  ...prev,
                  gif: { ...prev.gif, colors: parseInt(value) }
                }))}
                options={[
                  { value: '64', label: '64 colors (smaller file)' },
                  { value: '128', label: '128 colors' },
                  { value: '256', label: '256 colors (best quality)' }
                ]}
              />
            </div>

            {/* GIF Loop */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing.xs
              }}>
                Loop Count
              </label>
              <Select
                value={localConfig.gif.loop ? 'infinite' : '1'}
                onChange={(value) => setLocalConfig(prev => ({
                  ...prev,
                  gif: { ...prev.gif, loop: value === 'infinite' }
                }))}
                options={[
                  { value: 'infinite', label: 'Infinite loop' },
                  { value: '1', label: 'Play once' },
                  { value: '3', label: 'Play 3 times' },
                  { value: '5', label: 'Play 5 times' }
                ]}
              />
            </div>

            {/* GIF Dithering */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  id="gif-dither"
                  checked={localConfig.gif.dithering}
                  onChange={(e) => setLocalConfig(prev => ({
                    ...prev,
                    gif: { ...prev.gif, dithering: e.target.checked }
                  }))}
                />
                Enable dithering (better color gradients)
              </label>
            </div>
          </>
        );

      case 'debug':
        return (
          <>
            {/* Debug Mode */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  id="debug-mode"
                  checked={localConfig.debugMode}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, debugMode: e.target.checked }))}
                />
                Enable debug mode
              </label>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.bg.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.bg.primary,
          border: `1px solid ${colors.border.primary}`,
          borderRadius: borderRadius.lg,
          padding: spacing.xl,
          width: '400px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          margin: 0,
          marginBottom: spacing.lg,
          fontSize: typography.fontSize.lg,
          color: colors.text.primary
        }}>
          Plugin Settings
        </h3>

        {/* Tabs */}
        <div style={{ marginBottom: spacing.lg }}>
          <TabGroup
            tabs={tabs}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {/* API URL */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.medium
            }}>
              API Base URL
            </label>
            <Input
              value={localConfig.apiBaseURL}
              onChange={(value) => setLocalConfig(prev => ({ ...prev, apiBaseURL: String(value) }))}
              placeholder="http://localhost:3001"
            />
          </div>

          {/* Default Duration */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.medium
            }}>
              Default Frame Duration (ms)
            </label>
            <Input
              type="number"
              value={localConfig.defaultDuration.toString()}
              onChange={(value) => setLocalConfig(prev => ({ 
                ...prev, 
                defaultDuration: parseInt(value.toString()) || 1000 
              }))}
              min={100}
              max={10000}
              step={100}
            />
          </div>

          {/* Default Transition */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.medium
            }}>
              Default Transition
            </label>
            <Select
              value={localConfig.defaultTransition}
              onChange={(value) => setLocalConfig(prev => ({ ...prev, defaultTransition: value }))}
              options={transitionOptions}
            />
          </div>

          {/* Max Image Size */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.medium
            }}>
              Max Image Size (MB)
            </label>
            <Input
              type="number"
              value={(localConfig.maxImageSize / (1024 * 1024)).toString()}
              onChange={(value) => setLocalConfig(prev => ({ 
                ...prev, 
                maxImageSize: (parseFloat(value.toString()) || 10) * 1024 * 1024 
              }))}
              min={1}
              max={50}
              step={1}
            />
          </div>

          {/* GIF Export Settings */}
          <div style={{ borderTop: `1px solid ${colors.border.primary}`, paddingTop: spacing.md, marginTop: spacing.md }}>
            <h4 style={{ 
              margin: `0 0 ${spacing.md} 0`, 
              fontSize: typography.fontSize.base, 
              fontWeight: 600, 
              color: colors.text.primary 
            }}>
              GIF Export Settings
            </h4>

            {/* GIF FPS */}
            <div style={{ marginBottom: spacing.md }}>
              <label style={{ 
                display: 'block', 
                fontSize: typography.fontSize.sm, 
                color: colors.text.secondary, 
                marginBottom: spacing.xs 
              }}>
                Frame Rate (FPS)
              </label>
              <Input
                value={localConfig.gif.fps.toString()}
                onChange={(value) => setLocalConfig(prev => ({ 
                  ...prev, 
                  gif: { ...prev.gif, fps: parseInt(value.toString()) || 15 }
                }))}
                placeholder="15"
                type="number"
                min={1}
                max={30}
              />
            </div>

            {/* GIF Colors */}
            <div style={{ marginBottom: spacing.md }}>
              <label style={{ 
                display: 'block', 
                fontSize: typography.fontSize.sm, 
                color: colors.text.secondary, 
                marginBottom: spacing.xs 
              }}>
                Colors
              </label>
              <Select
                value={localConfig.gif.colors.toString()}
                onChange={(value) => setLocalConfig(prev => ({ 
                  ...prev, 
                  gif: { ...prev.gif, colors: parseInt(value.toString()) || 256 }
                }))}
                options={[
                  { value: '64', label: '64 colors (smaller file)' },
                  { value: '128', label: '128 colors' },
                  { value: '256', label: '256 colors (best quality)' }
                ]}
              />
            </div>

            {/* GIF Loop */}
            <div style={{ marginBottom: spacing.md }}>
              <label style={{ 
                display: 'block', 
                fontSize: typography.fontSize.sm, 
                color: colors.text.secondary, 
                marginBottom: spacing.xs 
              }}>
                Loop Count
              </label>
              <Select
                value={localConfig.gif.loop.toString()}
                onChange={(value) => setLocalConfig(prev => ({ 
                  ...prev, 
                  gif: { ...prev.gif, loop: value === 'infinite' ? 'infinite' : parseInt(value.toString()) || 0 }
                }))}
                options={[
                  { value: 'infinite', label: 'Infinite loop' },
                  { value: '1', label: 'Play once' },
                  { value: '3', label: 'Play 3 times' },
                  { value: '5', label: 'Play 5 times' }
                ]}
              />
            </div>

            {/* GIF Dithering */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <input
                type="checkbox"
                id="gif-dither"
                checked={localConfig.gif.dither}
                onChange={(e) => setLocalConfig(prev => ({ 
                  ...prev, 
                  gif: { ...prev.gif, dither: e.target.checked }
                }))}
                style={{
                  accentColor: colors.accent.primary
                }}
              />
              <label 
                htmlFor="gif-dither"
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  cursor: 'pointer'
                }}
              >
                Enable dithering (better color gradients)
              </label>
            </div>
          </div>

          {/* Debug Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <input
              type="checkbox"
              id="debug-mode"
              checked={localConfig.debugMode}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, debugMode: e.target.checked }))}
              style={{
                accentColor: colors.accent.primary
              }}
            />
            <label 
              htmlFor="debug-mode"
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                cursor: 'pointer'
              }}
            >
              Enable debug mode
            </label>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: spacing.sm,
          marginTop: spacing.xl,
          justifyContent: 'flex-end'
        }}>
          <Button
            variant="secondary"
            size="base"
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="ghost"
            size="base"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="base"
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
