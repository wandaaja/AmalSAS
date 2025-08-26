import React, { useState } from "react";
import { Modal, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useMutation } from "@tanstack/react-query";
import { API } from "../config/api";
import { FaEnvelope, FaCheckCircle, FaArrowLeft } from "react-icons/fa";

export default function ForgotPasswordModal({ show, onHide, openSignIn, zIndex }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validated, setValidated] = useState(false);

  const { mutate, isLoading } = useMutation({
    mutationFn: async () => {
      const response = await API.post("/auth/forgot-password", { email });
      return response.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setMessage({
        type: "success",
        text: "Tautan reset password telah dikirim ke email Anda!",
      });
    },
    onError: (error) => {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Gagal mengirim tautan reset",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    mutate();
  };

  const handleBackToSignIn = () => {
    onHide();
    if (typeof openSignIn === 'function') {
      openSignIn();
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      backdrop="static"
      dialogClassName="custom-forgot-modal"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1060,
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title className="w-100 text-center">
          <h3 className="fw-bold text-primary">
            {success ? "Cek Email Anda" : "Lupa Password"}
          </h3>
          <p className="text-muted small mb-0">
            {success
              ? "Kami telah mengirim instruksi ke email Anda"
              : "Masukkan email untuk mereset password"}
          </p>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {message && (
          <Alert variant={message.type} className="text-center">
            {message.text}
          </Alert>
        )}

        {success ? (
          <div className="text-center py-4">
            <FaCheckCircle className="text-success mb-3" size={48} />
            <p>
              Kami telah mengirim tautan reset password ke <strong>{email}</strong>. 
              Silakan cek inbox email Anda.
            </p>
            <Button 
              variant="primary" 
              onClick={handleBackToSignIn}
              className="mt-3"
            >
              <FaArrowLeft className="me-2" /> Kembali ke Masuk
            </Button>
          </div>
        ) : (
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>
                <FaEnvelope className="me-2" />
                Alamat Email
              </Form.Label>
              <Form.Control
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email terdaftar"
              />
              <Form.Control.Feedback type="invalid">
                Harap masukkan alamat email yang valid
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              className="w-100 py-2 fw-bold mb-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Mengirim...
                </>
              ) : (
                "Kirim Tautan Reset"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-link text-decoration-none"
                onClick={handleBackToSignIn}
              >
                <FaArrowLeft className="me-2" /> Kembali ke Masuk
              </button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}