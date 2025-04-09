import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./ReportPopup.css";

const ReportPopup = ({ reportData, onClose }) => {
  const [showPopup, setShowPopup] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true); // Trigger exit animation
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

              <div className="summary_text">{summaryText}</div>
            </div>

            <button className="close_button" onClick={handleClose}>
              CLOSE
            </button>
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