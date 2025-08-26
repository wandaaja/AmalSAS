import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function WhyUs() {
  const navigate = useNavigate();

  const sectionStyle = {
    backgroundColor: "#2e8b57",
    color: "#fff",
    padding: "20px 10px",
    textAlign: "center",
  };

  const titleStyle = {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "15px",
    textTransform: "uppercase",
  };

  const featuresWrapper = {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "15px",
  };

  const featureStyle = {
    width: "120px",
    textAlign: "center",
  };

  const iconStyle = {
    fontSize: "20px",
    marginBottom: "5px",
    color: "#fff",
  };

  const featureTitle = {
    fontSize: "12px",
    margin: "3px 0",
    fontWeight: "bold",
  };

  const featureText = {
    fontSize: "10px",
    lineHeight: "1.2",
    marginTop: "5px",
  };

  const contactWrapper = {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "#fff",
    color: "#2e8b57",
    padding: "5px 15px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  };

  const handleContactClick = () => {
    navigate("/contact-us");
  };

  return (
    <div style={sectionStyle}>
      <h2 style={titleStyle}>mengapa berbagi bersama amalSAS?</h2>

      <div style={featuresWrapper}>
        <div style={featureStyle}>
          <i className="bi bi-lightning" style={iconStyle}></i>
          <h3 style={featureTitle}>Responsif</h3>
          <p style={featureText}>merespon kebutuhan dengan cepat dan tepat</p>
        </div>

        <div style={featureStyle}>
          <i className="bi bi-shield-check" style={iconStyle}></i>
          <h3 style={featureTitle}>Credibility</h3>
          <p style={featureText}>bertanggung jawab penuh menjalankan amanah program</p>
        </div>
      </div>

      <div 
        style={contactWrapper} 
        onClick={handleContactClick}
      >
        hubungi kami
      </div>
    </div>
  );
}