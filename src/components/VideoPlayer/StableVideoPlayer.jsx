// File: src/components/VideoPlayer/StableVideoPlayer.jsx
// A stable video player that prevents multiple initializations

import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from './VideoPlayer.module.css';

const StableVideoPlayer = ({ 
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
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);

  // Initialize video player
  const initializePlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoData) return;

    // Prevent re-initialization of the same video
    if (currentVideoUrl === videoData.url && isReady) {
      console.log(`Video already loaded for ${videoType}: ${videoData.url}`);
      return;
    }

    console.log(`Initializing video player for ${videoType}: ${videoData.name}`);
    setCurrentVideoUrl(videoData.url);
    setIsReady(false);
    setHasError(false);

    // Set video properties
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = false; // Allow sound
    video.controls = syncMode === 'independent';

    // Event handlers
    const handleLoadedData = () => {
      console.log(`Video loaded successfully: ${videoType}`);
      setIsReady(true);
      
      if (onLoadedData) {
        onLoadedData({
          duration: video.duration || 0,
          videoWidth: video.videoWidth || 0,
          videoHeight: video.videoHeight || 0
        });
      }
    };

    const handleTimeUpdate = () => {
      if (onTimeUpdate && !disabled) {
        onTimeUpdate(video.currentTime, videoType);
      }
    };

    const handlePlay = () => {
      console.log(`Video playing: ${videoType}`);
      if (onPlay) onPlay(videoType);
    };

    const handlePause = () => {
      console.log(`Video paused: ${videoType}`);
      if (onPause) onPause(videoType);
    };

    const handleError = (e) => {
      console.error(`Video error for ${videoType}:`, e);
      const error = video.error;
      console.error('Error details:', error);
      
      setHasError(true);
      setErrorMessage(`Failed to load video: ${error?.message || 'Unknown error'}`);
      
      if (onError) onError(e, videoType);
    };

    // Add event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    // Set source and load
    video.src = videoData.url;
    video.load();

    // Cleanup function
    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [videoData?.url, videoType, syncMode, onTimeUpdate, onPlay, onPause, onLoadedData, onError, disabled, currentVideoUrl, isReady]);

  // Initialize when video data changes
  useEffect(() => {
    if (!videoData) {
      setIsReady(false);
      setCurrentVideoUrl(null);
      return;
    }

    const cleanup = initializePlayer();
    return cleanup;
  }, [videoData?.url]); // Only depend on URL to prevent unnecessary re-runs

  // Handle synchronized playback
  useEffect(() => {
    if (!isReady || syncMode === 'independent') return;

    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, isReady, syncMode]);

  // Handle synchronized seeking
  useEffect(() => {
    if (!isReady || syncMode === 'independent') return;

    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - currentTime) > 0.2) {
      video.currentTime = currentTime;
    }
  }, [currentTime, isReady, syncMode]);

  // Handle playback rate
  useEffect(() => {
    if (!isReady) return;

    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackRate;
  }, [playbackRate, isReady]);

  // Expose controls to global registry
  useEffect(() => {
    if (!isReady) return;

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
  }, [isReady, videoType]);

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
              setCurrentVideoUrl(null);
              initializePlayer();
            }}
            className={styles.retryButton}
          >
            Retry
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
    <div className={`${styles.videoPlayerContainer} ${disabled ? styles.disabled : ''}`}>
      {/* Sync mode indicator */}
      {syncMode === 'synchronized' && (
        <div className={styles.syncIndicator}>
          <span className={styles.syncIcon}>🔗</span>
          <span>Synced</span>
        </div>
      )}

      {/* Ready indicator */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        backgroundColor: isReady ? 'rgba(40, 167, 69, 0.8)' : 'rgba(255, 193, 7, 0.8)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        zIndex: 10
      }}>
        {isReady ? '✅ Ready' : '⏳ Loading'}
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

export default StableVideoPlayer;