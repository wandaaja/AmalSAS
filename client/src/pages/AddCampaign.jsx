import React from 'react';
import CampaignForm from '../components/CampaignForm';

const AddCampaign = () => {
  return (
    <div style={{ 
      padding: '40px 20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        color: '#2c3e50',
        fontSize: '28px'
      }}>
        Tambah Campaign Baru
      </h1>
      <CampaignForm />
    </div>
  );
};

export default AddCampaign;