import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from "../config/api";

const CampaignForm = ({ initialData = {}, isEdit = false, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    details: '',
    start: '',
    end: '',
    cpocket: '',
    status: 'active',
    target_total: '',
    category: '',
    isCustomCategory: false,
    location: '',
    photo: null,
    ...initialData
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(initialData.photo_url || null);

  useEffect(() => {
    console.log('API base URL:', API.defaults.baseURL);
    console.log('Initial data:', initialData);
    console.log('Is edit mode:', isEdit);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(initialData.photo_url || null);
    }
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      category: value === 'lainnya' ? '' : value,
      isCustomCategory: value === 'lainnya'
    }));
  };

  const handleCustomCategoryInput = (e) => {
    setFormData(prev => ({
      ...prev,
      category: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError('');

  try {
    if (isEdit) {
      // Untuk EDIT: Gunakan JSON (seperti sebelumnya)
      const payload = {
        title: formData.title,
        description: formData.description,
        details: formData.details,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
        target_total: parseFloat(formData.target_total),
        category: formData.category,
        location: formData.location,
        status: formData.status,
        cpocket: formData.cpocket,
      };

      const response = await API.put(`/campaigns/edit/${initialData.id}`, payload);
      console.log('Edit response:', response.data);

      // Upload photo terpisah jika ada
      if (formData.photo instanceof File) {
        const photoFormData = new FormData();
        photoFormData.append('photo', formData.photo);
        await API.post(`/campaigns/${initialData.id}/upload-photo`, photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

    } else {
      // Untuk CREATE: Gunakan FormData
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('details', formData.details);
      formDataToSend.append('start', new Date(formData.start).toISOString().split('T')[0]); // Format YYYY-MM-DD
      formDataToSend.append('end', new Date(formData.end).toISOString().split('T')[0]); // Format YYYY-MM-DD
      formDataToSend.append('target_total', formData.target_total);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('cpocket', formData.cpocket);
      
      if (formData.photo instanceof File) {
        formDataToSend.append('photo', formData.photo);
      }

      const response = await API.post('/campaigns/add', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Create response:', response.data);
    }

    alert(`Campaign berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`);
    navigate('/admin/dashboard');
    
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    setError(err.response?.data?.message || 'Terjadi kesalahan');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        {isEdit ? 'Edit Campaign: ' + formData.title : 'Tambah Campaign Baru'}
      </h2>

      {error && (
        <div style={{ 
          color: '#d32f2f', 
          backgroundColor: '#ffebee', 
          padding: '15px', 
          marginBottom: '20px', 
          border: '1px solid #d32f2f',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Judul Campaign:
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            placeholder="Masukkan judul campaign"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Deskripsi Singkat:
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            placeholder="Deskripsi singkat campaign"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Details Campaign:
          </label>
          <textarea
            name="details"
            value={formData.details}
            onChange={handleChange}
            required
            rows="5"
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
            placeholder="Detail lengkap campaign"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Target Total (Rp):
          </label>
          <input
            type="number"
            name="target_total"
            value={formData.target_total}
            onChange={handleChange}
            required
            min="1"
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            placeholder="Contoh: 25000000"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Kategori:
          </label>
          <select
            value={formData.isCustomCategory ? 'lainnya' : formData.category}
            onChange={handleCategoryChange}
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
          >
            <option value="">Pilih Kategori</option>
            <option value="pendidikan">Pendidikan</option>
            <option value="kesehatan">Kesehatan</option>
            <option value="sosial">Sosial</option>
            <option value="bencana">Bencana Alam</option>
            <option value="lainnya">Lainnya</option>
          </select>
          
          {formData.isCustomCategory && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                Masukkan Kategori Lainnya:
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={handleCustomCategoryInput}
                required
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  border: '1px solid #ddd',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="Masukkan kategori lainnya"
              />
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Lokasi:
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            placeholder="Lokasi campaign"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Nomor Rekening/CPocket:
          </label>
          <input
            type="text"
            name="cpocket"
            value={formData.cpocket}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            placeholder="Nomor rekening atau dompet digital"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Status:
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Tanggal Mulai:
          </label>
          <input
            type="date"
            name="start"
            value={formData.start}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Tanggal Berakhir:
          </label>
          <input
            type="date"
            name="end"
            value={formData.end}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Foto Campaign: (Wajib)
          </label>
          {previewImage && (
            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
              <img 
                src={previewImage} 
                alt="Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }} 
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Preview gambar
              </p>
            </div>
          )}
          <input
            type="file"
            name="photo"
            onChange={handleFileChange}
            accept="image/*"
            required={!isEdit} // Wajib untuk create, optional untuk edit
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
          />
          {isEdit && !previewImage && (
            <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
              Tidak ada gambar yang diupload sebelumnya
            </p>
          )}
          <p style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>
            Ukuran maksimal: 10MB. Format: JPG, PNG, JPEG
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px', 
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '14px 28px',
              backgroundColor: isSubmitting ? '#cccccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              minWidth: '160px',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) e.target.style.backgroundColor = '#45a049';
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) e.target.style.backgroundColor = '#4CAF50';
            }}
          >
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Update Campaign' : 'Simpan Campaign'}
          </button>
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/campaigns/${initialData.id}` : '/admin/dashboard')}
            disabled={isSubmitting}
            style={{
              padding: '14px 28px',
              backgroundColor: isSubmitting ? '#cccccc' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              minWidth: '120px',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) e.target.style.backgroundColor = '#d32f2f';
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) e.target.style.backgroundColor = '#f44336';
            }}
          >
            Batal
          </button>
        </div>
      </form>

      {/* Debug info - bisa dihapus di production */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666'
      }}>
        <strong>Debug Info:</strong><br />
        API Base: {API.defaults.baseURL}<br />
        Mode: {isEdit ? 'Edit' : 'Create'}<br />
        Campaign ID: {initialData.id || 'New'}
      </div>
    </div>
  );
};

export default CampaignForm;