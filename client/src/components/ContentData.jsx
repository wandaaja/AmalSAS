import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API} from "../config/api";

const dummyCampaigns = [
  {
    id: "1",
    title: "Jum'at Berkah",
    description: "Membantu yang membutuhkan",
    start: "2025-06-01T00:00:00Z",
    end: "2025-07-01T00:00:00Z",
    cpocket: "BCA 12345678 a.n AmalSAS",
    status: "Active",
    photo: "https://via.placeholder.com/600x300?text=Jumat+Berkah",
    total_collected: 2500000,
    user_id: 1,
    user_name: "Admin",
    created_at: "2025-06-01T00:00:00Z"
  },
  {
    id: "2",
    title: "Wakaf Qurban untuk Daerah Terpencil",
    description: "Distribusi hewan qurban ke daerah yang jarang tersentuh bantuan",
    start: "2025-05-15T00:00:00Z",
    end: "2025-07-15T00:00:00Z",
    cpocket: "BRI 987654321 a.n Yayasan Amal",
    status: "Active",
    photo: "https://via.placeholder.com/600x300?text=Wakaf+Qurban",
    total_collected: 12500000,
    user_id: 2,
    user_name: "AdminQurban",
    created_at: "2025-05-15T00:00:00Z"
  },
  {
    id: "3",
    title: "Donasi Darurat Kemanusiaan Palestina",
    description: "Bantuan kemanusiaan untuk korban terdampak konflik di Palestina",
    start: "2025-01-01T00:00:00Z",
    end: "2025-12-31T00:00:00Z",
    cpocket: "Mandiri 456789123 a.n SAS Donasi",
    status: "Active",
    photo: "https://via.placeholder.com/600x300?text=Palestina",
    total_collected: 92714567,
    user_id: 1,
    user_name: "Admin",
    created_at: "2025-01-01T00:00:00Z"
  }
];

export default function ContentData() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [totalCampaign, setTotalCampaign] = useState(0);
  const [totalDonasi, setTotalDonasi] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);

  const getDaysLeft = (endDateStr) => {
    const endDate = new Date(endDateStr);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await API.get("/campaigns");
        const data = res.data?.data;
        console.log("Data campaigns:", data);
        if (data?.campaigns?.length > 0) {
          setCampaigns(data.campaigns);
          setTotalCampaign(data.total_campaigns);
          setTotalDonasi(data.total_collected);
          setTotalTransaksi(data.total_transactions);
        } else {
          setCampaigns(dummyCampaigns);
        }
      } catch (error) {
        console.error("Gagal mengambil data campaign:", error.message);
        setCampaigns(dummyCampaigns);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <div style={{ maxWidth: "1100px", margin: "auto", padding: "40px 20px" }}>
      <h2 style={{ marginBottom: "30px", textAlign: "center" }}>Layanan Kami</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
        {campaigns.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/campaigns/${item.id}`)}
            style={{
              width: "320px",
              cursor: "pointer",
              border: "1px solid #eee",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              backgroundColor: "#fff",
              transition: "transform 0.2s",
            }}
          >
            <img
              src={item.photo}
              alt={item.title}
              style={{ width: "100%", height: "180px", objectFit: "cover" }}
            />
            <div style={{ padding: "15px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>{item.title}</h3>
              <p style={{ fontSize: "14px", color: "#444", marginBottom: "12px" }}>
                {item.description?.slice(0, 100)}...
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#666" }}>
                <div>
                  <div style={{ color: "#4CAF50", fontWeight: "bold" }}>
                    Rp {item.total_collected.toLocaleString("id-ID")}
                  </div>
                  <div style={{ fontSize: "12px" }}>Terkumpul</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>{getDaysLeft(item.end)} Hari</div>
                  <div style={{ fontSize: "12px" }}>Sisa Hari</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bagian Statistik Donasi */}
      <div style={{ 
        backgroundColor: "#4CAF50", 
        color: "#fff", 
        padding: "40px 20px", 
        marginTop: "50px", 
        borderRadius: "10px",
        display: "flex", 
        justifyContent: "space-around", 
        flexWrap: "wrap", 
        textAlign: "center" 
      }}>
        <div style={{ flex: "1 1 200px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "30px", margin: 0 }}>{totalCampaign}</h3>
          <p style={{ margin: 0 }}>Campaign</p>
        </div>
        <div style={{ flex: "1 1 200px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "30px", margin: 0 }}>Rp {totalDonasi.toLocaleString("id-ID")}</h3>
          <p style={{ margin: 0 }}>Donasi Terkumpul</p>
        </div>
        <div style={{ flex: "1 1 200px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "30px", margin: 0 }}>{totalTransaksi.toLocaleString("id-ID")}</h3>
          <p style={{ margin: 0 }}>Transaksi Campaign</p>
        </div>
      </div>
    </div>
  );
}
