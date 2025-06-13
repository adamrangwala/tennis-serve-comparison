// File: src/components/VideoPlayer/SimpleVideoPlayer.jsx
// A simpler HTML5 video player without Video.js for testing

import React, { useRef, useEffect, useState } from 'react';
import styles from './VideoPlayer.module.css';

const SimpleVideoPlayer = ({ 
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
  const [duration, setDuration] = useState(0);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsReady(true);
      setDuration(video.duration);
      if (onLoadedData) {
        onLoadedData({
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
      }
    };

    const handleTimeUpdate = () => {
      if (onTimeUpdate && syncMode === 'independent') {
        onTimeUpdate(video.currentTime, videoType);
      }
    };

    const handlePlay = () => {
      if (onPlay) onPlay(videoType);
    };

    const handlePause = () => {
      if (onPause) onPause(videoType);
    };

    const handleError = (e) => {
      console.error('Video error:', e);
      if (onError) onError(e, videoType);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [videoData, onTimeUpdate, onPlay, onPause, onLoadedData, onError, syncMode, videoType]);

  // Handle synchronized playback
  useEffect(() => {
    if (syncMode === 'synchronized' && videoRef.current && isReady) {
      const video = videoRef.current;
      
      if (isPlaying && video.paused) {
        video.play().catch(console.error);
      } else if (!isPlaying && !video.paused) {
        video.pause();
      }
    }
  }, [isPlaying, syncMode, isReady]);

  // Handle synchronized seeking
  useEffect(() => {
    if (syncMode === 'synchronized' && videoRef.current && isReady) {
      const video = videoRef.current;
      
      if (Math.abs(video.currentTime - currentTime) > 0.1) {
        video.currentTime = currentTime;
      }
    }
  }, [currentTime, syncMode, isReady]);

  // Handle playback rate
  useEffect(() => {
    if (videoRef.current && isReady) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, isReady]);

  // Expose controls to global registry
  useEffect(() => {
    if (isReady && videoRef.current) {
      const video = videoRef.current;
      
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
    }
  }, [isReady, videoType]);

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

      {/* Simple HTML5 video */}
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          src={videoData.url}
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

      {/* Video metadata display */}
      <div className={styles.videoMetadata}>
        <span className={styles.videoName}>{videoData.name}</span>
        <span className={styles.videoSize}>
          {(videoData.size / (1024 * 1024)).toFixed(2)} MB
        </span>
      </div>
    </div>
  );
};

export default SimpleVideoPlayer;