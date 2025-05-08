import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./App.css";
import ReportPopup from "./ReportPopup";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hi, welcome to the AI Business Acceleration Discovery. If you answer a few questions for me, I can evaluate the areas of your business that could benefit from using AI! This should take 5-10 mins. Let me know if you are ready and we can get started. Otherwise, if you have any more questions, feel free to ask.",
      sender: "bot",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [exampleAnswers, setExampleAnswers] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [borderGlowData, setBorderGlowData] = useState({
    isActive: false,
    border: null,
    position: 0,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatBoxRef = useRef(null);
  const circleTextRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!chatBoxRef.current) return;

      const box = chatBoxRef.current.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;

      setMousePosition({ x, y });

      const distToLeft = x;
      const distToRight = box.width - x;
      const distToTop = y;
      const distToBottom = box.height - y;

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      const borderThreshold = 50;

      if (minDist < borderThreshold) {
        let closestBorder;
        let relativePosition;

        if (minDist === distToLeft) {
          closestBorder = "left";
          relativePosition = y / box.height;
        } else if (minDist === distToRight) {
          closestBorder = "right";
          relativePosition = y / box.height;
        } else if (minDist === distToTop) {
          closestBorder = "top";
          relativePosition = x / box.width;
        } else {
          closestBorder = "bottom";
          relativePosition = x / box.width;
        }

        setBorderGlowData({
          isActive: true,
          border: closestBorder,
          position: relativePosition,
        });
      } else {
        setBorderGlowData({
          isActive: false,
          border: null,
          position: 0,
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const textElement = circleTextRef.current;
    if (!textElement) return;

    const text = textElement.textContent || "ROTATING CIRCLE TEXT";
    const characters = text.split("");
    const radius = 30;
    const angleIncrement = 360 / characters.length;

    textElement.innerHTML = "";

    characters.forEach((char, index) => {
      const span = document.createElement("span");
      span.textContent = char === " " ? "\u00A0" : char;
      const angle = angleIncrement * index;
      span.style.transform = `rotate(${angle}deg) translate(0, -${radius}px)`;
      textElement.appendChild(span);
    });
  }, []);

  const sendToWebhook = async (data) => {
    const response = await fetch(
      "https://balmer.app.n8n.cloud/webhook/68b7569f-058a-47b8-9ce9-39ff92328ad7/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return response.json();
  };

  const getLastBotMessage = () => {
    const lastBotMessage = messages
      .filter((msg) => msg.sender === "bot")
      .slice(-1)[0]?.text || "";
    return lastBotMessage;
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    setMessages((prev) => [...prev, { text: userInput, sender: "user" }]);
    setUserInput("");
    setExampleAnswers([]);
    setIsTyping(true);

    const question = getLastBotMessage();
    const webhookData = await sendToWebhook({
      userInput,
      sessionId,
      question,
    });

    setIsTyping(false);

    if (webhookData.output) {
      if (webhookData.report === false) {
        setMessages((prev) => [...prev, { text: webhookData.output, sender: "bot" }]);
      }

      if (webhookData.example_answers) {
        setExampleAnswers(webhookData.example_answers);
      }

      if (webhookData.report === true && webhookData.output && webhookData.agents) {
        setReportData({ output: webhookData.output, agents: webhookData.agents });
        setMessages((prev) => [
          ...prev,
          { text: "Your report is ready! Click 'View Report' to see it.", sender: "bot" },
        ]);
      }
    }

    inputRef.current.focus();
  };

  const handleExampleAnswerClick = async (answer) => {
    setMessages((prev) => [...prev, { text: answer, sender: "user" }]);
    setUserInput("");
    setExampleAnswers([]);
    setIsTyping(true);

    const question = getLastBotMessage();
    const webhookData = await sendToWebhook({
      userInput: answer,
      sessionId,
      question,
    });

    setIsTyping(false);

    if (webhookData.output) {
      setMessages((prev) => [...prev, { text: webhookData.output, sender: "bot" }]);

      if (webhookData.example_answers) {
        setExampleAnswers(webhookData.example_answers);
      }

      if (webhookData.report === true && webhookData.output && webhookData.agents) {
        setReportData({ output: webhookData.output, agents: webhookData.agents });
        setMessages((prev) => [
          ...prev,
          { text: "Your report is ready! Click 'View Report' to see it.", sender: "bot" },
        ]);
      }
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const handleViewReport = () => {
    if (reportData) {
      setShowReportPopup(true);
    }
  };

  const handleTestReport = () => {
    const mockReportData = {
      output: `**Balmer Business Acceleration Audit Report**

Dear Chase,

Based on your responses during the Balmer Business Acceleration Audit, we have tailored an AI strategy specifically for your needs at InLogic. Given the constraints of a medium-sized technology firm with a focus on optimising administrative processes, reducing costs, and enhancing efficiency with existing resources, we propose the following AI solutions:

1. **Administrative Data Processing Agent**: Given your emphasis on streamlining administrative processes, this agent is paramount. It automates routine data tasks such as form processing, report generation, and workflow management. By reducing manual administrative data handling between 65-80%, this solution will significantly alleviate the burden on your team, freeing up time for strategic initiatives. Expect a marked improvement in accuracy and compliance, reducing overhead costs and errors associated with mundane data entries. ROI is expected to be observed within the implementation period of 0-30 days.

2. **Document Processing Agent**: Your current expenditure of 10-20 hours weekly on contracts and legal documents presents a clear opportunity for improvement. This agent effectively processes, categorises, and retrieves information from critical documents, thus reducing manual entry errors. With a reduction in data entry tasks by 70-90%, your team can redirect their focus towards core business activities, facilitating greater productivity without increased staffing.

3. **Task Management Agent** (Optional): As your company operates using spreadsheets for task assignments—a method that may not provide the best transparency or workload balance—this agent could revolutionise team efficiency. It offers improved visibility into project statuses and balances workloads equitably across your team. This transformation agent reduces deadline misses by up to 50%, thus greatly enhancing team productivity and morale over a 30-90 day timeframe.

These implementations focus on enhancing resource utilisation and diminishing redundant manual tasks, aligning with your strategic priority of doing more with the same resources. They are tailored to not only address immediate operational challenges such as cost reduction but also to facilitate long-term scalability and enhanced decision-making capability. Let us know how we can assist you further in commencing these implementations.

Yours sincerely,

[Your Name]
AI Consultant at Balmer Agency`,
      agents: [
        { agent: { name: "Administrative Data Processing Agent", ranking_position: "1" } },
        { agent: { name: "Document Processing Agent", ranking_position: "2" } },
        { agent: { name: "Task Management Agent", ranking_position: "3" } },
      ],
    };
    setReportData(mockReportData);
    setMessages((prev) => [
      ...prev,
      { text: "Your report is ready! Click 'View Report' to see it.", sender: "bot" },
    ]);
  };

  return (
    <div className="chat-container">
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <img src="/balmer_logo.svg" alt="BALMER AGENCY" className="chat-container-logo"></img>
      <p>AI Business Acceleration Discovery</p>
      <div className="background-grid">
        <img src="/balmer_background.jpg" alt="Background 1" className="background-image large-image" />
        <img src="/balmer_background2.jpg" alt="Background 2" className="background-image small-image" />
        <img src="/balmer_background3.jpg" alt="Background 3" className="background-image small-image" />
      </div>
      <div className="circle-text">
        <span className="text" ref={circleTextRef}>
          BALMERAGENCY
        </span>
      </div>
      <div
        className={`chat-box ${borderGlowData.isActive ? "glow-active" : ""}`}
        ref={chatBoxRef}
        style={{
          "--mouse-x": `${mousePosition.x}px`,
          "--mouse-y": `${mousePosition.y}px`,
          "--glow-position": borderGlowData.position,
          "--glow-border": borderGlowData.border,
        }}
        data-glow-border={borderGlowData.border}
      >
        <div className="messages">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message ${
                msg.sender === "bot" ? "bot-message" : "user-message"
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
          {exampleAnswers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="example-answers-container"
            >
              <div className="example-answers-label">Suggestions:</div>
              {exampleAnswers.map((answer, idx) => (
                <button
                  key={idx}
                  className="example-answer-button"
                  onClick={() => handleExampleAnswerClick(answer)}
                >
                  {answer}
                </button>
              ))}
            </motion.div>
          )}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="message bot-message"
            >
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} style={{ height: "1px" }} />
        </div>
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            className="input-box"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type here..."
            disabled={isTyping}
          />
          <button className="send-button" onClick={handleSend}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M2 12L22 2L12 22L2 12Z" />
            </svg>
          </button>
        </div>
        <div className="button-group">
          <div className="button-row">
            <button
              className="test-report-button"
              onClick={handleTestReport}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                margin: "5px",
              }}
            >
              TEST REPORT
            </button>
          </div>
          {reportData && (
            <button className="view_report_button" onClick={handleViewReport}>
              VIEW REPORT<img src="/Group 1.png" alt="Arrow" className="arrow-icon" />
            </button>
          )}
        </div>
        {showReportPopup && reportData && (
          <ReportPopup reportData={reportData} onClose={() => setShowReportPopup(false)} />
        )}
      </div>
    </div>
  );
};

export default Chatbot;