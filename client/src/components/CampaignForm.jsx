import React, { useState } from 'react';
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

    // Validations
    if (formData.isCustomCategory && !formData.category) {
      setError('Harap masukkan kategori lainnya');
      setIsSubmitting(false);
      return;
    }
    
    if (new Date(formData.end) <= new Date(formData.start)) {
      setError('Tanggal berakhir harus setelah tanggal mulai');
      setIsSubmitting(false);
      return;
    }

    if (parseFloat(formData.target_total) <= 0) {
      setError('Target total harus lebih besar dari nol');
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'isCustomCategory' && key !== 'photo_url') {
          formDataToSend.append(key, value);
        }
      });

      const token = localStorage.getItem('token');
    const endpoint = isEdit 
      ? `/campaigns/edit/${initialData.id}` 
      : '/campaigns/add';
    const method = isEdit ? 'put' : 'post';

    await API[method](endpoint, formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });

    alert(`Campaign berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`);
    navigate('/admin/dashboard');
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    setError(err.response?.data?.message || `Gagal ${isEdit ? 'memperbarui' : 'membuat'} campaign`);
  } finally {
    setIsSubmitting(false);
  }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {error && (
        <div style={{ 
          color: 'red', 
          padding: '10px', 
          marginBottom: '20px', 
          border: '1px solid red',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Judul Campaign:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Deskripsi Singkat:</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Details Campaign:</label>
          <textarea
            name="details"
            value={formData.details}
            onChange={handleChange}
            required
            rows="5"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Target Total (Rp):</label>
          <input
            type="number"
            name="target_total"
            value={formData.target_total}
            onChange={handleChange}
            required
            min="1"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Kategori:</label>
          <select
            value={formData.isCustomCategory ? 'lainnya' : formData.category}
            onChange={handleCategoryChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
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
              <label style={{ display: 'block', marginBottom: '8px' }}>Masukkan Kategori Lainnya:</label>
              <input
                type="text"
                value={formData.category}
                onChange={handleCustomCategoryInput}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                placeholder="Masukkan kategori lainnya"
              />
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Lokasi:</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Nomor Rekening/CPocket:</label>
          <input
            type="text"
            name="cpocket"
            value={formData.cpocket}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            placeholder="Nomor rekening atau dompet digital"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Status:</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Tanggal Mulai:</label>
          <input
            type="date"
            name="start"
            value={formData.start}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Tanggal Berakhir:</label>
          <input
            type="date"
            name="end"
            value={formData.end}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Foto Campaign:</label>
          {previewImage && (
            <div style={{ marginBottom: '10px' }}>
              <img 
                src={previewImage} 
                alt="Preview" 
                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} 
              />
            </div>
          )}
          <input
            type="file"
            name="photo"
            onChange={handleFileChange}
            accept="image/*"
            style={{ width: '100%', padding: '8px' }}
          />
          {isEdit && !previewImage && (
            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '5px' }}>
              Tidak ada gambar yang diupload sebelumnya
            </p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              backgroundColor: isSubmitting ? '#cccccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Update Campaign' : 'Simpan Campaign'}
          </button>
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/campaigns/${initialData.id}` : '/')}
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              backgroundColor: isSubmitting ? '#cccccc' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaignForm;