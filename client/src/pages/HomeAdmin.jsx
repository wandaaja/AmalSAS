import { useEffect } from "react";
import Container from "react-bootstrap/esm/Container";
import Table from "react-bootstrap/Table";
import { API } from "../config/api";
import { useQuery } from "@tanstack/react-query";
import { formatRupiah } from "../utils/currencyFormat";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
import { FaBook, FaHandsHelping } from "react-icons/fa";

// Dummy fallback data
const dummyCampaigns = [
  {
    id: 1,
    title: "Bantuan Pendidikan Anak Yatim",
    category: "pendidikan",
    target_total: 5000000,
    totalCollected: 3200000,
    status: "active",
    location: "Jakarta",
    donorCount: 12,
    donations: [
      { user: { fullname: "Andi Wijaya" }, amount: 500000 },
      { user: { fullname: "Budi Santoso" }, amount: 300000 }
    ]
  },
  {
    id: 2,
    title: "Bantuan Korban Banjir",
    category: "bencana",
    target_total: 10000000,
    totalCollected: 7500000,
    status: "active",
    location: "Bekasi",
    donorCount: 8,
    donations: [
      { user: { fullname: "Citra Dewi" }, amount: 1000000 },
      { user: { fullname: "Dian Putra" }, amount: 500000 }
    ]
  }
];

function HomeAdmin() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.background = "rgba(196, 196, 196, 0.25)";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  const { data: campaigns = dummyCampaigns, error: campaignsError } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      try {
        const response = await API.get("/campaigns");
        const data = response.data.data?.campaigns;
        console.log("Fetched campaigns:", data);
        return Array.isArray(data) ? data : dummyCampaigns;
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        return dummyCampaigns;
      }
    }
  });

  const campaignData = campaigns?.map(campaign => ({
    ...campaign,
    progressPercentage: Math.min(100, (campaign.totalCollected / campaign.target_total) * 100)
  }));

  return (
    <Container fluid style={{ marginTop: "100px", marginBottom: "60px", maxWidth: "100%" }}>
      <div
        style={{
          marginBottom: "20px"
        }}
      >
        <h2 style={{ marginBottom: "5px" }}>Manajemen Campaign</h2>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Kelola semua campaign yang sedang berjalan
        </p>
      </div>

      {campaignsError && (
        <Alert variant="warning" className="mb-4">
          Menggunakan data dummy karena gagal memuat dari server
        </Alert>
      )}

      <Table
        striped
        bordered
        hover
        responsive
        size="sm"
        style={{
          backgroundColor: "#fff",
          borderRadius: "10px",
          overflow: "hidden",
          width: "100%",
        }}
      >
        <thead style={{ backgroundColor: "#f8f9fa", textAlign: "center" }}>
          <tr style={{ fontWeight: "bold", fontSize: "14px" }}>
            <th>No</th>
            <th>Judul Campaign</th>
            <th>Kategori</th>
            <th>Target</th>
            <th>Terkumpul</th>
            <th>Donatur</th>
            <th>Status</th>
            <th>
              <Button
                variant="dark"
                size="sm"
                style={{
                  fontSize: "13px",
                  padding: "4px 10px",
                  fontWeight: "bold"
                }}
                onClick={() => navigate('/admin/campaigns/add')}
              >
                + Tambah Campaign
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {campaignData.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                Tidak ada campaign yang tersedia.
              </td>
            </tr>
          ) : (
            campaignData.map((campaign, index) => (
              <tr key={campaign.id} style={{ verticalAlign: "middle" }}>
                <td style={{ textAlign: "center" }}>{index + 1}</td>
                <td>{campaign.title}</td>
                <td>
                  {campaign.category === "pendidikan" && <FaBook style={{ marginRight: 6, color: "#0d6efd" }} />}
                  {campaign.category === "bencana" && <FaHandsHelping style={{ marginRight: 6, color: "#dc3545" }} />}
                  {campaign.category}
                </td>
                <td style={{ textAlign: "center" }}>{formatRupiah(campaign.target_total)}</td>
                <td>
                  <div>{formatRupiah(campaign.totalCollected || 0)}</div>
                  <div className="progress mt-1" style={{ height: "8px", backgroundColor: "#eee" }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{
                        width: `${campaign.progressPercentage}%`,
                        backgroundColor: "#198754"
                      }}
                    />
                  </div>
                  <small className="text-muted">
                    {campaign.progressPercentage.toFixed(1)}% tercapai
                  </small>
                </td>
                <td>
                  {campaign.donorCount} donatur
                  {campaign.donorCount > 0 && (
                    <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: "6px", fontSize: "13px" }}>
                      {campaign.donations?.slice(0, 3).map((donation, i) => (
                        <li key={i}>
                          • {donation.user?.fullname || 'Anonim'} ({formatRupiah(donation.amount)})
                        </li>
                      ))}
                      {campaign.donorCount > 3 && (
                        <li style={{ color: "#888" }}>
                          +{campaign.donorCount - 3} lainnya
                        </li>
                      )}
                    </ul>
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 600,
                      backgroundColor:
                        campaign.status === 'active'
                          ? "#198754"
                          : campaign.status === 'completed'
                          ? "#0d6efd"
                          : "#6c757d",
                      color: "#fff"
                    }}
                  >
                    {campaign.status === 'active'
                      ? 'Aktif'
                      : campaign.status === 'completed'
                      ? 'Selesai'
                      : 'Nonaktif'}
                  </span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => navigate(`/admin/campaigns/edit/${campaign.id}`)}
                    style={{ padding: "4px 10px", fontSize: "13px" }}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default HomeAdmin;
