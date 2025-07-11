import { renderHook } from '@testing-library/react';
import { useExportValidation, ExportSettings } from '../useExportValidation';

describe('useExportValidation', () => {
  describe('GIF validation', () => {
    it('should show error for FPS > 50', () => {
      const settings: ExportSettings = {
        format: 'gif',
        fps: 60,
        quality: 'standard',
        resolution: { width: 640, height: 480 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(false);
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          type: 'error',
          field: 'fps',
          code: 'GIF_FPS_TOO_HIGH'
        })
      );
    });

    it('should show warning for FPS > 30', () => {
      const settings: ExportSettings = {
        format: 'gif',
        fps: 40,
        quality: 'standard',
        resolution: { width: 640, height: 480 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(true);
      expect(result.current.hasWarnings).toBe(true);
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          field: 'fps',
          code: 'GIF_FPS_HIGH'
        })
      );
    });

    it('should show warning for low FPS', () => {
      const settings: ExportSettings = {
        format: 'gif',
        fps: 5,
        quality: 'standard',
        resolution: { width: 640, height: 480 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(true);
      expect(result.current.hasWarnings).toBe(true);
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          field: 'fps',
          code: 'GIF_FPS_LOW'
        })
      );
    });

    it('should show error for invalid color count', () => {
      const settings: ExportSettings = {
        format: 'gif',
        fps: 24,
        quality: 'standard',
        resolution: { width: 640, height: 480 },
        gif: { colors: 300 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(false);
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          type: 'error',
          field: 'colors',
          code: 'GIF_COLORS_INVALID'
        })
      );
    });

    it('should show warning for high resolution', () => {
      const settings: ExportSettings = {
        format: 'gif',
        fps: 24,
        quality: 'standard',
        resolution: { width: 2560, height: 1440 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(true);
      expect(result.current.hasWarnings).toBe(true);
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          field: 'resolution',
          code: 'GIF_RESOLUTION_HIGH'
        })
      );
    });
  });

  describe('MP4 validation', () => {
    it('should show error for FPS > 60', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        fps: 120,
        quality: 'standard',
        resolution: { width: 1920, height: 1080 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(false);
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          type: 'error',
          field: 'fps',
          code: 'MP4_FPS_TOO_HIGH'
        })
      );
    });

    it('should show error for resolution too low', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        fps: 30,
        quality: 'standard',
        resolution: { width: 100, height: 100 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(false);
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          type: 'error',
          field: 'resolution',
          code: 'MP4_RESOLUTION_TOO_LOW'
        })
      );
    });

    it('should show error for resolution too high', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        fps: 30,
        quality: 'standard',
        resolution: { width: 5000, height: 5000 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(false);
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          type: 'error',
          field: 'resolution',
          code: 'MP4_RESOLUTION_TOO_HIGH'
        })
      );
    });
  });

  describe('WebM validation', () => {
    it('should validate similar to MP4', () => {
      const settings: ExportSettings = {
        format: 'webm',
        fps: 120,
        quality: 'standard',
        resolution: { width: 1920, height: 1080 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(false);
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          type: 'error',
          field: 'fps',
          code: 'WEBM_FPS_TOO_HIGH'
        })
      );
    });
  });

  describe('Valid configurations', () => {
    it('should pass validation for valid GIF settings', () => {
      const settings: ExportSettings = {
        format: 'gif',
        fps: 24,
        quality: 'standard',
        resolution: { width: 640, height: 480 },
        gif: { colors: 256 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(true);
      expect(result.current.hasErrors).toBe(false);
      expect(result.current.isValid).toBe(true);
    });

    it('should pass validation for valid MP4 settings', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        fps: 30,
        quality: 'high',
        resolution: { width: 1920, height: 1080 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(true);
      expect(result.current.hasErrors).toBe(false);
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('General validation', () => {
    it('should show warning for very low resolution', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        fps: 30,
        quality: 'standard',
        resolution: { width: 200, height: 200 }
      };

      const { result } = renderHook(() => useExportValidation(settings));

      expect(result.current.canExport).toBe(true);
      expect(result.current.hasWarnings).toBe(true);
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          field: 'resolution',
          code: 'RESOLUTION_LOW_QUALITY'
        })
      );
    });
  });
});
