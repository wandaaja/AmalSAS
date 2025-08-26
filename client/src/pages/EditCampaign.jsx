import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../config/api';
import CampaignForm from '../components/CampaignForm';
import Loading from '../components/Loading';

const EditCampaign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await API.get(`/campaigns/${id}`);
        
        const data = response.data.data;
        const formattedData = {
          ...data,
          start: data.start.split('T')[0],
          end: data.end.split('T')[0],
          photo_url: data.photo || null
        };
        
        setCampaignData(formattedData);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat data campaign');
        console.error('Error fetching campaign:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const handleSuccess = (updatedData) => {
    navigate(`/campaigns/${id}`, { state: { updated: true } });
  };

  if (loading) {
    return <Loading fullScreen text="Memuat data campaign..." />;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ color: 'red', padding: '20px', backgroundColor: '#ffeeee', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
        <button 
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#2c3e50', fontSize: '28px' }}>
        Edit Campaign: {campaignData?.title}
      </h1>
      <CampaignForm 
        initialData={campaignData} 
        isEdit={true}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default EditCampaign;
