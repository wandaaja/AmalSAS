import React, { useState, useRef } from "react";
import { Modal, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useMutation } from '@tanstack/react-query';
import { API } from "../config/api";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaHome } from "react-icons/fa";
import './SignUp.css';

export default function SignUpModal({ show, onHide, openSignIn }) {
  const [message, setMessage] = useState(null);
  const [validated, setValidated] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    address: "",
    email: "",
    password: ""
  });

  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const { mutate, isLoading } = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        phone: form.phone.startsWith('+') ? form.phone.replace(/\s+/g, '') : `+${form.phone.replace(/\s+/g, '')}`,
        is_admin: false
      };
      const response = await API.post("/signup", payload);
      return response.data;
    },
    onSuccess: () => {
      setMessage({
        type: 'success',
        text: 'Registrasi berhasil! Mengarahkan ke halaman login...'
      });
      setTimeout(() => {
        onHide();
        openSignIn();
      }, 2000);
    },
    onError: (error) => {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || "Registrasi gagal. Silakan coba lagi."
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const formElement = formRef.current;
    if (!formElement.checkValidity()) {
      setValidated(true);
      return;
    }

    setValidated(true);
    mutate();
  };

  return (
    <Modal 
      show={show} 
      onHide={() => {
        onHide();}} 
      centered
      backdrop="static"
      size="md"
      className="signup-modal"
    >
      <Modal.Header closeButton className="modal-header">
        <Modal.Title className="w-100 text-center">
          <h3 className="modal-title">Buat Akun Donatur</h3>
          <p className="modal-subtitle">Bergabung dengan komunitas kami untuk membuat perubahan</p>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="modal-body">
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
              pattern="[a-zA-Z0-9]+"
              placeholder="johndoe123"
            />
            <Form.Control.Feedback type="invalid">
              3-20 karakter alfanumerik saja
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
            />
            <Form.Text className="form-text">
              Contoh: +6281234567890
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              Harap masukkan nomor telepon yang valid
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
            variant="primary"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading && (
              <Spinner animation="border" size="sm" className="me-2" />
            )}
            {isLoading ? "Memproses..." : "Daftar Sekarang"}
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