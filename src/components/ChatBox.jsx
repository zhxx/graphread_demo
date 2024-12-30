import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './ChatBox.module.css';
import initialGraph from '../data/initialGraph.json';

const ChatBox = forwardRef(({ selectedNode, graphData, onGraphUpdate, isFirstInteraction }, ref) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.dify.ai/v1/chat-messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer app-UIYKBEEOpNk3KKlwv2diyWS8',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            node: selectedNode ? JSON.stringify(selectedNode) : "",
            query: input,
            outline: isFirstInteraction ? JSON.stringify(initialGraph) : JSON.stringify(graphData)
          },
          query: input,
          response_mode: "blocking",
          conversation_id: "",
          user: "user"
        })
      });

      const data = await response.json();

      if (data.answer) {
        try {
          const parsedResponse = JSON.parse(data.answer);

          // 提取纯文本内容
          let displayText = parsedResponse.text;

          // 找到第一个 { 或 [ 的位置，只保留之前的文本
          const jsonStartIndex = Math.min(
            displayText.indexOf('{') !== -1 ? displayText.indexOf('{') : Infinity,
            displayText.indexOf('[') !== -1 ? displayText.indexOf('[') : Infinity
          );

          if (jsonStartIndex !== Infinity) {
            displayText = displayText.substring(0, jsonStartIndex);
          }

          // 最终清理
          displayText = displayText.trim();

          // 只在有实际文本内容时显示
          if (displayText) {
            const assistantMessage = {
              type: 'assistant',
              content: displayText
            };
            setMessages(prev => [...prev, assistantMessage]);
          }

          // 更新图谱
          if (parsedResponse.graph) {
            onGraphUpdate(parsedResponse.graph);
          }
        } catch (e) {
          // 如果解析失败，尝试同样的方法处理原始响应
          let displayText = data.answer;
          const jsonStartIndex = Math.min(
            displayText.indexOf('{') !== -1 ? displayText.indexOf('{') : Infinity,
            displayText.indexOf('[') !== -1 ? displayText.indexOf('[') : Infinity
          );

          if (jsonStartIndex !== Infinity) {
            displayText = displayText.substring(0, jsonStartIndex);
          }

          displayText = displayText.trim();

          if (displayText) {
            const assistantMessage = {
              type: 'assistant',
              content: displayText
            };
            setMessages(prev => [...prev, assistantMessage]);
          }
        }
      }
    } catch (error) {
      console.error('Error calling Dify API:', error);
      const errorMessage = {
        type: 'assistant',
        content: '抱歉，发生了一些错误，请稍后再试。'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = async (question) => {
    if (!question.trim()) return;

    const userMessage = {
      type: 'user',
      content: question
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('https://api.dify.ai/v1/chat-messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer app-UIYKBEEOpNk3KKlwv2diyWS8',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            node: selectedNode ? JSON.stringify(selectedNode) : "",
            query: question,
            outline: isFirstInteraction ? JSON.stringify(initialGraph) : JSON.stringify(graphData)
          },
          query: question,
          response_mode: "blocking",
          conversation_id: "",
          user: "user"
        })
      });

      const data = await response.json();

      if (data.answer) {
        try {
          const parsedResponse = JSON.parse(data.answer);
          let displayText = parsedResponse.text;

          const jsonStartIndex = Math.min(
            displayText.indexOf('{') !== -1 ? displayText.indexOf('{') : Infinity,
            displayText.indexOf('[') !== -1 ? displayText.indexOf('[') : Infinity
          );

          if (jsonStartIndex !== Infinity) {
            displayText = displayText.substring(0, jsonStartIndex);
          }

          displayText = displayText.trim();

          if (displayText) {
            const assistantMessage = {
              type: 'assistant',
              content: displayText
            };
            setMessages(prev => [...prev, assistantMessage]);
          }

          if (parsedResponse.graph) {
            onGraphUpdate(parsedResponse.graph);
          }
        } catch (e) {
          let displayText = data.answer;
          const jsonStartIndex = Math.min(
            displayText.indexOf('{') !== -1 ? displayText.indexOf('{') : Infinity,
            displayText.indexOf('[') !== -1 ? displayText.indexOf('[') : Infinity
          );

          if (jsonStartIndex !== Infinity) {
            displayText = displayText.substring(0, jsonStartIndex);
          }

          displayText = displayText.trim();

          if (displayText) {
            const assistantMessage = {
              type: 'assistant',
              content: displayText
            };
            setMessages(prev => [...prev, assistantMessage]);
          }
        }
      }
    } catch (error) {
      console.error('Error calling Dify API:', error);
      const errorMessage = {
        type: 'assistant',
        content: '抱歉，发生了一些错误，请稍后再试。'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleQuestionSelect
  }));

  return (
    <div className={styles.chatBox}>
      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${message.type === 'user' ? styles.userMessage : styles.assistantMessage
              }`}
          >
            {message.type === 'assistant' ? (
              <ReactMarkdown className={styles.markdown}>
                {message.content}
              </ReactMarkdown>
            ) : (
              message.content
            )}
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.assistantMessage}`}>
            思考中...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入您的问题..."
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
        >
          发送
        </button>
      </div>
    </div>
  );
});

export default ChatBox; 