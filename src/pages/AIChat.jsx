import React, { useState } from 'react';
import KnowledgeGraph from '../components/KnowledgeGraph';
import ChatBox from '../components/ChatBox';
import graphData from '../data/initialGraph.json';

const AIChat = () => {
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      <div style={{ flex: '1', height: '100%' }}>
        <KnowledgeGraph 
          graphData={graphData} 
          onNodeSelect={setSelectedNode}
          selectedNode={selectedNode}
        />
      </div>
      <div style={{ width: '400px', borderLeft: '1px solid #eee' }}>
        <ChatBox selectedNode={selectedNode} />
      </div>
    </div>
  );
};

export default AIChat; 