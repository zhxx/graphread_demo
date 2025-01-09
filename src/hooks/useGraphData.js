import { useState, useEffect } from 'react';
import initialGraph from '../data/initialGraph.json';

export const useGraphData = () => {
  const [currentGraph, setCurrentGraph] = useState(() => {
    try {
      const savedGraph = localStorage.getItem('graphData');
      return savedGraph ? JSON.parse(savedGraph) : initialGraph;
    } catch (error) {
      console.error('Error loading saved graph:', error);
      return initialGraph;
    }
  });

  const [isFirstInteraction, setIsFirstInteraction] = useState(() => {
    return !localStorage.getItem('graphData');
  });

  const updateGraph = (newGraphData) => {
    try {
      const newGraph = {
        nodes: [...currentGraph.nodes, ...newGraphData.nodes],
        links: [...currentGraph.links, ...newGraphData.links]
      }
      setCurrentGraph(newGraph);
      localStorage.setItem('graphData', JSON.stringify(newGraph));
      setIsFirstInteraction(false);
      console.log('Graph updated:', newGraph);
    } catch (error) {
      console.error('Error updating graph:', error);
    }
  };

  const resetGraph = () => {
    setCurrentGraph(initialGraph);
    localStorage.removeItem('graphData');
    setIsFirstInteraction(true);
  };

  useEffect(() => {
    console.log('Current graph data:', currentGraph);
  }, [currentGraph]);

  return {
    graphData: currentGraph,
    updateGraph,
    resetGraph,
    isFirstInteraction
  };
}; 