import React from 'react';

const Loading = ({ fullScreen = false }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: fullScreen ? '100vh' : '100%',
    backgroundColor: fullScreen ? 'rgba(0,0,0,0.5)' : 'transparent'
  }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export default Loading;