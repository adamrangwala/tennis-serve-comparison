// File: src/components/VideoPlayer/VideoPlayer.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import styles from './VideoPlayer.module.css';

const VideoPlayer = ({ 
  videoData, 
  videoType = 'user',
  isPlaying = false,
  currentTime = 0,
  playbackRate = 1,
  syncMode = 'independent',
  onTimeUpdate,
  onPlay,
  onPause,
  onLoadedData,
  onError,
  disabled = false
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Video.js player options
  const videoJsOptions = {
    controls: syncMode === 'independent',
    responsive: true,
    fluid: true,
    playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    preload: 'metadata',
    poster: '', // We can add thumbnail generation later
    html5: {
      vhs: {
        overrideNative: true
      }
    },
    // Customize control bar
    controlBar: {
      volumePanel: {
        inline: false
      },
      playbackRateMenuButton: {
        playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]
      }
    }
  };

  // Initialize Video.js player
  const initializePlayer = useCallback(() => {
    if (!videoRef.current || !videoData || !containerRef.current) return;

    setIsLoading(true);
    setHasError(false);

    try {
      // Dispose existing player if it exists
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.warn('Error disposing player:', e);
        }
        playerRef.current = null;
      }

      // Create new Video.js player with error handling
      const player = videojs(videoRef.current, videoJsOptions, function() {
        console.log(`Video.js player ready for ${videoType}`);
        setIsReady(true);
        setIsLoading(false);
      });

      playerRef.current = player;

      // Set video source
      player.src({
        src: videoData.url,
        type: videoData.type
      });

      // Event listeners with error handling
      player.on('loadeddata', () => {
        console.log(`Video loaded: ${videoType}`);
        setIsLoading(false);
        if (onLoadedData) {
          try {
            onLoadedData({
              duration: player.duration(),
              videoWidth: player.videoWidth(),
              videoHeight: player.videoHeight()
            });
          } catch (e) {
            console.warn('Error in onLoadedData callback:', e);
          }
        }
      });

      player.on('timeupdate', () => {
        if (onTimeUpdate && !disabled) {
          try {
            onTimeUpdate(player.currentTime(), videoType);
          } catch (e) {
            console.warn('Error in onTimeUpdate callback:', e);
          }
        }
      });

      player.on('play', () => {
        console.log(`Video playing: ${videoType}`);
        onPlay && onPlay(videoType);
      });

      player.on('pause', () => {
        console.log(`Video paused: ${videoType}`);
        onPause && onPause(videoType);
      });

      player.on('error', (error) => {
        console.error(`Video error for ${videoType}:`, error);
        setHasError(true);
        setErrorMessage('Failed to load video. Please try a different file.');
        setIsLoading(false);
        onError && onError(error, videoType);
      });

      player.on('loadstart', () => {
        setIsLoading(true);
      });

      player.on('canplay', () => {
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error initializing Video.js player:', error);
      setHasError(true);
      setErrorMessage('Failed to initialize video player.');
      setIsLoading(false);
    }
  }, [videoData, videoType, syncMode, onTimeUpdate, onPlay, onPause, onLoadedData, onError, disabled]);

  // Initialize player when video data changes
  useEffect(() => {
    if (videoData) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializePlayer();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [videoData, initializePlayer]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          // Remove all event listeners first
          const player = playerRef.current;
          player.off('loadeddata');
          player.off('timeupdate');
          player.off('play');
          player.off('pause');
          player.off('error');
          player.off('loadstart');
          player.off('canplay');
          
          // Dispose player
          player.dispose();
        } catch (e) {
          console.warn('Error during player cleanup:', e);
        }
        playerRef.current = null;
      }
    };
  }, []);

  // Handle external playback control (for synchronized mode)
  useEffect(() => {
    if (!playerRef.current || !isReady || syncMode === 'independent') return;

    const player = playerRef.current;
    
    try {
      if (isPlaying && player.paused()) {
        player.play().catch(err => console.warn('Play failed:', err));
      } else if (!isPlaying && !player.paused()) {
        player.pause();
      }
    } catch (e) {
      console.warn('Error controlling playback:', e);
    }
  }, [isPlaying, isReady, syncMode]);

  // Handle external seek (for synchronized mode)
  useEffect(() => {
    if (!playerRef.current || !isReady || syncMode === 'independent') return;

    const player = playerRef.current;
    
    try {
      const playerCurrentTime = player.currentTime();
      
      // Only seek if there's a significant difference (avoid endless loops)
      if (Math.abs(playerCurrentTime - currentTime) > 0.1) {
        player.currentTime(currentTime);
      }
    } catch (e) {
      console.warn('Error seeking:', e);
    }
  }, [currentTime, isReady, syncMode]);

  // Handle playback rate changes
  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    const player = playerRef.current;
    try {
      if (player.playbackRate() !== playbackRate) {
        player.playbackRate(playbackRate);
      }
    } catch (e) {
      console.warn('Error setting playback rate:', e);
    }
  }, [playbackRate, isReady]);

  // Public methods for parent component control
  const playerControls = {
    play: () => {
      try {
        return playerRef.current?.play();
      } catch (e) {
        console.warn('Error in play control:', e);
      }
    },
    pause: () => {
      try {
        playerRef.current?.pause();
      } catch (e) {
        console.warn('Error in pause control:', e);
      }
    },
    seek: (time) => {
      try {
        playerRef.current?.currentTime(time);
      } catch (e) {
        console.warn('Error in seek control:', e);
      }
    },
    setPlaybackRate: (rate) => {
      try {
        playerRef.current?.playbackRate(rate);
      } catch (e) {
        console.warn('Error setting playback rate:', e);
      }
    },
    getCurrentTime: () => {
      try {
        return playerRef.current?.currentTime() || 0;
      } catch (e) {
        console.warn('Error getting current time:', e);
        return 0;
      }
    },
    getDuration: () => {
      try {
        return playerRef.current?.duration() || 0;
      } catch (e) {
        console.warn('Error getting duration:', e);
        return 0;
      }
    },
    isPaused: () => {
      try {
        return playerRef.current?.paused() || true;
      } catch (e) {
        console.warn('Error checking paused state:', e);
        return true;
      }
    }
  };

  // Expose controls to parent via callback
  useEffect(() => {
    if (isReady && window.videoPlayerControls) {
      window.videoPlayerControls[videoType] = playerControls;
    }
  }, [isReady, videoType]);

  // Render loading state
  if (isLoading) {
    return (
      <div className={styles.videoPlayerContainer}>
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (hasError) {
    return (
      <div className={styles.videoPlayerContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <p>{errorMessage}</p>
          <button 
            onClick={initializePlayer}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!videoData) {
    return (
      <div className={styles.videoPlayerContainer}>
        <div className={styles.noVideoState}>
          <div className={styles.noVideoIcon}>🎬</div>
          <p>No video uploaded</p>
          <span>{videoType === 'user' ? 'Upload your serve' : 'Select professional serve'}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${styles.videoPlayerContainer} ${disabled ? styles.disabled : ''}`}
    >
      {/* Sync mode indicator */}
      {syncMode === 'synchronized' && (
        <div className={styles.syncIndicator}>
          <span className={styles.syncIcon}>🔗</span>
          <span>Synced</span>
        </div>
      )}

      {/* Video element for Video.js */}
      <div 
        data-vjs-player
        className={styles.videoContainer}
      >
        <video
          ref={videoRef}
          className="video-js vjs-default-skin"
          data-testid={`${videoType}-video`}
          playsInline
          preload="metadata"
        />
      </div>

      {/* Video metadata display */}
      {videoData && (
        <div className={styles.videoMetadata}>
          <span className={styles.videoName}>{videoData.name}</span>
          <span className={styles.videoSize}>
            {(videoData.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;