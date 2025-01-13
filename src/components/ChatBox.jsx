import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import ReactMarkdown from "react-markdown";
import styles from "./ChatBox.module.css";
import initialGraph from "../data/initialGraph.json";

const ChatBox = forwardRef(
  ({ selectedNode, graphData, onGraphUpdate, isFirstInteraction }, ref) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
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
        type: "user",
        content: input,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      console.log("Sending request to Dify:", input);
      try {
        const response = await fetch("https://api.dify.ai/v1/workflows/run", {
          method: "POST",
          headers: {
            Authorization: "Bearer app-OTatgvfBNrDdbyPIUWBtmlEf",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {
              node: selectedNode ? JSON.stringify(selectedNode) : "",
              user_query: input,
              outline: graphData
                ? JSON.stringify(graphData)
                : JSON.stringify(initialGraph),
            },
            response_mode: "blocking",
            user: "user",
          }),
        });

        const data = await response.json();
        console.log("Dify response:", data);
        if (data?.data?.outputs) {
          const { json, text: displayText } = data.data.outputs;
          const graph = JSON.parse(json);
          console.log("=====>>>>>", graph, displayText);
          if (displayText) {
            const assistantMessage = {
              type: "assistant",
              content: displayText,
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
          if (graph && graph.links[0].source) {
            onGraphUpdate(graph);
          }
        }
      } catch (error) {
        console.error("Error calling Dify API:", error);
        const errorMessage = {
          type: "assistant",
          content: "抱歉，发生了一些错误，请稍后再试。",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    const handleQuestionSelect = async (question) => {
      if (!question.trim()) return;

      const userMessage = {
        type: "user",
        content: question,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch("https://api.dify.ai/v1/workflows/run", {
          method: "POST",
          headers: {
            Authorization: "Bearer app-OTatgvfBNrDdbyPIUWBtmlEf", //
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {
              node: selectedNode ? JSON.stringify(selectedNode) : "",
              user_query: question,
              outline: graphData
                ? JSON.stringify(graphData)
                : JSON.stringify(initialGraph),
            },
            response_mode: "blocking",
            user: "user",
          }),
        });

        const data = await response.json();
        console.log("Dify response:", data);
        if (data?.data?.outputs) {
          const { json, text: displayText } = data.data.outputs;
          const graph = JSON.parse(json);
          console.log("=====>>>>>", graph, displayText);
          if (displayText) {
            const assistantMessage = {
              type: "assistant",
              content: displayText,
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
          if (graph) {
            onGraphUpdate(graph);
          }
        }
      } catch (error) {
        console.error("Error calling Dify API:", error);
        const errorMessage = {
          type: "assistant",
          content: "抱歉，发生了一些错误，请稍后再试。",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      handleQuestionSelect,
    }));

    return (
      <div className={styles.chatBox}>
        <div className={styles.messagesContainer}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                message.type === "user"
                  ? styles.userMessage
                  : styles.assistantMessage
              }`}
            >
              {message.type === "assistant" ? (
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
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="输入您的问题..."
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading}>
            发送
          </button>
        </div>
      </div>
    );
  }
);

export default ChatBox;
