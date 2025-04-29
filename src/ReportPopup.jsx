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
      const chartGray = "#D3D3D3"; // Light gray for chart elements
      const chartBlue = "#4A90E2"; // Blue for bars
      const altShade = "#2A2A2A"; // Lighter shade for gradient and table rows

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

      // Move yOffset to the bottom of the tallest section
      yOffset = Math.max(yOffset + 90, agentYOffset + 4 * (bubbleHeight + 2)) + 5;

      yOffset += 5;

      // Section 3: Bar Graph - Agent Performance Metrics (Bottom) with Icon
      const chartX = 15;
      const chartWidth = 180;
      const chartHeight = 70;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(textColor);
      doc.text("Agent Performance", chartX + 5, yOffset);
      doc.setFillColor(chartGray);
      doc.rect(chartX, yOffset - 3, 1, 3, "F");
      doc.rect(chartX + 2, yOffset - 3, 1, 4, "F");
      doc.rect(chartX + 4, yOffset - 3, 1, 2, "F");

      yOffset += 5;

      doc.setFillColor(summaryBgColor);
      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.1);
      doc.roundedRect(chartX, yOffset, chartWidth, chartHeight, 2, 2, "FD");

      doc.setDrawColor(chartGray);
      doc.setLineWidth(0.05);
      const gridLines = [25, 50, 75];
      gridLines.forEach((score) => {
        const yPos = yOffset + chartHeight - 10 - (score / 100) * (chartHeight - 20);
        doc.line(chartX + 10, yPos, chartX + chartWidth - 10, yPos);
      });

      const yAxisX = chartX + 10;
      doc.setDrawColor(chartGray);
      doc.setLineWidth(0.1);
      doc.line(yAxisX, yOffset + 5, yAxisX, yOffset + chartHeight - 10);
      const yLabels = [100, 75, 50, 25, 0];
      yLabels.forEach((label, index) => {
        const yPos = yOffset + 5 + (index * (chartHeight - 15)) / 4;
        doc.setFontSize(6);
        doc.setTextColor(chartGray);
        doc.text(label.toString(), yAxisX - 5, yPos + 1, { align: "right" });
        doc.line(yAxisX - 2, yPos, yAxisX, yPos);
      });

      const performanceScores = [80, 65, 50, 40];
      const barWidth = (chartWidth - 40) / topAgents.length - 10;
      const maxScore = Math.max(...performanceScores);

      topAgents.forEach((agent, index) => {
        const barHeight = (performanceScores[index] / maxScore) * (chartHeight - 20);
        const x = chartX + 20 + index * (barWidth + 10);
        doc.setFillColor(chartBlue);
        doc.rect(x, yOffset + chartHeight - 10 - barHeight, barWidth, barHeight, "F");
        doc.setFontSize(8);
        doc.setTextColor(chartGray);
        doc.text(agent.name, x + barWidth / 2, yOffset + chartHeight - 5, { align: "center" });
      });

      yOffset += chartHeight + 5;

      yOffset += 5;

      // Section 4: Agent Metrics Table with Icon
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(textColor);
      doc.text("Agent Metrics", 20, yOffset);
      doc.setDrawColor(chartGray);
      doc.setLineWidth(0.2);
      doc.rect(15, yOffset - 4, 4, 4);
      doc.line(15, yOffset - 2, 19, yOffset - 2);
      doc.line(17, yOffset - 4, 17, yOffset);

      yOffset += 5;

      const tableWidth = 180;
      const tableHeight = 25;
      doc.setFillColor(summaryBgColor);
      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.1);
      doc.roundedRect(15, yOffset, tableWidth, tableHeight, 2, 2, "FD");

      const columns = ["Agent", "Rank", "Performance", "Interactions"];
      const colWidths = [50, 30, 50, 50];
      let tableX = 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(textColor);
      columns.forEach((header, index) => {
        doc.text(header, tableX + colWidths[index] / 2, yOffset + 5, { align: "center" });
        tableX += colWidths[index];
      });

      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.1);
      tableX = 15;
      for (let i = 0; i < columns.length - 1; i++) {
        tableX += colWidths[i];
        doc.line(tableX, yOffset, tableX, yOffset + tableHeight);
      }

      const mockInteractions = [120, 95, 80, 60];
      topAgents.forEach((agent, index) => {
        const rowY = yOffset + 10 + index * 4.5; // Adjusted from yOffset + 8 to yOffset + 10
        tableX = 15;
        if (index % 2 === 0) {
          doc.setFillColor(altShade);
          doc.rect(tableX, rowY - 4, tableWidth, 4.5, "F");
        }
        const rowData = [
          agent.name,
          agent.ranking_position,
          performanceScores[index].toString(),
          mockInteractions[index].toString(),
        ];
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(textColor);
        rowData.forEach((cell, colIndex) => {
          const cellLines = doc.splitTextToSize(cell, colWidths[colIndex] - 4);
          doc.text(cellLines, tableX + colWidths[colIndex] / 2, rowY, { align: "center" });
          tableX += colWidths[colIndex];
        });
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