import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API, getImageUrl } from '../config/api';
import { UserContext } from '../context/userContext';
import SignInModal from '../components/SignIn';
import SignUpModal from '../components/SignUp';

const dummyCampaigns = [
  {
    id: "1",
    title: "Wakaf Inkubator untuk Bayi Kritis di NICU",
    description: "Wakaf Alat Kesehatan, Selamatkan Hidup Bayi di NICU",
    start: "2025-06-01T00:00:00Z",
    end: "2025-08-31T00:00:00Z",
    cpocket: "BCA 12345678 a.n AmalSAS",
    status: "Active",
    photo: "https://via.placeholder.com/600x400?text=Inkubator+NICU",
    total_collected: 40182010,
    user_id: 1,
    user_name: "AmalSAS Foundation",
    created_at: "2025-06-01T00:00:00Z"
  },
];

const DetailCampaign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state] = useContext(UserContext);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isAdmin = state.isLogin && state.user?.is_admin;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.REACT_APP_MIDTRANS_CLIENT_KEY);
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await API.get(`/campaigns/${id}`);
        setCampaign(res.data.data);
      } catch (err) {
        console.warn("Data gagal diambil dari server, fallback ke dummy");
        const fallback = dummyCampaigns.find(c => c.id === id);
        setCampaign(fallback || null);
      }
    };
    fetchCampaign();
  }, [id]);

  const handleDonate = async () => {
    if (!state.isLogin) {
      setShowLoginModal(true);
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Masukkan jumlah donasi yang valid.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await API.post("/donations", {
        amount: Number(amount),
        status: "pending",
        user_id: state.user.id,
        campaign_id: Number(id),
      });

      const token = res.data.data.payment_url;
      window.snap.pay(token, {
        onSuccess: () => navigate("/donation-success"),
        onPending: () => navigate("/donation-pending"),
        onError: (err) => console.error(err),
        onClose: () => alert("Transaksi dibatalkan."),
      });
    } catch (err) {
      console.error("Gagal memproses donasi:", err);
      alert("Terjadi kesalahan saat memproses donasi");
    } finally {
      setIsLoading(false);
    }
  };

  if (!campaign) {
    return (
      <div style={{ 
        textAlign: 'center', 
        marginTop: '50px',
        padding: '40px 5%',
        backgroundColor: '#f9f9f9',
        minHeight: '100vh'
      }}>
        <h3>Data tidak ditemukan</h3>
      </div>
    );
  }

  const targetAmount = campaign.target_total || 0;
  const collected = campaign.total_collected || 0;
  const percent = targetAmount > 0 ? (collected / targetAmount) * 100 : 0;
  const remainingDays = Math.max(
    Math.ceil((new Date(campaign.end) - new Date()) / (1000 * 60 * 60 * 24)),
    0
  );

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '40px 5%',
      gap: '40px',
      backgroundColor: '#f9f9f9',
      minHeight: '100vh'
    }}>
      <div style={{ flex: '1 1 600px', maxWidth: '600px' }}>
        <img 
          src={getImageUrl(campaign.photo)} 
          alt={campaign.title} 
          style={{
            width: '100%',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            objectFit: 'cover',
            maxHeight: '500px'
          }} 
        />
      </div>

      <div style={{
        flex: '1 1 400px',
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        minWidth: '320px'
      }}>
        <div style={{ marginBottom: '15px', fontSize: '14px', color: '#777' }}>
          {campaign.category}
        </div>
        
        <h2 style={{ 
          fontSize: '22px', 
          marginBottom: '10px', 
          color: '#222',
          fontWeight: '600'
        }}>
          {campaign.title}
        </h2>
        
        <div style={{ 
          marginBottom: '10px', 
          color: '#888', 
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          📍 {campaign.location}
        </div>
        
        <div style={{ 
          marginBottom: '15px', 
          color: '#555',
          fontWeight: '500'
        }}>
          <strong>{campaign.user_name}</strong>
        </div>
        
        <div style={{
          backgroundColor: '#e6f4ea',
          color: '#207a41',
          padding: '8px 12px',
          borderRadius: '5px',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          Penggalangan ini bagian dari Donasi {campaign.category}
        </div>

        <div style={{
          fontSize: '22px',
          fontWeight: '600',
          color: '#388e3c',
          marginBottom: '5px'
        }}>
          Rp {campaign.total_collected.toLocaleString('id-ID')}
        </div>
        
        <div style={{ 
          fontSize: '13px', 
          marginBottom: '15px', 
          color: '#666' 
        }}>
          {percent.toFixed(2)}% dari target Rp {targetAmount.toLocaleString('id-ID')}
        </div>

        <div style={{
          height: '10px',
          backgroundColor: '#e0e0e0',
          borderRadius: '5px',
          overflow: 'hidden',
          marginBottom: '15px'
        }}>
          <div style={{
            height: '100%',
            width: `${percent}%`,
            backgroundColor: '#4caf50',
            transition: 'width 0.5s ease'
          }} />
        </div>

        <div style={{
          fontSize: '13px',
          color: '#666',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          ⏳ {remainingDays} hari lagi
        </div>

        {state.isLogin ? (
          <>
            <input
              type="number"
              placeholder="Masukkan nominal donasi"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                transition: 'border 0.3s ease'
              }}
              min="1000"
              step="1000"
            />

            <button
              onClick={handleDonate}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#6c757d' : '#4CAF50',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                width: '100%',
                marginBottom: '20px',
                transition: 'background-color 0.3s ease'
              }}
            >
              {isLoading ? 'Memproses...' : 'Donasi Sekarang'}
            </button>
          </>
        ) : (
          <div style={{
            color: '#d32f2f',
            fontWeight: '500',
            textAlign: 'center',
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#ffebee',
            borderRadius: '8px'
          }}>
            Anda belum login.{" "}
            <span
              onClick={() => setShowLoginModal(true)}
              style={{
                color: '#1976d2',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Login sekarang
            </span>{" "}
            untuk berdonasi.
          </div>
        )}

        {isAdmin && (
          <div style={{ 
            marginTop: '30px',
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => navigate(`/admin/campaigns/edit/${id}`)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#1976D2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Edit Campaign
            </button>
            <button
              onClick={() => {
                if (window.confirm("Yakin ingin menghapus campaign ini?")) {
                  // Add delete logic here
                  navigate('/');
                }
              }}
              style={{
                padding: '10px 16px',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Hapus
            </button>
          </div>
        )}
      </div>
      <div style={{
  width: '100%',
  marginTop: '40px',
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  lineHeight: '1.6',
  color: '#333',
  maxWidth: '800px'
}}>
  <h4 style={{ marginBottom: '15px', fontWeight: '600' }}>Tentang Campaign</h4>
  {campaign.description ? (
    <div dangerouslySetInnerHTML={{ __html: campaign.description }} />
  ) : (
    <p>Deskripsi belum tersedia untuk campaign ini.</p>
  )}
</div>

      <SignInModal 
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        openSignUp={() => {
          setShowLoginModal(false);
          setShowSignUpModal(true);
        }}
      />

      <SignUpModal 
        show={showSignUpModal}
        onHide={() => setShowSignUpModal(false)}
        openSignIn={() => {
          setShowSignUpModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
};

export default DetailCampaign;