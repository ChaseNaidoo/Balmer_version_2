import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./ReportPopup.css";
import { remark } from "remark";
import remarkAttr from "remark-attr";
import remarkHtml from "remark-html";
import { jsPDF } from "jspdf";

const ReportPopup = ({ reportData, onClose }) => {
  const [showPopup, setShowPopup] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [parsedSummary, setParsedSummary] = useState("");

  // Parse Markdown for UI
  useEffect(() => {
    setIsClient(true);
    const summaryText = reportData.output || "";
    if (summaryText) {
      remark()
        .use(remarkAttr)
        .use(remarkHtml)
        .process(summaryText)
        .then((result) => {
          setParsedSummary(result.toString());
        })
        .catch((error) => {
          console.error("Error parsing Markdown for UI:", error);
          setParsedSummary("<p>No summary available.</p>");
        });
    } else {
      setParsedSummary("<p>No summary available.</p>");
    }
  }, [reportData.output]);

  // Handle close animation
  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setShowPopup(false);
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Colors to match popup styles
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

      // Set background
      doc.setFillColor(bgColor);
      doc.rect(0, 0, 210, 297, "F");
      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.2);
      doc.roundedRect(10, 10, 190, 277, 5, 5, "S");

      // Add logo
      const logoUrl = "https://raw.githubusercontent.com/ChaseNaidoo/Balmer_version_2/main/public/balmer_logo.png";
      doc.addImage(logoUrl, "PNG", 15, 5, 30, 30);

      // Header
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

      // Section 1: Summary Text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(textColor);
      doc.text("Summary", 20, yOffset);
      const summaryIconUrl = "https://raw.githubusercontent.com/ChaseNaidoo/Balmer_version_2/main/public/icons8-analysis-96.png";
      doc.addImage(summaryIconUrl, "PNG", 15, yOffset - 4, 4, 4);

      yOffset += 5;
      const summaryWidth = 100;
      const summaryPadding = 5;

      // Parse Markdown for PDF
      const summaryText = reportData.output || "";
      let elements = [];
      if (summaryText) {
        const tree = remark().use(remarkAttr).parse(summaryText);
        const walk = (node) => {
          if (node.type === "heading") {
            const className = node.data?.hProperties?.className || `h${node.depth}`;
            const text = node.children.map((child) => child.value || "").join("");
            elements.push({ type: className, text });
          } else if (node.type === "paragraph") {
            const text = node.children.map((child) => child.value || "").join("");
            elements.push({ type: "p", text });
          } else if (node.type === "list") {
            node.children.forEach((item) => {
              const text = item.children
                .map((child) => child.children?.map((c) => c.value || "").join("") || "")
                .join("");
              elements.push({ type: "list_item", text });
            });
          }
          if (node.children) {
            node.children.forEach(walk);
          }
        };
        walk(tree);
      }
      if (elements.length === 0) {
        elements = [{ type: "p", text: "No summary available." }];
      }

      // Calculate summary height
      let totalSummaryHeight = 0;
      let textY = yOffset + summaryPadding;
      elements.forEach((element) => {
        const fontSize = element.type === "h1" ? 9 : element.type === "h2" ? 8 : element.type === "h3" ? 7 : 7;
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

      // Draw summary box
      doc.setFillColor(summaryBgColor);
      doc.setDrawColor(...rgbaToRgb(borderColor));
      doc.setLineWidth(0.1);
      doc.roundedRect(15, yOffset, summaryWidth, totalSummaryHeight, 3, 3, "FD");

      // Render summary text
      textY = yOffset + summaryPadding;
      elements.forEach((element) => {
        const fontSize = element.type === "h1" ? 9 : element.type === "h2" ? 8 : element.type === "h3" ? 7 : 7;
        const lineHeight = fontSize * 0.5;
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", element.type.startsWith("h") ? "bold" : "normal");
        const lines = doc.splitTextToSize(element.text.trim(), summaryWidth - 2 * summaryPadding);
        lines.forEach((line) => {
          doc.setTextColor(textColor);
          doc.text(line, 15 + summaryPadding, textY);
          textY += lineHeight;
        });
        textY += 1;
      });

      yOffset = textY + summaryPadding;

      // Section 2: Top 4 Agents
      let agentYOffset = 43;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(textColor);
      doc.text("Recommended AI Agents", 126, agentYOffset);
      const agentsIconUrl = "https://raw.githubusercontent.com/ChaseNaidoo/Balmer_version_2/main/public/icons8-combo-chart-96.png";
      doc.addImage(agentsIconUrl, "PNG", 120, agentYOffset - 4, 5, 5);

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
      doc.text("BALMER AGENCY - AI Business Acceleration Discovery", 105, 285, { align: "center" });

      doc.save("Balmer_AI_Opportunity_Report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please check the console for details.");
    }
  };

  const topAgents = (reportData.agents || []).slice(0, 4).map((item) => item.agent);

  return (
    <>
      {showPopup && isClient && (
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
              <div className="summary_text" dangerouslySetInnerHTML={{ __html: parsedSummary }} />
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