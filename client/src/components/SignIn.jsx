import React, { useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { useMutation } from "@tanstack/react-query";
import { API } from "../config/api";
import ForgotPasswordModal from "./ForgotPassword";

export default function SignInModal({ show, onHide, openSignUp }) {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    value: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = useMutation({
    mutationFn: async () => {
      const response = await API.post("/signin", form);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.data.token); 
      onHide();
      window.location.reload();
    },
    onError: (error) => {
      setMessage(error.response?.data?.message || "Login failed");
    }
  });

  return (
  <>
    {!showForgotPassword && (
      <Modal 
        show={show} 
        onHide={onHide}
        centered
        backdrop="static"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1050,
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Masuk ke Akun Anda</Modal.Title>
        </Modal.Header>

          <Modal.Body style={{
            padding: '1.5rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '100%',
          margin: '0 auto',
          backgroundColor: '#fff'
        }}>

          {message && (
            <Alert variant="danger" style={{ marginBottom: '1rem' }}>
              {message}
            </Alert>
          )}

          <Form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit.mutate();
          }}>
            {/* Form Inputs */}
            <Form.Group style={{ marginBottom: '1rem' }}>
              <Form.Control
                type="text"
                name="value"
                placeholder="Email atau Username"
                value={form.value}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group style={{ marginBottom: '1rem' }}>
              <Form.Control
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <Form.Check type="checkbox" label="Ingat Saya" />
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#007bff',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Lupa Password?
              </button>
            </div>

            <Button type="submit" className="w-100 mb-3">
              {handleSubmit.isLoading ? 'Memproses...' : 'Masuk'}
            </Button>

            <div className="text-center">
              Belum punya akun?{" "}
              <button 
                type="button"
                onClick={() => {
                  onHide();
                  openSignUp();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#007bff',
                  cursor: 'pointer'
                }}
              >
                Daftar disini
              </button>
            </div>
          </Form>
        </Modal.Body>
        
      </Modal>
    )}

    <ForgotPasswordModal
      show={showForgotPassword}
      onHide={() => setShowForgotPassword(false)}
      openSignIn={() => {
        setShowForgotPassword(false);
      }}
    />
  </>
);

}