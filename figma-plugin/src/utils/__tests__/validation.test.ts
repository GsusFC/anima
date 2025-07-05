import { validateTimeline, validateExportSettings, validateExportData } from '../validation';
import { TimelineItem, ImageFile, ExportSettings } from '../../types/slideshow.types';

describe('validation utils', () => {
  const mockImage: ImageFile = {
    id: 'img1',
    name: 'Test Image',
    file: new File([''], 'test.png', { type: 'image/png' }),
    size: 1000,
    preview: 'blob:test',
    addedAt: new Date(),
  };

  const mockTimelineItem: TimelineItem = {
    id: 'timeline1',
    imageId: 'img1',
    duration: 1000,
    position: 0,
    transition: { type: 'fade', duration: 500 },
  };

  describe('validateTimeline', () => {
    it('should pass validation for valid timeline', () => {
      const result = validateTimeline([mockTimelineItem], [mockImage]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for empty timeline', () => {
      const result = validateTimeline([], [mockImage]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Timeline is empty');
    });

    it('should fail for missing images', () => {
      const result = validateTimeline([mockTimelineItem], []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No images available');
    });

    it('should fail for timeline item with missing image', () => {
      const timelineWithBadRef: TimelineItem = {
        ...mockTimelineItem,
        imageId: 'nonexistent',
      };
      const result = validateTimeline([timelineWithBadRef], [mockImage]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('references missing image');
    });

    it('should warn about very short duration', () => {
      const shortDurationItem: TimelineItem = {
        ...mockTimelineItem,
        duration: 50,
      };
      const result = validateTimeline([shortDurationItem], [mockImage]);
      expect(result.warnings[0]).toContain('very short duration');
    });

    it('should warn about very long duration', () => {
      const longDurationItem: TimelineItem = {
        ...mockTimelineItem,
        duration: 15000,
      };
      const result = validateTimeline([longDurationItem], [mockImage]);
      expect(result.warnings[0]).toContain('very long duration');
    });
  });

  describe('validateExportSettings', () => {
    const validSettings: ExportSettings = {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1920, height: 1080, preset: '1080p' },
      fps: 30,
    };

    it('should pass validation for valid settings', () => {
      const result = validateExportSettings(validSettings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for invalid format', () => {
      const invalidSettings = { ...validSettings, format: 'invalid' };
      const result = validateExportSettings(invalidSettings as any);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid format');
    });

    it('should fail for invalid quality', () => {
      const invalidSettings = { ...validSettings, quality: 'invalid' };
      const result = validateExportSettings(invalidSettings as any);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid quality');
    });

    it('should fail for too small resolution', () => {
      const invalidSettings = {
        ...validSettings,
        resolution: { width: 50, height: 50, preset: 'custom' },
      };
      const result = validateExportSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Resolution too small');
    });

    it('should warn for very high resolution', () => {
      const highResSettings = {
        ...validSettings,
        resolution: { width: 8000, height: 6000, preset: 'custom' },
      };
      const result = validateExportSettings(highResSettings);
      expect(result.warnings[0]).toContain('Very high resolution');
    });

    it('should fail for invalid FPS', () => {
      const invalidSettings = { ...validSettings, fps: 150 };
      const result = validateExportSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('FPS must be between');
    });
  });

  describe('validateExportData', () => {
    const validSettings: ExportSettings = {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1920, height: 1080, preset: '1080p' },
      fps: 30,
    };

    const uploadedImage: ImageFile = {
      ...mockImage,
      uploadedInfo: { filename: 'uploaded.png', path: '/uploads/uploaded.png' },
    };

    it('should pass validation for complete export data', () => {
      const result = validateExportData(
        'session123',
        [mockTimelineItem],
        [uploadedImage],
        validSettings
      );
      expect(result.isValid).toBe(true);
    });

    it('should fail without session ID', () => {
      const result = validateExportData(
        '',
        [mockTimelineItem],
        [uploadedImage],
        validSettings
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No session ID available');
    });

    it('should fail for images not uploaded', () => {
      const result = validateExportData(
        'session123',
        [mockTimelineItem],
        [mockImage], // No uploadedInfo
        validSettings
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('images not uploaded');
    });
  });
});
