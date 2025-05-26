import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { remark } from "remark";
import remarkParse from "remark-parse";
import "./App.css";

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
  const [popupBlocked, setPopupBlocked] = useState(false);
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

  useEffect(() => {
    if (reportData) {
      // Store reportData in localStorage
      localStorage.setItem("reportData", JSON.stringify(reportData));
      // Attempt to open new tab
      const reportWindow = window.open("/report", "_blank");
      if (!reportWindow) {
        console.error("Failed to open new tab. Please allow popups for this site.");
        setPopupBlocked(true);
        setMessages((prev) => [
          ...prev,
          { text: "Failed to open report in new tab. Please allow popups or click the 'Open Report' button below.", sender: "bot" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "Your report has been generated and opened in a new tab.", sender: "bot" },
        ]);
      }
    }
  }, [reportData]);

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
      if (!webhookData.report) {
        setMessages((prev) => [...prev, { text: webhookData.output, sender: "bot" }]);
      }
      
      if (webhookData.example_answers) {
        setExampleAnswers(webhookData.example_answers);
      }

      if (webhookData.report === true && webhookData.output && webhookData.agents) {
        setReportData({ output: webhookData.output, agents: webhookData.agents });
      }
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const handleOpenReport = () => {
    if (reportData) {
      localStorage.setItem("reportData", JSON.stringify(reportData));
      window.open("/report", "_blank");
    }
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const bgColor = "#161616";
      const textColor = "#E8E6E6";
      const bubbleBgColor = "rgb(30, 30, 30)";
      const summaryBgColor = "#1A1A1A";
      const borderColor = "rgb(71, 71, 71)";
      const chartGray = "#D3D3D3";
      const altShade = "#2A2A2A";

      const rgbaToRgb = (rgba) => {
        const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [255, 255, 255];
      };

      doc.setFillColor(bgColor);
      doc.rect(0, 0, 210, 297, "F");
      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.2);
      doc.roundedRect(10, 10, 190, 277, 5, 5, "S");

      const logoUrl = "/balmer_logo.png";
      doc.addImage(logoUrl, "PNG", 15, 5, 30, 30);

      doc.setFillColor(altShade);
      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.1);
      doc.roundedRect(15, 25, 180, 12, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(textColor);
      doc.text("YOUR AI OPPORTUNITY REPORT", 20, 31);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(chartGray);
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      doc.text(formattedDate, 190, 34, { align: "right" });

      let yOffset = 43;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(textColor);
      doc.text("Summary", 20, yOffset);
      const summaryIconUrl = "/icons8-analysis-96.png";
      doc.addImage(summaryIconUrl, "PNG", 15, yOffset - 4, 4, 4);

      yOffset += 5;
      const summaryWidth = 100;
      const summaryPadding = 5;

      const summaryText = reportData?.output || "";
      let elements = [];
      if (summaryText) {
        try {
          const tree = remark().use(remarkParse).parse(summaryText);
          const walk = (node) => {
            if (node.type === "heading") {
              const className = `h${node.depth}`;
              const text = node.children
                .filter((child) => child.type === "text")
                .map((child) => child.value || "")
                .join("");
              if (text) {
                elements.push({ type: className, text });
              }
            } else if (node.type === "paragraph") {
              const text = node.children
                .filter((child) => child.type === "text")
                .map((child) => child.value || "")
                .join("");
              if (text) {
                elements.push({ type: "p", text });
              }
            } else if (node.type === "list") {
              node.children.forEach((item) => {
                const text = item.children
                  .map((child) =>
                    child.children
                      ?.filter((c) => c.type === "text")
                      .map((c) => c.value || "")
                      .join("") || ""
                  )
                  .join("");
                if (text) {
                  elements.push({ type: "list_item", text });
                }
              });
            }
            if (node.children) {
              node.children.forEach(walk);
            }
          };
          walk(tree);
        } catch (error) {
          console.error("Error parsing Markdown for PDF:", error);
          elements = [{ type: "p", text: "No summary available." }];
        }
      }
      if (elements.length === 0) {
        elements = [{ type: "p", text: "No summary available." }];
      }

      let totalSummaryHeight = 0;
      let textY = yOffset + summaryPadding;
      elements.forEach((element) => {
        const fontSize = element.type === "h2" ? 9 : element.type === "h3" ? 8 : 7;
        const lineHeight = fontSize * 0.5;
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", element.type.startsWith("h") ? "bold" : "normal");
        const lines = doc.splitTextToSize(element.text.trim(), summaryWidth - 2 * summaryPadding);
        lines.forEach(() => {
          totalSummaryHeight += lineHeight;
          textY += lineHeight;
        });
        textY += 1;
        totalSummaryHeight += 1;
      });
      totalSummaryHeight += 2 * summaryPadding;

      doc.setFillColor(summaryBgColor);
      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.1);
      doc.roundedRect(15, yOffset, summaryWidth, totalSummaryHeight, 3, 3, "FD");

      textY = yOffset + summaryPadding;
      elements.forEach((element) => {
        const fontSize = element.type === "h2" ? 9 : element.type === "h3" ? 8 : 7;
        const lineHeight = fontSize * 0.5;
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", element.type.startsWith("h") ? "bold" : "normal");
        const lines = doc.splitTextToSize(element.text.trim(), summaryWidth - 2 * summaryPadding);
        lines.forEach((line) => {
          if (textY > 270) {
            doc.addPage();
            textY = 20;
            doc.setFillColor(summaryBgColor);
            doc.roundedRect(15, textY - summaryPadding, summaryWidth, totalSummaryHeight, 3, 3, "FD");
          }
          doc.setTextColor(textColor);
          doc.text(line, 15 + summaryPadding, textY);
          textY += lineHeight;
        });
        textY += 1;
      });

      yOffset = textY + summaryPadding;

      let agentYOffset = 43;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(textColor);
      doc.text("Recommended AI Agents", 126, agentYOffset);
      const agentsIconUrl = "/icons8-combo-chart-96.png";
      doc.addImage(agentsIconUrl, "PNG", 120, agentYOffset - 4, 5, 5);

      agentYOffset += 5;
      const topAgents = (reportData?.agents || []).slice(0, 4).map((item) => item.agent);
      const bubbleWidth = 70;
      const bubbleHeight = 20;
      topAgents.forEach((agent, index) => {
        const x = 120;
        const y = agentYOffset + index * (bubbleHeight + 2);
        doc.setFillColor(...rgbaToRgb(bubbleBgColor));
        doc.setDrawColor(...rgbaToRgb(borderColor));
        doc.setLineWidth(0.1);
        doc.roundedRect(x, y, bubbleWidth, bubbleHeight, 3, 3, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        const nameLines = doc.splitTextToSize(agent.name, bubbleWidth * 0.6 - 5);
        doc.text(nameLines, x + bubbleWidth / 2 + 2, y + 8, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(textColor);
        doc.text(`Rank: ${agent.ranking_position}`, x + bubbleWidth / 2 + 2, y + 15, { align: "center" });
      });

      doc.setFontSize(8);
      doc.setTextColor(chartGray);
      doc.text("BALMER AGENCY - AI Business Acceleration Discovery", 105, 285, { align: "center" });

      doc.save("Balmer_AI_Opportunity_Report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please check the console for details.");
    }
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
            {/* Removed restart button */}
          </div>
          {reportData && (
            <div className="report-buttons">
              {popupBlocked && (
                <button className="view_report_button" onClick={handleOpenReport}>
                  VIEW REPORT<img src="/Group 1.png" alt="Arrow" className="arrow-icon" />
                </button>
              )}
              <button className="download_button" onClick={handleDownloadPDF}>
                DOWNLOAD PDF<img src="/Group 1.png" alt="Arrow" className="arrow-icon" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;