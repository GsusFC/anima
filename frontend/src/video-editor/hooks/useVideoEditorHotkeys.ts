import { useHotkeys } from 'react-hotkeys-hook';
import { useVideoEditorContext } from '../context/VideoEditorContext';

interface UseVideoEditorHotkeysProps {
  onCreateSegment: () => void;
  onClearSegments: () => void;
  stepBackward: () => void;
  stepForward: () => void;
  jumpBackward: () => void;
  jumpForward: () => void;
  setZoom: (zoom: number) => void;
  zoom: number;
  onToggleHelp?: () => void;
}

export const useVideoEditorHotkeys = ({
  onCreateSegment,
  onClearSegments,
  stepBackward,
  stepForward,
  jumpBackward,
  jumpForward,
  setZoom,
  zoom,
  onToggleHelp
}: UseVideoEditorHotkeysProps) => {
  const { 
    togglePlayback, 
    seekTo, 
    videoDuration 
  } = useVideoEditorContext();

  // Playback controls
  useHotkeys('space', (e) => {
    e.preventDefault();
    togglePlayback();
  }, { enableOnFormTags: false });

  // Frame navigation
  useHotkeys('ArrowLeft', (e) => {
    e.preventDefault();
    stepBackward();
  }, { enableOnFormTags: false });

  useHotkeys('ArrowRight', (e) => {
    e.preventDefault();
    stepForward();
  }, { enableOnFormTags: false });

  // Jump navigation
  useHotkeys('shift+ArrowLeft', (e) => {
    e.preventDefault();
    jumpBackward();
  }, { enableOnFormTags: false });

  useHotkeys('shift+ArrowRight', (e) => {
    e.preventDefault();
    jumpForward();
  }, { enableOnFormTags: false });

  // Timeline navigation
  useHotkeys('Home', (e) => {
    e.preventDefault();
    seekTo(0);
  }, { enableOnFormTags: false });

  useHotkeys('End', (e) => {
    e.preventDefault();
    seekTo(videoDuration);
  }, { enableOnFormTags: false });

  // Segment management
  useHotkeys('s', (e) => {
    e.preventDefault();
    onCreateSegment();
  }, { enableOnFormTags: false });

  useHotkeys('shift+s', (e) => {
    e.preventDefault();
    onClearSegments();
  }, { enableOnFormTags: false });

  // Zoom controls
  useHotkeys('=', (e) => {
    e.preventDefault();
    setZoom(Math.min(4, zoom + 0.25));
  }, { enableOnFormTags: false });

  useHotkeys('-', (e) => {
    e.preventDefault();
    setZoom(Math.max(0.25, zoom - 0.25));
  }, { enableOnFormTags: false });

  useHotkeys('0', (e) => {
    e.preventDefault();
    setZoom(1);
  }, { enableOnFormTags: false });

  // Number keys for quick timeline navigation (1-9 = 10%-90%)
  useHotkeys('1', (e) => {
    e.preventDefault();
    seekTo(videoDuration * 0.1);
  }, { enableOnFormTags: false });

  useHotkeys('2', (e) => {
    e.preventDefault();
    seekTo(videoDuration * 0.2);
  }, { enableOnFormTags: false });

  useHotkeys('3', (e) => {
    e.preventDefault();
    seekTo(videoDuration * 0.3);
  }, { enableOnFormTags: false });

  useHotkeys('4', (e) => {
    e.preventDefault();
    seekTo(videoDuration * 0.4);
  }, { enableOnFormTags: false });

  useHotkeys('5', (e) => {
    e.preventDefault();
    seekTo(videoDuration * 0.5);
  }, { enableOnFormTags: false });

  useHotkeys('6', (e) => {
    e.preventDefault();
    seekTo(videoDuration * 0.6);
  }, { enableOnFormTags: false });

  useHotkeys('7', (e) => {
    e.preventDefault();
    seekTo(videoDuration * 0.7);
  }, { enableOnFormTags: false });

  useHotkeys('8', (e) => {
    e.preventDefault();
    seekTo(videoDuration * 0.8);
  }, { enableOnFormTags: false });

  useHotkeys('9', (e) => {
    e.preventDefault();
    seekTo(videoDuration * 0.9);
  }, { enableOnFormTags: false });

  // Help toggle
  useHotkeys('ctrl+/', (e) => {
    e.preventDefault();
    onToggleHelp?.();
  }, { enableOnFormTags: false });

  useHotkeys('?', (e) => {
    e.preventDefault();
    onToggleHelp?.();
  }, { enableOnFormTags: false });

  return {
    // Return the hotkey mappings for display in help
    hotkeys: {
      playback: [
        { key: 'Space', action: 'Play/Pause' },
        { key: '←/→', action: 'Step frame' },
        { key: 'Shift+←/→', action: 'Jump 5 seconds' },
        { key: 'Home/End', action: 'Go to start/end' },
        { key: '1-9', action: 'Jump to 10%-90%' }
      ],
      segments: [
        { key: 'S', action: 'Create segment' },
        { key: 'Shift+S', action: 'Clear segments' }
      ],
      zoom: [
        { key: '+/-', action: 'Zoom in/out' },
        { key: '0', action: 'Reset zoom' }
      ],
      help: [
        { key: '?', action: 'Show shortcuts' },
        { key: 'Ctrl+/', action: 'Show shortcuts' }
      ]
    }
  };
};
