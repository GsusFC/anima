import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius } from '../design-system/tokens';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Select } from '../design-system/Select';
import { TabGroup } from '../design-system/TabGroup';
import { Slider } from '../design-system/Slider';
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
    { value: 'video', label: 'Video (MP4 & WebM)' },
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

      case 'video':
        return (
          <>
            {/* Video FPS */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing.xs
              }}>
                Frames per Second (FPS)
              </label>
              <Select
                value={localConfig.video.fps.toString()}
                onChange={(value) => setLocalConfig(prev => ({
                  ...prev,
                  video: { ...prev.video, fps: parseInt(value) || 30 }
                }))}
                options={[
                  { value: '15', label: '15 fps (Low bandwidth)' },
                  { value: '24', label: '24 fps (Cinema)' },
                  { value: '30', label: '30 fps (Standard)' },
                  { value: '60', label: '60 fps (Smooth)' },
                  { value: '120', label: '120 fps (Ultra smooth)' }
                ]}
              />
            </div>

            {/* Video Quality */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing.xs
              }}>
                Quality (MP4 & WebM)
              </label>
              <Select
                value={localConfig.video.quality}
                onChange={(value) => setLocalConfig(prev => ({
                  ...prev,
                  video: { ...prev.video, quality: value as any }
                }))}
                options={[
                  { value: 'web', label: 'Web (smaller file)' },
                  { value: 'standard', label: 'Standard' },
                  { value: 'high', label: 'High (recommended)' },
                  { value: 'ultra', label: 'Ultra (larger file)' }
                ]}
              />
            </div>

            {/* Video Resolution */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing.xs
              }}>
                Resolution
              </label>
              <Select
                value={localConfig.video.resolution.preset}
                onChange={(value) => setLocalConfig(prev => ({
                  ...prev,
                  video: { 
                    ...prev.video, 
                    resolution: { 
                      preset: value as any,
                      ...(value === 'custom' ? { width: 1080, height: 1080 } : {})
                    }
                  }
                }))}
                options={[
                  { value: 'auto', label: 'Auto (match source)' },
                  { value: 'custom', label: 'Custom resolution' },
                  { value: '480p', label: '480p (854x480)' },
                  { value: '720p', label: '720p (1280x720)' },
                  { value: '1080p', label: '1080p (1920x1080)' }
                ]}
              />
            </div>

            {/* Custom Resolution Inputs */}
            {localConfig.video.resolution.preset === 'custom' && (
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs
                  }}>
                    Width
                  </label>
                  <Input
                    type="number"
                    value={localConfig.video.resolution.width?.toString() || '1920'}
                    onChange={(value) => setLocalConfig(prev => ({
                      ...prev,
                      video: { 
                        ...prev.video, 
                        resolution: { 
                          ...prev.video.resolution,
                          width: parseInt(value.toString()) || 1920
                        }
                      }
                    }))}
                    min={320}
                    max={4096}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs
                  }}>
                    Height
                  </label>
                  <Input
                    type="number"
                    value={localConfig.video.resolution.height?.toString() || '1080'}
                    onChange={(value) => setLocalConfig(prev => ({
                      ...prev,
                      video: { 
                        ...prev.video, 
                        resolution: { 
                          ...prev.video.resolution,
                          height: parseInt(value.toString()) || 1080
                        }
                      }
                    }))}
                    min={240}
                    max={2160}
                  />
                </div>
              </div>
            )}
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
              <Select
                value={localConfig.gif.fps.toString()}
                onChange={(value) => setLocalConfig(prev => ({
                  ...prev,
                  gif: { ...prev.gif, fps: parseInt(value) || 15 }
                }))}
                options={[
                  { value: '8', label: '8 fps (Very slow)' },
                  { value: '12', label: '12 fps (Slow)' },
                  { value: '15', label: '15 fps (Standard)' },
                  { value: '24', label: '24 fps (Smooth)' },
                  { value: '30', label: '30 fps (Very smooth)' }
                ]}
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

            {/* Dithering Section */}
            <div style={{
              borderTop: `1px solid ${colors.border.primary}`,
              paddingTop: spacing.md,
              marginTop: spacing.md
            }}>
              <h4 style={{
                margin: 0,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary
              }}>
                Dithering Settings
              </h4>

              {/* Enable Dithering */}
              <div style={{ marginBottom: spacing.md }}>
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
                    id="gif-dither-enabled"
                    checked={localConfig.gif.dithering.enabled}
                    onChange={(e) => setLocalConfig(prev => ({
                      ...prev,
                      gif: { 
                        ...prev.gif, 
                        dithering: { 
                          ...prev.gif.dithering, 
                          enabled: e.target.checked 
                        }
                      }
                    }))}
                  />
                  Enable dithering (improves color gradients)
                </label>
              </div>

              {/* Dithering Controls (only when enabled) */}
              {localConfig.gif.dithering.enabled && (
                <>
                  {/* Dithering Algorithm */}
                  <div style={{ marginBottom: spacing.md }}>
                    <label style={{
                      display: 'block',
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      marginBottom: spacing.xs
                    }}>
                      Dithering Algorithm
                    </label>
                    <Select
                      value={localConfig.gif.dithering.algorithm}
                      onChange={(value) => setLocalConfig(prev => ({
                        ...prev,
                        gif: { 
                          ...prev.gif, 
                          dithering: { 
                            ...prev.gif.dithering, 
                            algorithm: value as any 
                          }
                        }
                      }))}
                      options={[
                        { value: 'floyd-steinberg', label: 'Floyd-Steinberg (recommended)' },
                        { value: 'sierra', label: 'Sierra (smoother)' },
                        { value: 'atkinson', label: 'Atkinson (sharper)' },
                        { value: 'burkes', label: 'Burkes (balanced)' },
                        { value: 'stucki', label: 'Stucki (detailed)' },
                        { value: 'none', label: 'No dithering' }
                      ]}
                    />
                  </div>

                  {/* Dithering Intensity */}
                  <div style={{ marginBottom: spacing.md }}>
                    <label style={{
                      display: 'block',
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      marginBottom: spacing.xs
                    }}>
                      Dithering Intensity: {localConfig.gif.dithering.intensity}%
                    </label>
                    <Slider
                      value={localConfig.gif.dithering.intensity}
                      onChange={(value) => setLocalConfig(prev => ({
                        ...prev,
                        gif: { 
                          ...prev.gif, 
                          dithering: { 
                            ...prev.gif.dithering, 
                            intensity: value 
                          }
                        }
                      }))}
                      min={0}
                      max={100}
                      step={5}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: typography.fontSize.xs,
                      color: colors.text.tertiary,
                      marginTop: spacing.xs
                    }}>
                      <span>Subtle (0%)</span>
                      <span>Balanced (50%)</span>
                      <span>Strong (100%)</span>
                    </div>
                  </div>

                  {/* Serpentine Pattern */}
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
                        id="gif-dither-serpentine"
                        checked={localConfig.gif.dithering.serpentine}
                        onChange={(e) => setLocalConfig(prev => ({
                          ...prev,
                          gif: { 
                            ...prev.gif, 
                            dithering: { 
                              ...prev.gif.dithering, 
                              serpentine: e.target.checked 
                            }
                          }
                        }))}
                      />
                      Serpentine pattern (zigzag vs linear)
                    </label>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.tertiary,
                      marginTop: spacing.xs,
                      marginLeft: '20px'
                    }}>
                      Reduces visible patterns in dithered areas
                    </div>
                  </div>
                </>
              )}
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
          {renderTabContent()}
        </div>

        {/* Action buttons */}
        <div style={{ 
          display: 'flex', 
          gap: spacing.sm, 
          marginTop: spacing.xl,
          justifyContent: 'space-between'
        }}>
          <Button 
            variant="secondary" 
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button 
              variant="ghost" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
