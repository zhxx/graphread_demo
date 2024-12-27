import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatBox.module.css';
import ReactMarkdown from 'react-markdown';

const ChatBox = ({ selectedNode }) => {
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
            query: input
          },
          query: input,
          response_mode: "blocking",
          conversation_id: "",
          user: "user"
        })
      });

      const data = await response.json();
      
      if (data.answer) {
        const assistantMessage = {
          type: 'assistant',
          content: data.answer.text || data.answer // 只获取文本内容
        };
        setMessages(prev => [...prev, assistantMessage]);
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

  return (
    <div className={styles.chatBox}>
      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${styles.message} ${
              message.type === 'user' ? styles.userMessage : styles.assistantMessage
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
};

export default ChatBox; 