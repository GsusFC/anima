import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface Frame {
  id: string;
  name: string;
  order: number;
  duration: number;
  transition: string;
  imageUrl: string;
  dimensions: {
    width: number;
    height: number;
  };
}

interface SlideshowData {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  frames: Frame[];
  settings: {
    totalDuration: number;
    autoPlay: boolean;
    loop: boolean;
    quality: string;
    format: string;
  };
  metadata: {
    source: string;
    pluginVersion: string;
    framesCount: number;
  };
}

const SlideshowViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [slideshow, setSlideshow] = useState<SlideshowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchSlideshow = async () => {
      try {
        console.log('🎬 Fetching slideshow data for ID:', id);
        const response = await fetch(`/api/slideshow/${id}`);
        const data = await response.json();
        
        if (data.success) {
          setSlideshow(data.slideshow);
          console.log('✅ Slideshow data loaded:', data.slideshow);
        } else {
          setError(data.error || 'Failed to load slideshow');
        }
      } catch (err) {
        console.error('❌ Error fetching slideshow:', err);
        setError('Failed to load slideshow data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSlideshow();
    }
  }, [id]);

  useEffect(() => {
    if (!slideshow || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const nextFrame = prev + 1;
        if (nextFrame >= slideshow.frames.length) {
          if (slideshow.settings.loop) {
            return 0;
          } else {
            setIsPlaying(false);
            return prev;
          }
        }
        return nextFrame;
      });
    }, slideshow.frames[currentFrame]?.duration || 3000);

    return () => clearInterval(interval);
  }, [slideshow, isPlaying, currentFrame]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFrameSelect = (frameIndex: number) => {
    setCurrentFrame(frameIndex);
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading slideshow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Slideshow</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!slideshow) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Slideshow Not Found</h2>
          <p className="text-gray-400">The requested slideshow could not be found.</p>
        </div>
      </div>
    );
  }

  const currentFrameData = slideshow.frames[currentFrame];

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pink-500">{slideshow.title}</h1>
            <p className="text-gray-400 text-sm">{slideshow.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {slideshow.frames.length} frames • Created from {slideshow.metadata.source}
            </span>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
            >
              ← Back to AnimaGen
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Slideshow Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl max-w-4xl w-full">
            {currentFrameData && (
              <img 
                src={currentFrameData.imageUrl}
                alt={currentFrameData.name}
                className="w-full h-auto"
                style={{ aspectRatio: '16/9' }}
              />
            )}
            
            {/* Frame Info Overlay */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 px-3 py-2 rounded-lg">
              <p className="text-white text-sm">
                {currentFrameData?.name} ({currentFrame + 1}/{slideshow.frames.length})
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={() => handleFrameSelect(Math.max(0, currentFrame - 1))}
              disabled={currentFrame === 0}
              className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            
            <button
              onClick={handlePlay}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            
            <button
              onClick={() => handleFrameSelect(Math.min(slideshow.frames.length - 1, currentFrame + 1))}
              disabled={currentFrame === slideshow.frames.length - 1}
              className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Sidebar - Frame List */}
        <div className="w-80 bg-dark-800 border-l border-dark-700 p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Frames</h3>
          <div className="space-y-2">
            {slideshow.frames.map((frame, index) => (
              <div
                key={frame.id}
                onClick={() => handleFrameSelect(index)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  index === currentFrame 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-dark-600 rounded overflow-hidden">
                    <img 
                      src={frame.imageUrl} 
                      alt={frame.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{frame.name}</p>
                    <p className="text-xs opacity-75">{frame.duration / 1000}s</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideshowViewer;
