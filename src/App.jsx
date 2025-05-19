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

  // Mock report data for testing
  const mockReportData = {
    output: `## AI Solutions Report for InLogic – Tailored Recommendations {.h1}\nFollowing a comprehensive review of your responses as a software developer at InLogic, operating within the healthcare sector with a headcount of 11-50, several critical process challenges have been identified. These include considerable manual labour, a high proportion of repetitive tasks, and inefficiencies in report generation, further compounded by communication breakdowns arising from reliance on verbal task assignment. Your strategic focus is on maximising output with existing resources.\n\n### 1st. Task Management Agent {.h2}\nImplementing the Task Management Agent should be the foremost priority. Presently, task allocation via verbal assignments has led to reduced visibility, frequent communication breakdowns, and avoidable project bottlenecks. The AI-enabled agent will digitise and centralise task distribution, tracking, and rebalancing of workloads across teams. This will enable real-time project monitoring, equitable task allocation, and prompt identification of potential delays. In turn, management overhead on manual oversight is drastically reduced, project momentum improves, and the likelihood of missed deadlines decreases sharply. The embedded analytics will also facilitate data-driven performance management and unlock new efficiencies, significantly improving organisational agility and accountability.\n\n### 2nd. Team Coordination Assistant {.h2}\nThe supplementary deployment of the Team Coordination Assistant directly addresses irregular update cycles and the inefficiencies of time-consuming status meetings. By automating daily and weekly progress communications, systematic reminders, and proactive identification of blockers, this solution will streamline collaboration. The outcome is a more synchronised workforce, minimised information gaps, and reduced time lost to unstructured meetings — directly supporting your top business objective to achieve more with constrained headcount.\n\n### 3rd. Document Processing Agent {.h2}\nA substantial proportion (40-60%) of administrative staff time is currently devoted to manual data entry, especially concerning invoices and financial documents. By introducing the Document Processing Agent, InLogic can automate extraction, categorisation, and process management of these documents. This transition will substantially lower error rates, minimise manual effort, and accelerate financial workflows. The net ROI includes enhanced compliance, improved data accuracy, and significant administrative time savings.\n\nCollectively, these targeted AI solutions are designed to address your key operational pain points, delivering quantifiable savings and sustainable growth capacity through automation and enhanced collaboration.`,
    agents: [
      { agent: { name: "Task Management Agent", ranking_position: "1st" } },
      { agent: { name: "Team Coordination Assistant", ranking_position: "2nd" } },
      { agent: { name: "Document Processing Agent", ranking_position: "3rd" } },
    ],
  };

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
    try {
      const response = await fetch(
        "https://balmer.app.n8n.cloud/webhook/68b7569f-058a-47b8-9ce9-39ff92328ad7/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Webhook error:", error);
      return { output: "Sorry, something went wrong. Please try again.", report: false };
    }
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

    if (Array.isArray(webhookData)) {
      const agentsData = webhookData.find((item) => item.agents)?.agents || [];
      const reportOutput = webhookData.find((item) => item.output)?.output || "";
      if (reportOutput && agentsData.length > 0) {
        setReportData({ output: reportOutput, agents: agentsData });
        setMessages((prev) => [
          ...prev,
          { text: "Your report is ready! Click 'View Report' to see it.", sender: "bot" },
        ]);
      }
    } else if (webhookData.output) {
      setMessages((prev) => [...prev, { text: webhookData.output, sender: "bot" }]);
      if (webhookData.example_answers) {
        setExampleAnswers(webhookData.example_answers);
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

    if (Array.isArray(webhookData)) {
      const agentsData = webhookData.find((item) => item.agents)?.agents || [];
      const reportOutput = webhookData.find((item) => item.output)?.output || "";
      if (reportOutput && agentsData.length > 0) {
        setReportData({ output: reportOutput, agents: agentsData });
        setMessages((prev) => [
          ...prev,
          { text: "Your report is ready! Click 'View Report' to see it.", sender: "bot" },
        ]);
      }
    } else if (webhookData.output) {
      setMessages((prev) => [...prev, { text: webhookData.output, sender: "bot" }]);
      if (webhookData.example_answers) {
        setExampleAnswers(webhookData.example_answers);
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
    setReportData(mockReportData);
    setMessages((prev) => [
      ...prev,
      { text: "Test report loaded! Click 'View Report' to see it.", sender: "bot" },
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
            <button className="test_report_button" onClick={handleTestReport}>
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