// File: src/components/VideoPlayer/HybridVideoPlayer.jsx
// A hybrid approach: Start with HTML5, fallback to Video.js if needed

import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from './VideoPlayer.module.css';

const HybridVideoPlayer = ({ 
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
  const containerRef = useRef(null);
  const initializingRef = useRef(false);
  const currentVideoUrl = useRef(null);
  
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useVideoJS, setUseVideoJS] = useState(false);

  // Try HTML5 first, fallback to Video.js if issues
  const initializeHTML5Player = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoData || initializingRef.current) return;

    // Check if we're already initialized with this video
    if (currentVideoUrl.current === videoData.url && isReady) {
      console.log(`HTML5 player already initialized with ${videoData.url}`);
      return;
    }

    console.log(`Initializing HTML5 player for ${videoType} with ${videoData.url}`);
    initializingRef.current = true;
    currentVideoUrl.current = videoData.url;
    setIsLoading(true);
    setHasError(false);
    setIsReady(false);

    // Set video source
    video.src = videoData.url;
    video.preload = 'metadata';
    video.playsInline = true;

    // Event handlers
    const handleLoadedData = () => {
      console.log(`HTML5 video loaded: ${videoType}`);
      setIsReady(true);
      setIsLoading(false);
      initializingRef.current = false;
      
      if (onLoadedData) {
        onLoadedData({
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
      }
    };

    const handleLoadedMetadata = () => {
      console.log(`HTML5 video metadata loaded: ${videoType}`);
      // Sometimes loadeddata doesn't fire, so we can also use loadedmetadata
      if (!isReady) {
        setIsReady(true);
        setIsLoading(false);
        initializingRef.current = false;
        
        if (onLoadedData) {
          onLoadedData({
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
        }
      }
    };

    const handleCanPlay = () => {
      console.log(`HTML5 video can play: ${videoType}`);
      // Fallback if other events don't fire
      if (!isReady) {
        setIsReady(true);
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    const handleTimeUpdate = () => {
      if (onTimeUpdate && (syncMode === 'independent' || !disabled)) {
        onTimeUpdate(video.currentTime, videoType);
      }
    };

    const handlePlay = () => {
      console.log(`HTML5 video playing: ${videoType}`);
      if (onPlay) onPlay(videoType);
    };

    const handlePause = () => {
      console.log(`HTML5 video paused: ${videoType}`);
      if (onPause) onPause(videoType);
    };

    const handleError = (e) => {
      console.error(`HTML5 video error for ${videoType}:`, e);
      console.error('Video error details:', video.error);
      console.log('Attempting to fallback to Video.js...');
      
      initializingRef.current = false;
      setIsLoading(false);
      
      // Try Video.js as fallback
      setUseVideoJS(true);
    };

    const handleLoadStart = () => {
      console.log(`HTML5 video load start: ${videoType}`);
      setIsLoading(true);
    };

    const handleProgress = () => {
      console.log(`HTML5 video progress: ${videoType}`, video.buffered.length);
    };

    const handleSuspend = () => {
      console.log(`HTML5 video suspended: ${videoType}`);
    };

    const handleStalled = () => {
      console.log(`HTML5 video stalled: ${videoType}`);
    };

    // Add event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('suspend', handleSuspend);
    video.addEventListener('stalled', handleStalled);

    // Load the video
    console.log(`Loading video for ${videoType}:`, videoData.url);
    video.load();

    // Timeout fallback in case events don't fire
    const loadTimeout = setTimeout(() => {
      if (initializingRef.current && !isReady) {
        console.warn(`Video load timeout for ${videoType}, trying fallback`);
        setUseVideoJS(true);
      }
    }, 10000); // 10 second timeout

    // Cleanup function
    return () => {
      clearTimeout(loadTimeout);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('suspend', handleSuspend);
      video.removeEventListener('stalled', handleStalled);
      initializingRef.current = false;
    };
  }, [videoData?.url, videoType, onTimeUpdate, onPlay, onPause, onLoadedData, syncMode, disabled, isReady]);

  // Initialize Video.js as fallback
  const initializeVideoJS = useCallback(async () => {
    if (!videoData || initializingRef.current) return;
    
    console.log(`Initializing Video.js fallback for ${videoType}`);
    initializingRef.current = true;
    
    try {
      // Dynamically import Video.js to avoid loading it unless needed
      const videojs = (await import('video.js')).default;
      await import('video.js/dist/video-js.css');

      const video = videoRef.current;
      if (!video) {
        initializingRef.current = false;
        return;
      }

      // Clear HTML5 attributes
      video.removeAttribute('src');
      video.className = 'video-js vjs-default-skin';

      const player = videojs(video, {
        controls: syncMode === 'independent',
        responsive: true,
        fluid: true,
        preload: 'metadata',
        sources: [{
          src: videoData.url,
          type: videoData.type || 'video/mp4'
        }]
      });

      // Store player reference globally for sync
      if (!window.videoPlayerControls) {
        window.videoPlayerControls = {};
      }
      
      window.videoPlayerControls[videoType] = {
        play: () => player.play(),
        pause: () => player.pause(),
        seek: (time) => player.currentTime(time),
        setPlaybackRate: (rate) => player.playbackRate(rate),
        getCurrentTime: () => player.currentTime(),
        getDuration: () => player.duration(),
        isPaused: () => player.paused()
      };

      player.on('loadeddata', () => {
        setIsReady(true);
        setIsLoading(false);
        initializingRef.current = false;
        
        if (onLoadedData) {
          onLoadedData({
            duration: player.duration(),
            videoWidth: player.videoWidth(),
            videoHeight: player.videoHeight()
          });
        }
      });

      player.on('error', (e) => {
        console.error(`Video.js error for ${videoType}:`, e);
        setHasError(true);
        setErrorMessage('Failed to load video with both HTML5 and Video.js');
        setIsLoading(false);
        initializingRef.current = false;
      });

    } catch (error) {
      console.error('Failed to load Video.js:', error);
      setHasError(true);
      setErrorMessage('Failed to load video player');
      setIsLoading(false);
      initializingRef.current = false;
    }
  }, [videoData, videoType, syncMode, onLoadedData]);

  // Initialize player based on mode
  useEffect(() => {
    if (!videoData) {
      setIsReady(false);
      currentVideoUrl.current = null;
      initializingRef.current = false;
      return;
    }

    // Only initialize if URL changed or we're switching player types
    if (currentVideoUrl.current !== videoData.url || useVideoJS) {
      if (useVideoJS) {
        initializeVideoJS();
      } else {
        const cleanup = initializeHTML5Player();
        return cleanup;
      }
    }
  }, [videoData?.url, useVideoJS, initializeHTML5Player, initializeVideoJS]);

  // Handle synchronized playback for HTML5
  useEffect(() => {
    if (useVideoJS || !isReady || syncMode === 'independent') return;

    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, isReady, syncMode, useVideoJS]);

  // Handle synchronized seeking for HTML5
  useEffect(() => {
    if (useVideoJS || !isReady || syncMode === 'independent') return;

    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }
  }, [currentTime, isReady, syncMode, useVideoJS]);

  // Handle playback rate for HTML5
  useEffect(() => {
    if (useVideoJS || !isReady) return;

    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackRate;
  }, [playbackRate, isReady, useVideoJS]);

  // Expose HTML5 controls to global registry
  useEffect(() => {
    if (useVideoJS || !isReady) return;

    const video = videoRef.current;
    if (!video) return;

    if (!window.videoPlayerControls) {
      window.videoPlayerControls = {};
    }
    
    window.videoPlayerControls[videoType] = {
      play: () => video.play(),
      pause: () => video.pause(),
      seek: (time) => { video.currentTime = time; },
      setPlaybackRate: (rate) => { video.playbackRate = rate; },
      getCurrentTime: () => video.currentTime,
      getDuration: () => video.duration,
      isPaused: () => video.paused
    };
  }, [isReady, videoType, useVideoJS]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.videoPlayerContainer}>
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Loading video...</p>
          <small style={{ marginTop: '8px', opacity: 0.7 }}>
            {useVideoJS ? 'Using Video.js player' : 'Using HTML5 player'}
          </small>
          {/* Debug button to force ready state */}
          <button 
            onClick={() => {
              console.log('Force ready clicked');
              setIsReady(true);
              setIsLoading(false);
              initializingRef.current = false;
            }}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Force Ready (Debug)
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className={styles.videoPlayerContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <p>{errorMessage}</p>
          <button 
            onClick={() => {
              setHasError(false);
              setUseVideoJS(!useVideoJS);
              currentVideoUrl.current = null;
            }}
            className={styles.retryButton}
          >
            Try {useVideoJS ? 'HTML5' : 'Video.js'} Player
          </button>
        </div>
      </div>
    );
  }

  // No video state
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

      {/* Player type indicator */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        zIndex: 10
      }}>
        {useVideoJS ? 'Video.js' : 'HTML5'}
      </div>

      {/* Video container */}
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          controls={syncMode === 'independent'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: 'var(--video-bg)'
          }}
          data-testid={`${videoType}-video`}
          playsInline
          preload="metadata"
        />
      </div>

      {/* Video metadata */}
      <div className={styles.videoMetadata}>
        <span className={styles.videoName}>{videoData.name}</span>
        <span className={styles.videoSize}>
          {(videoData.size / (1024 * 1024)).toFixed(2)} MB
        </span>
      </div>
    </div>
  );
};

export default HybridVideoPlayer;