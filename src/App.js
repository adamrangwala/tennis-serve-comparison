import React, { useState } from 'react';
import './styles/globals.css';
import './styles/variables.css';
import styles from './App.module.css';
import UploadControls from './components/UploadControls';

function App() {
  const [userVideo, setUserVideo] = useState(null);
  const [professionalVideo, setProfessionalVideo] = useState(null);

  const handleVideoUpload = (videoData, videoType) => {
    console.log('Video uploaded:', videoType, videoData);
    
    if (videoType === 'user') {
      setUserVideo(videoData);
    } else if (videoType === 'professional') {
      setProfessionalVideo(videoData);
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Tennis Serve Comparison</h1>
        <p>Analyze and compare tennis serves frame by frame</p>
      </header>
      
      <main className={styles.main}>
        <div className={styles.videoSection}>
          <div className={styles.videoContainer}>
            <h2>Your Serve</h2>
            <UploadControls
              onVideoUpload={handleVideoUpload}
              videoType="user"
              currentVideo={userVideo}
            />
          </div>
          
          <div className={styles.videoContainer}>
            <h2>Professional Serve</h2>
            <UploadControls
              onVideoUpload={handleVideoUpload}
              videoType="professional"
              currentVideo={professionalVideo}
            />
          </div>
        </div>
        
        <div className={styles.controlsSection}>
          <div className={styles.controlsPlaceholder}>
            <p>Video controls will appear here</p>
            {userVideo && <p>✅ User video: {userVideo.name}</p>}
            {professionalVideo && <p>✅ Professional video: {professionalVideo.name}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;