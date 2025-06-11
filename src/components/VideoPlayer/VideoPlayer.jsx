// 1. Check your VideoPlayer component structure
// File: components/VideoPlayer/VideoPlayer.jsx

import React from 'react';
import styles from './VideoPlayer.module.css';

// Simple test component to verify imports work
const VideoPlayer = ({ videoData, videoType = 'user' }) => {
  console.log('VideoPlayer rendered:', { videoData: !!videoData, videoType });
  
  return (
    <div className={styles.videoPlayerContainer}>
      {!videoData ? (
        <div className={styles.noVideoState}>
          <div className={styles.noVideoIcon}>🎬</div>
          <p>No video uploaded - {videoType}</p>
        </div>
      ) : (
        <div className={styles.playerWrapper}>
          <video
            src={videoData.url}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          <p>Video loaded: {videoData.name}</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;