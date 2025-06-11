// Step 4: Full working app without external components
import React, { useState } from 'react';

function App() {
  const [userVideo, setUserVideo] = useState(null);
  const [proVideo, setProVideo] = useState(null);

  const handleFileUpload = (file, type) => {
    if (!file || !file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    const videoData = {
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size
    };

    if (type === 'user') {
      setUserVideo(videoData);
    } else {
      setProVideo(videoData);
    }
  };

  const VideoSection = ({ title, video, onUpload, type }) => (
    <div style={{ 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      padding: '20px', 
      margin: '10px',
      flex: 1
    }}>
      <h2>{title}</h2>
      {video ? (
        <div>
          <video 
            src={video.url} 
            controls 
            style={{ width: '100%', maxHeight: '300px' }}
          />
          <p>{video.name}</p>
          <button onClick={() => type === 'user' ? setUserVideo(null) : setProVideo(null)}>
            Remove
          </button>
        </div>
      ) : (
        <div style={{ 
          border: '2px dashed #ccc', 
          padding: '40px', 
          textAlign: 'center' 
        }}>
          <input 
            type="file" 
            accept="video/*"
            onChange={(e) => handleFileUpload(e.target.files[0], type)}
          />
          <p>Upload {title.toLowerCase()}</p>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ 
        background: '#007bff', 
        color: 'white', 
        padding: '20px', 
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h1>Tennis Serve Comparison</h1>
        <p>Upload and compare tennis serves</p>
      </header>

      <div style={{ display: 'flex', gap: '20px' }}>
        <VideoSection 
          title="Your Serve" 
          video={userVideo} 
          onUpload={handleFileUpload}
          type="user"
        />
        <VideoSection 
          title="Professional Serve" 
          video={proVideo} 
          onUpload={handleFileUpload}
          type="pro"
        />
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        background: '#f8f9fa',
        textAlign: 'center'
      }}>
        <h3>Status</h3>
        <p>User Video: {userVideo ? '✅ Loaded' : '❌ Not uploaded'}</p>
        <p>Pro Video: {proVideo ? '✅ Loaded' : '❌ Not uploaded'}</p>
        {userVideo && proVideo && (
          <p style={{ color: 'green', fontWeight: 'bold' }}>
            🎉 Both videos loaded! Ready for comparison.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;