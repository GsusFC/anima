import { ConfigurationTemplate } from '../types/slideshow.types';

export const CONFIGURATION_TEMPLATES: ConfigurationTemplate[] = [
  {
    id: 'social-instagram',
    name: 'Instagram Stories',
    description: 'Optimized for Instagram Stories - 9:16 aspect ratio, short duration',
    exportSettings: {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1080, height: 1920, preset: 'Instagram Stories' },
      fps: 30
    },
    defaultDuration: 2000, // 2 seconds
    defaultTransition: { type: 'fade', duration: 300 }
  },
  {
    id: 'social-tiktok',
    name: 'TikTok/Reels',
    description: 'Perfect for TikTok and Instagram Reels - 9:16 vertical',
    exportSettings: {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1080, height: 1920, preset: 'TikTok/Reels' },
      fps: 30
    },
    defaultDuration: 1500, // 1.5 seconds
    defaultTransition: { type: 'slide', duration: 200 }
  },
  {
    id: 'presentation-hd',
    name: 'HD Presentation',
    description: 'High quality presentation format - 16:9 landscape',
    exportSettings: {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1920, height: 1080, preset: '1080p HD' },
      fps: 30
    },
    defaultDuration: 4000, // 4 seconds
    defaultTransition: { type: 'dissolve', duration: 500 }
  },
  {
    id: 'gif-social',
    name: 'Social GIF',
    description: 'Optimized GIF for social media sharing',
    exportSettings: {
      format: 'gif',
      quality: 'medium',
      resolution: { width: 800, height: 600, preset: 'Social GIF' },
      fps: 15
    },
    defaultDuration: 1000, // 1 second
    defaultTransition: { type: 'cut', duration: 0 }
  },
  {
    id: 'web-banner',
    name: 'Web Banner',
    description: 'Compact web banner format - optimized for loading speed',
    exportSettings: {
      format: 'webm',
      quality: 'medium',
      resolution: { width: 1200, height: 630, preset: 'Web Banner' },
      fps: 24
    },
    defaultDuration: 3000, // 3 seconds
    defaultTransition: { type: 'zoom', duration: 400 }
  },
  {
    id: 'custom',
    name: 'Custom Settings',
    description: 'Fully customizable export settings',
    exportSettings: {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1920, height: 1080, preset: 'Custom' },
      fps: 30
    },
    defaultDuration: 2000,
    defaultTransition: { type: 'fade', duration: 300 }
  }
];

export const getTemplateById = (id: string): ConfigurationTemplate | undefined => {
  return CONFIGURATION_TEMPLATES.find(template => template.id === id);
};

export const getTemplatesByFormat = (format: 'mp4' | 'gif' | 'webm'): ConfigurationTemplate[] => {
  return CONFIGURATION_TEMPLATES.filter(template => template.exportSettings.format === format);
};
