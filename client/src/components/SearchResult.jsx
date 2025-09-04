import React, { useContext } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/userContext";

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dispatch] = useContext(UserContext);
  const { query, campaigns, pages, keywords } = location.state || {};

  // Handle jika tidak ada state (langsung akses URL)
  if (!location.state) {
    return (
      <div style={{ padding: "20px", marginTop: "80px" }}>
        <h2>Pencarian</h2>
        <p>Silakan masukkan kata kunci pencarian melalui kolom search di navbar.</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div style={{ padding: "20px", marginTop: "80px" }}>
        <h2>Pencarian</h2>
        <p>Silakan masukkan kata kunci pencarian.</p>
      </div>
    );
  }

  // Fungsi untuk handle klik campaign
  const handleCampaignClick = (campaignId, campaignTitle) => {
    if (!campaignId) {
      console.error("Campaign ID tidak valid");
      return;
    }
    
    navigate(`/campaigns/${campaignId}`, { 
      state: { campaignTitle } 
    });
  };

  // Fungsi untuk handle keyword action berdasarkan ID
  // Fungsi untuk handle keyword action berdasarkan ID
const handleKeywordAction = (item) => {
  switch (item.type) {
    case 'action':
      // Handle actions like login, register, logout
      switch (item.id) {
        case 'signin':
          // Buka modal signin atau redirect ke halaman login
          window.dispatchEvent(new CustomEvent('openModal', { 
            detail: { modalType: 'signin' } 
          }));
          break;
        case 'signup':
          window.dispatchEvent(new CustomEvent('openModal', { 
            detail: { modalType: 'signup' } 
          }));
          break;
        case 'logout':
          localStorage.removeItem("token");
          dispatch({ type: "LOGOUT" });
          navigate('/');
          break;
        default:
          console.warn("Action tidak dikenali:", item.id);
      }
      break;
    
    case 'navigation':
      // Navigate ke halaman yang ditentukan
      if (item.path) {
        navigate(item.path);
      }
      break;
    
    default:
      console.warn("Tipe keyword tidak dikenali:", item.type);
  }
};

  return (
    <div style={{ padding: "20px", marginTop: "80px", maxWidth: "800px", margin: "80px auto" }}>
      <h2 style={{ color: "#2e8b57", marginBottom: "30px" }}>
        Hasil Pencarian untuk "{query}"
      </h2>
      
      {/* Hasil dari Keywords/Actions */}
      {keywords && keywords.length > 0 && (
  <div style={{ marginBottom: "30px" }}>
    <h3 style={{ color: "#333", marginBottom: "15px" }}>Hasil Terkait</h3>
    {keywords.map(item => (
      <div 
        key={item.id} 
        style={{ 
          padding: "15px", 
          border: "1px solid #e0e0e0", 
          borderRadius: "8px", 
          marginBottom: "10px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          backgroundColor: "#f9f9f9"
        }} 
        onClick={() => handleKeywordAction(item)}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#f0f0f0";
          e.target.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#f9f9f9";
          e.target.style.transform = "translateY(0)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
          <span style={{ marginRight: "10px", fontSize: "18px" }}>{item.icon}</span>
          <h4 style={{ margin: "0", color: "#2e8b57" }}>{item.title}</h4>
        </div>
        <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>{item.content}</p>
        {item.adminOnly && (
          <span style={{ 
            fontSize: "12px", 
            color: "#ff6b35", 
            backgroundColor: "#fff4f0",
            padding: "2px 6px",
            borderRadius: "4px",
            marginTop: "5px",
            display: "inline-block"
          }}>
            Admin Only
          </span>
        )}
      </div>
    ))}
  </div>
)}

      {/* Hasil dari Pages */}
      {pages && pages.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#333", marginBottom: "15px" }}>Halaman</h3>
          {pages.map(page => (
            <Link 
              key={page.id} 
              to={page.path}
              style={{ 
                display: "block", 
                padding: "15px", 
                border: "1px solid #e0e0e0", 
                borderRadius: "8px", 
                marginBottom: "10px",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s ease",
                backgroundColor: "#f9f9f9"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f0f0f0";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#f9f9f9";
                e.target.style.transform = "translateY(0)";
              }}
            >
              <h4 style={{ margin: "0 0 5px 0", color: "#2e8b57" }}>{page.title}</h4>
              <p style={{ margin: 0, color: "#666" }}>{page.content}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Hasil dari Campaigns */}
      {campaigns && campaigns.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#333", marginBottom: "15px" }}>Campaigns</h3>
          {campaigns.map(campaign => (
            <div
              key={campaign.id || campaign._id}
              style={{ 
                padding: "15px", 
                border: "1px solid #e0e0e0", 
                borderRadius: "8px", 
                marginBottom: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: "#f9f9f9"
              }}
              onClick={() => handleCampaignClick(campaign.id || campaign._id, campaign.title)}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f0f0f0";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#f9f9f9";
                e.target.style.transform = "translateY(0)";
              }}
            >
              <h4 style={{ margin: "0 0 5px 0", color: "#2e8b57" }}>
                {campaign.title || "Untitled Campaign"}
              </h4>
              <p style={{ margin: 0, color: "#666" }}>
                {campaign.description || "No description available"}
              </p>
              {campaign.image && (
                <img 
                  src={campaign.image} 
                  alt={campaign.title} 
                  style={{ 
                    width: "100%", 
                    maxHeight: "200px", 
                    objectFit: "cover", 
                    borderRadius: "4px", 
                    marginTop: "10px" 
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tidak ada hasil */}
      {(!campaigns || campaigns.length === 0) && 
       (!pages || pages.length === 0) && 
       (!keywords || keywords.length === 0) && (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <h3>Tidak ada hasil ditemukan untuk "{query}"</h3>
          <p>Coba gunakan kata kunci yang berbeda atau lebih spesifik.</p>
        </div>
      )}
    </div>
  );
}