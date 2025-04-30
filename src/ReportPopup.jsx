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
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Colors to match original popup styles
      const bgColor = "#161616"; // Background
      const textColor = "#E8E6E6"; // Text
      const bubbleBgColor = "rgb(30, 30, 30)"; // Agent bubbles
      const summaryBgColor = "#1A1A1A"; // Summary background
      const borderColor = "rgb(71, 71, 71)"; // Borders
      const chartGray = "#D3D3D3"; // Light gray for icons
      const altShade = "#2A2A2A"; // Lighter shade for gradient

      // Helper to convert rgba or rgb to RGB array for jsPDF
      const rgbaToRgb = (rgba) => {
        const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [255, 255, 255];
      };

      // Set background
      doc.setFillColor(bgColor);
      doc.rect(0, 0, 210, 297, "F"); // A4 size: 210mm x 297mm
      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.2);
      doc.roundedRect(10, 10, 190, 277, 5, 5, "S");

      // Header with Bordered Title Block
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(chartGray);
      doc.text("BALMER AGENCY", 15, 15);

      doc.setFillColor(altShade);
      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.1);
      doc.roundedRect(15, 17, 180, 12, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(textColor);
      doc.text("YOUR AI OPPORTUNITY REPORT", 20, 23);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(chartGray);
      doc.text("01 Apr 2025 - 29 Apr 2025", 190, 26, { align: "right" });

      let yOffset = 35;

      // Section 1: Summary Text (Left Side) with Icon
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(textColor);
      doc.text("Summary", 20, yOffset);
      // Document icon
      doc.setDrawColor(chartGray);
      doc.setLineWidth(0.2);
      doc.rect(15, yOffset - 4, 4, 4); // Document shape
      doc.line(16, yOffset - 2, 18, yOffset - 2); // Text line 1
      doc.line(16, yOffset - 1, 18, yOffset - 1); // Text line 2

      yOffset += 5;
      const summaryWidth = 100;
      const summaryPadding = 5;
      doc.setFillColor(summaryBgColor);
      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.1);
      doc.roundedRect(15, yOffset, summaryWidth, 90, 3, 3, "FD");

      let textY = yOffset + summaryPadding;
      const summaryText = reportData.output || "";
      const elements = [];
      const regex = /<p>(.*?)<\/p>|<h1>(.*?)<\/h1>|<h2>(.*?)<\/h2>/g;
      let match;
      while ((match = regex.exec(summaryText)) !== null) {
        if (match[1]) elements.push({ type: "p", text: match[1].replace(/<[^>]+>/g, "") });
        if (match[2]) elements.push({ type: "h1", text: match[2].replace(/<[^>]+>/g, "") });
        if (match[3]) elements.push({ type: "h2", text: match[3].replace(/<[^>]+>/g, "") });
      }

      elements.forEach((element) => {
        const { type, text } = element;
        let fontSize = 7;
        let fontStyle = "normal";
        if (type === "h1") {
          fontSize = 10;
          fontStyle = "bold";
        } else if (type === "h2") {
          fontSize = 9;
          fontStyle = "bold";
        }

        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(textColor);
        const lines = doc.splitTextToSize(text, summaryWidth - 2 * summaryPadding);
        lines.forEach((line) => {
          if (textY + fontSize * 0.5 < yOffset + 90 - summaryPadding) {
            doc.text(line, 15 + summaryPadding, textY);
            textY += fontSize * 0.5;
          }
        });
        textY += 1;
      });

      // Section 2: Top 4 Agents (Right Side) with Icons
      let agentYOffset = 35;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(textColor);
      doc.text("Top AI Agents", 125, agentYOffset);
      // User icon for title
      doc.setDrawColor(chartGray);
      doc.setLineWidth(0.2);
      doc.circle(120, agentYOffset - 1, 1); // Head
      doc.line(120, agentYOffset, 120, agentYOffset + 2); // Body

      agentYOffset += 5;
      const topAgents = (reportData.agents || []).slice(0, 4).map((item) => item.agent);
      const bubbleWidth = 70;
      const bubbleHeight = 20;
      topAgents.forEach((agent, index) => {
        const x = 120;
        const y = agentYOffset + index * (bubbleHeight + 2);
        doc.setFillColor(...rgbaToRgb(bubbleBgColor));
        doc.setDrawColor(...rgbaToRgb(borderColor));
        doc.setLineWidth(0.1);
        doc.roundedRect(x, y, bubbleWidth, bubbleHeight, 3, 3, "F");
        doc.setDrawColor(chartGray);
        doc.setLineWidth(0.2);
        doc.circle(x + 5, y + bubbleHeight / 2, 1);
        doc.line(x + 5, y + bubbleHeight / 2 + 1, x + 5, y + bubbleHeight / 2 + 3);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        const nameLines = doc.splitTextToSize(agent.name, bubbleWidth * 0.6 - 5);
        doc.text(nameLines, x + bubbleWidth / 2 + 2, y + 8, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(textColor);
        doc.text(`Rank: ${agent.ranking_position}`, x + bubbleWidth / 2 + 2, y + 15, { align: "center" });
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(chartGray);
      doc.text("BALMER AGENCY - AI Business Acceleration Audit", 105, 285, { align: "center" });

      doc.save("Balmer_AI_Opportunity_Report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please check the console for details.");
    }
  };

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const summaryText = reportData.output || "";
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