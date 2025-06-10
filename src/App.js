import React from 'react';
import './styles/globals.css';
import './styles/variables.css';
import styles from './App.module.css';

function App() {
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
            <div className={styles.videoPlaceholder}>
              <p>Upload your serve video</p>
            </div>
          </div>
          
          <div className={styles.videoContainer}>
            <h2>Professional Serve</h2>
            <div className={styles.videoPlaceholder}>
              <p>Upload professional serve video</p>
            </div>
          </div>
        </div>
        
        <div className={styles.controlsSection}>
          <div className={styles.controlsPlaceholder}>
            <p>Video controls will appear here</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;