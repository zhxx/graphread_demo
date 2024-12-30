import React from 'react';

function DebugPanel({ messages }) {
  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      width: '300px',
      height: '100vh',
      backgroundColor: '#f0f0f0',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <h3>Debug Panel</h3>
      {messages.map((msg, index) => (
        <div key={index} style={{
          marginBottom: '10px',
          padding: '10px',
          backgroundColor: 'white',
          borderRadius: '5px'
        }}>
          <div><strong>Sent:</strong> {JSON.stringify(msg.sent)}</div>
          <div><strong>Received:</strong> {JSON.stringify(msg.received)}</div>
          <div><strong>Timestamp:</strong> {new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  );
}

export default DebugPanel; 