import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./ReportPopup.css";
import parse from "html-react-parser";
import { jsPDF } from "jspdf";

const ReportPopup = ({ reportData, onClose }) => {
  const [showPopup, setShowPopup] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true); // Trigger exit animation
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Colors to match popup styles
    const bgColor = "#161616"; // rgb(22, 22, 22) for popup_box
    const textColor = "#E8E6E6"; // rgb(232, 230, 230) for text
    const bubbleBgColor = "rgb(79, 79, 79)"; // Fill for agent_bubble
    const summaryBgColor = "#1A1A1A"; // Background for summary_text
    const borderColor = "rgb(71, 71, 71)"; // Border color

    // Helper to convert rgba or rgb to RGB array for jsPDF (ignores alpha)
    const rgbaToRgb = (rgba) => {
      const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [255, 255, 255];
    };

    // Set default font
    doc.setFont("helvetica", "normal");

    // Add background (mimics popup_box)
    doc.setFillColor(bgColor);
    doc.rect(0, 0, 210, 297, "F"); // A4 size: 210mm x 297mm
    doc.setDrawColor(...rgbaToRgb(borderColor));
    doc.setLineWidth(0.2); // Thinner border (1px ≈ 0.2mm)
    doc.roundedRect(10, 10, 190, 277, 5, 5, "S"); // Border 10mm from edges, 20px ≈ 5mm radius

    // Add title (mimics popup_title_report)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(textColor);
    doc.text("YOUR AI OPPORTUNITY REPORT", 15, 25); // Left-aligned, 1.5% margin ≈ 3mm

    // Add summary text (mimics summary_text, positioned higher)
    const summaryText = reportData.output || "";
    // Parse HTML to apply .h1 and .h2 styles
    const elements = [];
    const regex = /<p>(.*?)<\/p>|<h1>(.*?)<\/h1>|<h2>(.*?)<\/h2>/g;
    let match;
    while ((match = regex.exec(summaryText)) !== null) {
      if (match[1]) elements.push({ type: "p", text: match[1].replace(/<[^>]+>/g, "") });
      if (match[2]) elements.push({ type: "h1", text: match[2].replace(/<[^>]+>/g, "") });
      if (match[3]) elements.push({ type: "h2", text: match[3].replace(/<[^>]+>/g, "") });
    }

    // Draw summary background (left side, 6fr ≈ 60%)
    let yOffset = 40; // Moved higher from 50mm to 40mm
    const summaryWidth = 110; // 6fr of 10fr (190mm content area) ≈ 60% of 1200px
    const summaryPadding = 7; // 20px ≈ 7mm
    const summaryMinHeight = 50;
    let summaryHeight = summaryMinHeight;
    doc.setFillColor(summaryBgColor);
    doc.setDrawColor(...rgbaToRgb(borderColor));
    doc.setLineWidth(0.1); // Thinner border for summary
    doc.roundedRect(15, yOffset, summaryWidth, summaryHeight, 5, 5, "FD");

    // Render summary text with styles
    let textY = yOffset + summaryPadding + 5;
    elements.forEach((element) => {
      const { type, text } = element;
      let fontSize = 16;
      let fontStyle = "normal";
      if (type === "h1") {
        fontSize = 24;
        fontStyle = "bold";
      } else if (type === "h2") {
        fontSize = 18;
        fontStyle = "bold";
      }

      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(textColor);
      const lines = doc.splitTextToSize(text, summaryWidth - 2 * summaryPadding);
      lines.forEach((line) => {
        doc.text(line, 15 + summaryPadding, textY);
        textY += fontSize * 0.5; // Approximate line-height: 1.5
      });
      textY += 2; // Small gap between elements
    });

    // Update summary height
    summaryHeight = textY - yOffset - summaryPadding;
    if (summaryHeight < summaryMinHeight) summaryHeight = summaryMinHeight;
    doc.setFillColor(summaryBgColor);
    doc.setDrawColor(...rgbaToRgb(borderColor));
    doc.setLineWidth(0.1);
    doc.roundedRect(15, yOffset, summaryWidth, summaryHeight, 5, 5, "FD");
    // Re-render text to ensure it’s on top
    textY = yOffset + summaryPadding + 5;
    elements.forEach((element) => {
      const { type, text } = element;
      let fontSize = 16;
      let fontStyle = "normal";
      if (type === "h1") {
        fontSize = 24;
        fontStyle = "bold";
      } else if (type === "h2") {
        fontSize = 18;
        fontStyle = "bold";
      }

      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(textColor);
      const lines = doc.splitTextToSize(text, summaryWidth - 2 * summaryPadding);
      lines.forEach((line) => {
        doc.text(line, 15 + summaryPadding, textY);
        textY += fontSize * 0.5;
      });
      textY += 2;
    });

    // Add agent recommendations (mimics agent_bubbles, right side, 2fr ≈ 20%)
    const topAgents = (reportData.agents || []).slice(0, 4).map((item) => item.agent);
    const agentX = 15 + summaryWidth + 10; // Right of summary + 20px gap ≈ 10mm
    let agentYOffset = 45;
    if (topAgents.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(textColor);
      doc.text("Top AI Agents:", agentX, agentYOffset);

      agentYOffset += 10;
      topAgents.forEach((agent, index) => {
        // Draw bubble (rounded rectangle, no border)
        const bubbleWidth = 60; // 140px ≈ 49mm
        const bubbleHeight = 40; // 120px ≈ 42mm
        doc.setFillColor(...rgbaToRgb(bubbleBgColor));
        doc.roundedRect(agentX, agentYOffset, bubbleWidth, bubbleHeight, 5, 5, "F"); // Fill only, no border

        // Add agent name (mimics agent_name, displayed first)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const nameLines = doc.splitTextToSize(agent.name, bubbleWidth * 0.8); // 80% width
        doc.text(nameLines, agentX + bubbleWidth / 2, agentYOffset + 18, { align: "center" });

        // Add agent rating (mimics agent_rating, below name)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(textColor);
        doc.text(agent.ranking_position, agentX + bubbleWidth / 2, agentYOffset + 30, { align: "center" });

        agentYOffset += bubbleHeight + 7; // 20px gap ≈ 7mm
      });
    }

    // Save the PDF
    doc.save("AI_Opportunity_Report.pdf");
  };

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        onClose(); // Clear report data in parent component after animation
      }, 300); // Match the animation duration (0.3s)
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  // Extract data directly from reportData
  const summaryText = reportData.output || "";
  // Map agents to get the nested agent objects and take top 4
  const topAgents = (reportData.agents || []).slice(0, 4).map((item) => item.agent);

  return (
    <>
      {showPopup && (
        <div className={`popup_container ${isClosing ? "fadeOut" : ""}`}>
          <div className={`popup_box ${isClosing ? "popupOut" : ""}`}>
            <h2 className="popup_title_report">YOUR AI OPPORTUNITY REPORT</h2>

            <div className="report_content">
              <div className="agent_bubbles">
                {topAgents.map((agent, index) => (
                  <div key={index} className="agent_bubble">
                    <div className="agent_name">{agent.name}</div>
                    <div className="agent_rating">{agent.ranking_position}</div>
                  </div>
                ))}
              </div>

              <div className="summary_text">{parse(summaryText)}</div>
            </div>

            <div className="button_container">
              <button className="download_button" onClick={handleDownloadPDF}>
                DOWNLOAD PDF
              </button>
              <button className="close_button" onClick={handleClose}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ReportPopup.propTypes = {
  reportData: PropTypes.shape({
    output: PropTypes.string.isRequired,
    agents: PropTypes.arrayOf(
      PropTypes.shape({
        agent: PropTypes.shape({
          name: PropTypes.string.isRequired,
          ranking_position: PropTypes.string.isRequired,
        }).isRequired,
      })
    ).isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ReportPopup;