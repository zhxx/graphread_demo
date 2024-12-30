import React, { useState, useRef } from 'react';
import KnowledgeGraph from '../components/KnowledgeGraph';
import ChatBox from '../components/ChatBox';
import { useGraphData } from '../hooks/useGraphData';

const AIChat = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const { graphData, updateGraph, isFirstInteraction } = useGraphData();
  const chatBoxRef = useRef(null);

  const handleQuestionSelect = (question) => {
    // 将问题传递给 ChatBox 组件
    if (chatBoxRef.current) {
      chatBoxRef.current.handleQuestionSelect(question);
    }
  };

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
          onQuestionSelect={handleQuestionSelect}
        />
      </div>
      <div style={{ width: '400px', borderLeft: '1px solid #eee' }}>
        <ChatBox
          ref={chatBoxRef}
          selectedNode={selectedNode}
          graphData={graphData}
          onGraphUpdate={updateGraph}
          isFirstInteraction={isFirstInteraction}
        />
      </div>
    </div>
  );
};

export default AIChat; 