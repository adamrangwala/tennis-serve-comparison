// File: src/App.js
import React, { useState, useCallback, useEffect } from 'react';
import './styles/globals.css';
import './styles/variables.css';
// Use the stable working player
import VideoPlayer from './components/VideoPlayer/StableVideoPlayer';
// import VideoPlayer from './components/VideoPlayer/DiagnosticVideoPlayer'; // For debugging
// import VideoPlayer from './components/VideoPlayer/HybridVideoPlayer';
// import VideoPlayer from './components/VideoPlayer/VideoPlayer'; // Full Video.js
// import VideoPlayer from './components/VideoPlayer/SimpleVideoPlayer'; // Simple HTML5
import UploadControls from './components/UploadControls/UploadControls';
import VideoService from './services/VideoService';
import logger from './utils/logger';

function App() {
  const [userVideo, setUserVideo] = useState(null);
  const [proVideo, setProVideo] = useState(null);
  const [syncMode, setSyncMode] = useState('independent');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoDurations, setVideoDurations] = useState({ user: 0, professional: 0 });
  const [syncStatus, setSyncStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle video upload with metadata extraction
  const handleVideoUpload = useCallback(async (videoData, type) => {
    if (!videoData) {
      // Handle video removal
      if (type === 'user') {
        if (userVideo?.url) {
          URL.revokeObjectURL(userVideo.url);
        }
        setUserVideo(null);
      } else {
        if (proVideo?.url) {
          URL.revokeObjectURL(proVideo.url);
        }
        setProVideo(null);
      }
      return;
    }

    setIsLoading(true);

    try {
      // Validate video file
      const validation = VideoService.validateVideoFile(videoData.file);
      if (!validation.isValid) {
        alert(`Invalid video file: ${validation.errors.join(', ')}`);
        // Clean up the blob URL if validation fails
        if (videoData.url) {
          URL.revokeObjectURL(videoData.url);
        }
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Video warnings:', validation.warnings);
      }

      // Extract metadata
      const metadata = await VideoService.extractVideoMetadata(videoData.file);
      
      // Generate thumbnail
      const thumbnail = await VideoService.generateThumbnail(videoData.file);

      const enrichedVideoData = {
        ...videoData,
        metadata,
        thumbnail,
        uploadedAt: new Date().toISOString()
      };

      // Clean up old video URL before setting new one
      if (type === 'user') {
        if (userVideo?.url && userVideo.url !== videoData.url) {
          URL.revokeObjectURL(userVideo.url);
        }
        setUserVideo(enrichedVideoData);
        logger.log('User video uploaded:', enrichedVideoData);
      } else {
        if (proVideo?.url && proVideo.url !== videoData.url) {
          URL.revokeObjectURL(proVideo.url);
        }
        setProVideo(enrichedVideoData);
        logger.log('Professional video uploaded:', enrichedVideoData);
      }

    } catch (error) {
      console.error('Error processing video:', error);
      alert('Error processing video file. Please try again.');
      // Clean up the blob URL on error
      if (videoData.url) {
        URL.revokeObjectURL(videoData.url);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userVideo?.url, proVideo?.url]);

  // Handle video player events
  const handleVideoPlay = useCallback((videoType) => {
    logger.log(`Video play event from ${videoType}`);
    
    if (syncMode === 'synchronized') {
      setIsPlaying(true);
      // The VideoService will handle synchronized playback
    }
  }, [syncMode]);

  const handleVideoPause = useCallback((videoType) => {
    logger.log(`Video pause event from ${videoType}`);
    
    if (syncMode === 'synchronized') {
      setIsPlaying(false);
    }
  }, [syncMode]);

  const handleTimeUpdate = useCallback((time, videoType) => {
    if (syncMode === 'synchronized') {
      setCurrentTime(time);
      
      // Check sync status periodically
      const status = VideoService.getSyncStatus();
      if (status) {
        setSyncStatus(status);
      }
    }
  }, [syncMode]);

  const handleVideoLoadedData = useCallback((metadata, videoType) => {
    logger.log(`Video loaded data for ${videoType}:`, metadata);
    
    setVideoDurations(prev => ({
      ...prev,
      [videoType]: metadata.duration
    }));
  }, []);

  const handleVideoError = useCallback((error, videoType) => {
    console.error(`Video error for ${videoType}:`, error);
  }, []);

  // Sync mode toggle
  const toggleSyncMode = useCallback(() => {
    const newSyncMode = syncMode === 'independent' ? 'synchronized' : 'independent';
    setSyncMode(newSyncMode);
    
    if (newSyncMode === 'synchronized') {
      VideoService.enableSync('user'); // Default to user as master
      logger.log('Sync mode enabled');
    } else {
      VideoService.disableSync();
      setIsPlaying(false);
      setCurrentTime(0);
      setSyncStatus(null);
      logger.log('Sync mode disabled');
    }
  }, [syncMode]);

  // Synchronized playback controls
  const handleSyncPlay = useCallback(async () => {
    if (syncMode === 'synchronized' && VideoService.areVideosReady()) {
      setIsPlaying(true);
      await VideoService.syncPlay();
    }
  }, [syncMode]);

  const handleSyncPause = useCallback(() => {
    if (syncMode === 'synchronized') {
      setIsPlaying(false);
      VideoService.syncPause();
    }
  }, [syncMode]);

  const handleSyncSeek = useCallback((time) => {
    if (syncMode === 'synchronized') {
      setCurrentTime(time);
      VideoService.syncSeek(time);
    }
  }, [syncMode]);

  const handlePlaybackRateChange = useCallback((rate) => {
    setPlaybackRate(rate);
    if (syncMode === 'synchronized') {
      VideoService.syncPlaybackRate(rate);
    }
  }, [syncMode]);

  // Frame stepping
  const handleFrameStep = useCallback((direction) => {
    if (syncMode === 'synchronized' && VideoService.areVideosReady()) {
      VideoService.stepFrame(direction, 30); // Assuming 30fps
    }
  }, [syncMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (syncMode !== 'synchronized' || !VideoService.areVideosReady()) return;

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isPlaying) {
            handleSyncPause();
          } else {
            handleSyncPlay();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handleFrameStep('backward');
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleFrameStep('forward');
          break;
        case 'ArrowUp':
          event.preventDefault();
          handlePlaybackRateChange(Math.min(2, playbackRate + 0.25));
          break;
        case 'ArrowDown':
          event.preventDefault();
          handlePlaybackRateChange(Math.max(0.25, playbackRate - 0.25));
          break;
        case 'KeyS':
          event.preventDefault();
          toggleSyncMode();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [syncMode, isPlaying, playbackRate, handleSyncPlay, handleSyncPause, handleFrameStep, handlePlaybackRateChange, toggleSyncMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      VideoService.cleanup();
      // Only revoke URLs when component is actually unmounting
      if (userVideo?.url) {
        URL.revokeObjectURL(userVideo.url);
      }
      if (proVideo?.url) {
        URL.revokeObjectURL(proVideo.url);
      }
    };
  }, []); // Empty dependency array - only run on unmount

  const bothVideosLoaded = userVideo && proVideo;
  const maxDuration = Math.max(videoDurations.user, videoDurations.professional);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
        color: 'white',
        padding: 'var(--spacing-lg) var(--spacing-md)',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: 'var(--spacing-sm)',
          fontWeight: 600
        }}>
          Tennis Serve Comparison
        </h1>
        <p style={{ opacity: 0.9, fontSize: '1.125rem' }}>
          Analyze and compare tennis serves frame by frame
        </p>
      </header>

      <main style={{
        flex: 1,
        padding: 'var(--spacing-lg)',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Video Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
          minHeight: '400px'
        }}>
          {/* User Video Section */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--spacing-lg)',
            boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)',
              fontSize: '1.25rem',
              textAlign: 'center'
            }}>
              Your Serve
            </h2>
            
            {userVideo ? (
              <VideoPlayer
                videoData={userVideo}
                videoType="user"
                isPlaying={isPlaying}
                currentTime={currentTime}
                playbackRate={playbackRate}
                syncMode={syncMode}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onLoadedData={(metadata) => handleVideoLoadedData(metadata, 'user')}
                onError={handleVideoError}
              />
            ) : (
              <UploadControls
                onVideoUpload={handleVideoUpload}
                videoType="user"
                disabled={isLoading}
              />
            )}
          </div>

          {/* Professional Video Section */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--spacing-lg)',
            boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)',
              fontSize: '1.25rem',
              textAlign: 'center'
            }}>
              Professional Serve
            </h2>
            
            {proVideo ? (
              <VideoPlayer
                videoData={proVideo}
                videoType="professional"
                isPlaying={isPlaying}
                currentTime={currentTime}
                playbackRate={playbackRate}
                syncMode={syncMode}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onLoadedData={(metadata) => handleVideoLoadedData(metadata, 'professional')}
                onError={handleVideoError}
              />
            ) : (
              <UploadControls
                onVideoUpload={handleVideoUpload}
                videoType="professional"
                disabled={isLoading}
              />
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius)',
          padding: 'var(--spacing-lg)',
          boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
        }}>
          <h3 style={{ 
            marginBottom: 'var(--spacing-lg)',
            color: 'var(--text-primary)',
            fontSize: '1.25rem',
            textAlign: 'center'
          }}>
            Playback Controls
          </h3>

          {/* Sync Mode Toggle */}
          <div style={{
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-lg)',
            backgroundColor: 'var(--bg-accent)',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <button 
              onClick={toggleSyncMode}
              disabled={!bothVideosLoaded}
              style={{
                backgroundColor: syncMode === 'synchronized' ? 'var(--success-color)' : 'var(--primary-color)',
                color: 'white',
                border: 'none',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                borderRadius: 'var(--border-radius)',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: bothVideosLoaded ? 'pointer' : 'not-allowed',
                opacity: bothVideosLoaded ? 1 : 0.6,
                transition: 'all 0.2s ease',
                marginBottom: 'var(--spacing-sm)'
              }}
            >
              {syncMode === 'synchronized' ? '🔗 Synchronized' : '🔓 Independent'}
            </button>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              margin: 0
            }}>
              {syncMode === 'synchronized' 
                ? 'Videos play together in perfect sync' 
                : 'Videos play independently with individual controls'
              }
            </p>
          </div>

          {/* Synchronized Controls */}
          {syncMode === 'synchronized' && bothVideosLoaded && (
            <div style={{
              marginBottom: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <button 
                  onClick={() => handleFrameStep('backward')}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'calc(var(--border-radius) / 2)',
                    padding: 'var(--spacing-sm)',
                    cursor: 'pointer',
                    fontSize: '1.25rem'
                  }}
                  title="Previous Frame (←)"
                >
                  ⏮
                </button>
                
                <button 
                  onClick={isPlaying ? handleSyncPause : handleSyncPlay}
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'calc(var(--border-radius) / 2)',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    cursor: 'pointer',
                    fontSize: '1.125rem',
                    fontWeight: '500'
                  }}
                  title="Play/Pause (Space)"
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                
                <button 
                  onClick={() => handleFrameStep('forward')}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'calc(var(--border-radius) / 2)',
                    padding: 'var(--spacing-sm)',
                    cursor: 'pointer',
                    fontSize: '1.25rem'
                  }}
                  title="Next Frame (→)"
                >
                  ⏭
                </button>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <input
                  type="range"
                  min="0"
                  max={maxDuration || 100}
                  value={currentTime}
                  onChange={(e) => handleSyncSeek(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'var(--border-color)',
                    outline: 'none'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginTop: 'var(--spacing-xs)'
                }}>
                  <span>{VideoService.formatTime(currentTime)}</span>
                  <span>{VideoService.formatTime(maxDuration)}</span>
                </div>
              </div>

              {/* Playback Rate */}
              <div style={{ textAlign: 'center' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  Playback Speed: {playbackRate}x
                </label>
                <input
                  type="range"
                  min="0.25"
                  max="2"
                  step="0.25"
                  value={playbackRate}
                  onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                  style={{
                    width: '200px',
                    height: '4px'
                  }}
                />
              </div>

              {/* Sync Status */}
              {syncStatus && (
                <div style={{
                  marginTop: 'var(--spacing-md)',
                  padding: 'var(--spacing-sm)',
                  backgroundColor: syncStatus.inSync ? 'var(--success-color)' : 'var(--warning-color)',
                  color: 'white',
                  borderRadius: 'calc(var(--border-radius) / 2)',
                  fontSize: '0.75rem',
                  textAlign: 'center'
                }}>
                  {syncStatus.inSync ? '✅ Videos in sync' : `⚠ Out of sync by ${syncStatus.timeDifference.toFixed(2)}s`}
                </div>
              )}
            </div>
          )}

          {/* Keyboard Shortcuts Help */}
          {syncMode === 'synchronized' && bothVideosLoaded && (
            <div style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--bg-accent)',
              borderRadius: 'var(--border-radius)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              <strong>Keyboard Shortcuts:</strong> Space (Play/Pause) | ← → (Frame Step) | ↑ ↓ (Speed) | S (Toggle Sync)
            </div>
          )}

          {/* Status Information */}
          <div style={{
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)',
            marginTop: 'var(--spacing-md)'
          }}>
            {userVideo && (
              <p style={{ 
                margin: 'var(--spacing-xs) 0',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                ✅ User video: {userVideo.name} ({VideoService.formatTime(videoDurations.user)})
              </p>
            )}
            {proVideo && (
              <p style={{ 
                margin: 'var(--spacing-xs) 0',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                ✅ Professional video: {proVideo.name} ({VideoService.formatTime(videoDurations.professional)})
              </p>
            )}
            {!bothVideosLoaded && (
              <p style={{ 
                margin: 'var(--spacing-xs) 0',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                Upload both videos to enable comparison features
              </p>
            )}
            {bothVideosLoaded && (
              <p style={{ 
                margin: 'var(--spacing-xs) 0',
                color: 'var(--success-color)',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}>
                🎉 Ready for comparison analysis!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;