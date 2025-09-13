import React, { useState, useRef, useEffect } from "react";
import { Modal, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useMutation, useQuery } from '@tanstack/react-query';
import { API } from "../config/api";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaHome, FaCrown } from "react-icons/fa";
import './SignUp.css';

export default function SignUpModal({ show, onHide, openSignIn }) {
  const [message, setMessage] = useState(null);
  const [validated, setValidated] = useState(false);
  const [userType, setUserType] = useState('user');
  const [adminCount, setAdminCount] = useState(0);
  const [canCreateAdmin, setCanCreateAdmin] = useState(true);
  
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    isAdmin: true
  });

  const formRef = useRef(null);

  
  const { data: adminData, isLoading: isLoadingAdminCount } = useQuery({
    queryKey: ['adminCount'],
    queryFn: async () => {
      try {
        const response = await API.get("/admin-count");
        return response.data;
      } catch (error) {
        console.error("Error fetching admin count:", error);
        return { admin_count: 0, can_create_admin: true };
      }
    },
    enabled: show,
    onSuccess: (data) => {
      setAdminCount(data.admin_count || 0);
      setCanCreateAdmin(data.can_create_admin !== false);
      
      if (!data.can_create_admin && userType === 'admin') {
        setUserType('user');
      }
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserTypeChange = (type) => {
    if (type === 'admin' && !canCreateAdmin) return;
    setUserType(type);
  };

  const { mutate, isLoading } = useMutation({
    mutationFn: async (payload) => {
      console.log('Sending payload:', payload);
      const response = await API.post("/signup", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setMessage({
        type: 'success',
        text: userType === 'admin' 
          ? 'Registrasi admin berhasil! Mengarahkan ke halaman login...' 
          : 'Registrasi berhasil! Mengarahkan ke halaman login...'
      });
      setTimeout(() => {
        onHide();
        openSignIn();
      }, 2000);
    },
    onError: (error) => {
      console.error("Registration error:", error);
      console.error("Error response:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || "Registrasi gagal. Silakan coba lagi.";
      
      if (error.response?.status === 403 && errorMessage.includes("admin limit")) {
        setMessage({
          type: 'error',
          text: 'Batas maksimal admin (3) telah tercapai. Silakan daftar sebagai user biasa.'
        });
        setUserType('user');
        setCanCreateAdmin(false);
      } else {
        setMessage({
          type: 'error',
          text: errorMessage
        });
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Submit button clicked');

    const formElement = formRef.current;
    if (!formElement.checkValidity()) {
      console.log('Form validation failed');
      setValidated(true);
      const invalidFields = formElement.querySelectorAll(':invalid');
      invalidFields.forEach(field => {
        field.reportValidity();
      });
      return;
    }

    if (userType === 'admin' && !canCreateAdmin) {
      setMessage({
        type: 'error',
        text: 'Tidak dapat membuat admin baru. Batas maksimal telah tercapai.'
      });
      return;
    }

    setValidated(true);

    let formattedPhone = form.phone;
    if (form.phone && form.phone.trim() !== '') {
      formattedPhone = form.phone.startsWith('+') 
        ? form.phone.replace(/\s+/g, '') 
        : `+${form.phone.replace(/\s+/g, '')}`;
    }

    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      username: form.username,
      phone: formattedPhone,
      address: form.address,
      email: form.email,
      password: form.password,
      isAdmin: userType === 'admin'
    };

    console.log('Calling mutate with payload:', payload);
    mutate(payload);
  };

  useEffect(() => {
    if (show) {
      setMessage(null);
      setValidated(false);
      setUserType('user');
      setForm({
        first_name: "",
        last_name: "",
        username: "",
        phone: "",
        address: "",
        email: "",
        password: ""
      });
    }
  }, [show]);

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      backdrop="static"
      size="md"
      className="signup-modal"
    >
      <Modal.Header closeButton className="modal-header">
        <Modal.Title className="w-100 text-center">
          <h3 className="modal-title">Buat Akun Baru</h3>
          <p className="modal-subtitle">Bergabung dengan komunitas kami</p>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="modal-body">
        {isLoadingAdminCount && (
          <div className="text-center mb-3">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Memeriksa ketersediaan admin...</span>
          </div>
        )}

        {message && (
          <Alert 
            variant={message.type === 'success' ? 'success' : 'danger'}
            className="alert-message"
          >
            {message.text}
          </Alert>
        )}

        <Form
          noValidate
          validated={validated}
          onSubmit={handleSubmit}
          ref={formRef}
          className="signup-form"
        >
          {/* Role Selection */}
          <Form.Group className="form-group">
            <Form.Label>
              <FaCrown className="icon" />
              Peran (Role)
            </Form.Label>
            {canCreateAdmin ? (
              <>
                <Form.Select
                  required
                  name="role"
                  value={userType}
                  onChange={(e) => handleUserTypeChange(e.target.value)}
                >
                  <option value="user">Donatur</option>
                  <option value="admin">Admin</option>
                </Form.Select>
                {userType === 'admin' && (
                  <Form.Text className="text-muted">
                    Status admin: {adminCount}/3 terisi
                  </Form.Text>
                )}
              </>
            ) : (
              <div className="alert alert-warning py-2 mb-0">
                <small>
                  <FaCrown className="me-1" />
                  Batas maksimal admin (3) telah tercapai. Otomatis terdaftar sebagai Donatur.
                </small>
              </div>
            )}
          </Form.Group>

          <div className="name-fields">
            <Form.Group className="form-group">
              <Form.Label>
                <FaUser className="icon" />
                Nama Depan
              </Form.Label>
              <Form.Control
                required
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                minLength={2}
                maxLength={50}
                placeholder="John"
              />
              <Form.Control.Feedback type="invalid">
                Harap masukkan nama depan yang valid (2-50 karakter)
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="form-group">
              <Form.Label>
                <FaUser className="icon" />
                Nama Belakang
              </Form.Label>
              <Form.Control
                required
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                minLength={2}
                maxLength={50}
                placeholder="Doe"
              />
              <Form.Control.Feedback type="invalid">
                Harap masukkan nama belakang yang valid (2-50 karakter)
              </Form.Control.Feedback>
            </Form.Group>
          </div>

          <Form.Group className="form-group">
            <Form.Label>
              <FaUser className="icon" />
              Username
            </Form.Label>
            <Form.Control
              required
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              placeholder="johndoe123"
            />
            <Form.Control.Feedback type="invalid">
              3-20 karakter alfanumerik dan underscore saja
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="form-group">
            <Form.Label>
              <FaEnvelope className="icon" />
              Email
            </Form.Label>
            <Form.Control
              required
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              maxLength={100}
              placeholder="john@example.com"
            />
            <Form.Control.Feedback type="invalid">
              Harap masukkan email yang valid
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="form-group">
            <Form.Label>
              <FaPhone className="icon" />
              Nomor Telepon
            </Form.Label>
            <Form.Control
              required
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              pattern="^\+[1-9]\d{1,14}$"
              placeholder="+6281234567890"
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && !value.startsWith('+')) {
                  setForm(prev => ({ ...prev, phone: `+${value}` }));
                }
              }}
            />
            <Form.Text className="form-text">
              Contoh: +6281234567890
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              Harap masukkan nomor telepon yang valid dengan kode negara
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="form-group">
            <Form.Label>
              <FaLock className="icon" />
              Password
            </Form.Label>
            <Form.Control
              required
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              maxLength={72}
              pattern="^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).*$"
              placeholder="Minimal 8 karakter"
            />
            <Form.Text className="form-text">
              Harus mengandung huruf besar, angka, dan karakter khusus
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              Password harus memenuhi persyaratan kompleksitas
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="form-group">
            <Form.Label>
              <FaHome className="icon" />
              Alamat (Opsional)
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Alamat lengkap"
            />
          </Form.Group>

          <Button 
            type="submit"
            variant={userType === 'admin' ? 'warning' : 'primary'}
            className="submit-button"
            disabled={isLoading || (userType === 'admin' && !canCreateAdmin)}
            onClick={(e) => {
              console.log('Button onClick triggered');
            }}
          >
            {isLoading && (
              <Spinner animation="border" size="sm" className="me-2" />
            )}
            {isLoading 
              ? "Memproses..." 
              : userType === 'admin' 
                ? "Daftar sebagai Admin" 
                : "Daftar sebagai Donatur"
            }
          </Button>
        </Form>

        <div className="login-redirect">
          <p className="text">
            Sudah punya akun?{" "}
            <button
              type="button"
              className="login-link"
              onClick={() => {
                onHide();
                openSignIn();
              }}
            >
              Masuk disini
            </button>
          </p>
        </div>
      </Modal.Body>
    </Modal>
  );
}