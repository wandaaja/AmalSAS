import React, { useState } from "react";
import { Modal, Form, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import { useMutation } from "@tanstack/react-query";
import { API } from "../config/api";
import { 
  FaEnvelope, 
  FaCheckCircle, 
  FaArrowLeft, 
  FaWhatsapp,
  FaShieldAlt 
} from "react-icons/fa";
import "./ForgotPass.css"

export default function ForgotPasswordModal({ show, onHide, openSignIn }) {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sendMethod, setSendMethod] = useState("email");
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validated, setValidated] = useState(false);

  const { mutate, isLoading } = useMutation({
    mutationFn: async () => {
      const payload = { email };
      
      if (sendMethod === "whatsapp") {
        payload.whatsapp = whatsapp;
      }
      
      const response = await API.post("/forgot-password", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setSuccess(true);
      const channel = data.data?.channel || sendMethod;
      setMessage({
        type: "success",
        text: `Tautan reset password telah dikirim via ${channel === "whatsapp" ? "WhatsApp" : "email"}!`,
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          "Gagal mengirim tautan reset. Silakan coba lagi.";
      
      setMessage({
        type: "danger",
        text: errorMessage,
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

    // Validasi tambahan
    if (sendMethod === "whatsapp" && !whatsapp.trim()) {
      setMessage({
        type: "danger",
        text: "Nomor WhatsApp harus diisi",
      });
      return;
    }

    if (sendMethod === "email" && !email.trim()) {
      setMessage({
        type: "danger",
        text: "Email harus diisi",
      });
      return;
    }

    mutate();
  };

  const handleBackToSignIn = () => {
    setEmail("");
    setWhatsapp("");
    setMessage(null);
    setSuccess(false);
    setValidated(false);
    onHide();
    
    if (typeof openSignIn === 'function') {
      setTimeout(() => openSignIn(), 300);
    }
  };

  const handleMethodChange = (method) => {
    setSendMethod(method);
    setMessage(null);
  };

  const handleClose = () => {
    setEmail("");
    setWhatsapp("");
    setMessage(null);
    setSuccess(false);
    setValidated(false);
    onHide();
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      centered 
      backdrop="static"
      size="lg"
      className="forgot-password-modal"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="w-100 text-center">
          <div className="d-flex justify-content-center mb-3">
            <div className="bg-primary rounded-circle p-3">
              <FaShieldAlt size={32} className="text-white" />
            </div>
          </div>
          <h3 className="fw-bold text-dark mb-2">
            {success ? "Permintaan Dikirim!" : "Lupa Password"}
          </h3>
          <p className="text-muted mb-0">
            {success
              ? "Instruksi reset telah dikirim ke Anda"
              : "Pilih metode untuk mereset password Anda"}
          </p>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-0">
        {message && (
          <Alert 
            variant={message.type} 
            className="text-center mb-4"
            dismissible
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {success ? (
          <div className="text-center py-3">
            <FaCheckCircle className="text-success mb-3" size={48} />
            <h5 className="text-success mb-3">Permintaan Berhasil Dikirim!</h5>
            <p className="text-muted mb-4">
              Kami telah mengirim tautan reset password ke{" "}
              <strong className="text-dark">
                {sendMethod === "whatsapp" ? whatsapp : email}
              </strong>
              . Silakan cek {sendMethod === "whatsapp" ? "WhatsApp" : "email"} Anda 
              dan ikuti instruksi yang diberikan.
            </p>
            
            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                onClick={handleBackToSignIn}
                size="lg"
              >
                <FaArrowLeft className="me-2" /> Kembali ke Login
              </Button>
              
              <Button 
                variant="outline-secondary" 
                onClick={handleClose}
              >
                Tutup
              </Button>
            </div>
          </div>
        ) : (
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            {/* Pilihan Metode */}
            <div className="mb-4">
              <Form.Label className="fw-semibold mb-3">Pilih Metode Pengiriman</Form.Label>
              <Row className="g-3">
                <Col md={6}>
                  <div 
                    className={`method-card p-4 rounded-3 border cursor-pointer text-center ${
                      sendMethod === "email" 
                        ? "border-primary bg-primary-light" 
                        : "border-gray-300"
                    }`}
                    onClick={() => handleMethodChange("email")}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: sendMethod === "email" ? 'rgba(13, 110, 253, 0.1)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaEnvelope 
                      size={32} 
                      className={`mb-3 ${
                        sendMethod === "email" ? "text-primary" : "text-muted"
                      }`} 
                    />
                    <h6 className={sendMethod === "email" ? "text-primary" : "text-dark"}>
                      Email
                    </h6>
                    <small className="text-muted">Kirim link reset via email</small>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div 
                    className={`method-card p-4 rounded-3 border cursor-pointer text-center ${
                      sendMethod === "whatsapp" 
                        ? "border-success bg-success-light" 
                        : "border-gray-300"
                    }`}
                    onClick={() => handleMethodChange("whatsapp")}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: sendMethod === "whatsapp" ? 'rgba(25, 135, 84, 0.1)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaWhatsapp 
                      size={32} 
                      className={`mb-3 ${
                        sendMethod === "whatsapp" ? "text-success" : "text-muted"
                      }`} 
                    />
                    <h6 className={sendMethod === "whatsapp" ? "text-success" : "text-dark"}>
                      WhatsApp
                    </h6>
                    <small className="text-muted">Kirim link reset via WhatsApp</small>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Input Field berdasarkan metode */}
            {sendMethod === "email" ? (
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  <FaEnvelope className="me-2 text-primary" />
                  Alamat Email Terdaftar
                </Form.Label>
                <Form.Control
                  required
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setMessage(null);
                  }}
                  placeholder="contoh: user@email.com"
                  className="py-3"
                  disabled={isLoading}
                />
                <Form.Control.Feedback type="invalid">
                  Harap masukkan alamat email yang valid
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Pastikan email yang dimasukkan terdaftar di sistem kami
                </Form.Text>
              </Form.Group>
            ) : (
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  <FaWhatsapp className="me-2 text-success" />
                  Nomor WhatsApp Terdaftar
                </Form.Label>
                <Form.Control
                  required
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value);
                    setMessage(null);
                  }}
                  placeholder="Contoh: +628123456789"
                  className="py-3"
                  disabled={isLoading}
                />
                <Form.Control.Feedback type="invalid">
                  Harap masukkan nomor WhatsApp yang valid
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Pastikan nomor WhatsApp terdaftar di akun Anda. Format: +628...
                </Form.Text>
              </Form.Group>
            )}

            {/* Tombol Submit */}
            <div className="d-grid mb-3">
              <Button
                type="submit"
                variant={sendMethod === "email" ? "primary" : "success"}
                size="lg"
                className="py-3 fw-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {sendMethod === "email" ? "Mengirim Email..." : "Mengirim WhatsApp..."}
                  </>
                ) : (
                  <>
                    {sendMethod === "email" ? "Kirim Link Reset" : "Kirim via WhatsApp"}
                  </>
                )}
              </Button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <button
                type="button"
                className="btn btn-link text-decoration-none text-muted"
                onClick={handleBackToSignIn}
                disabled={isLoading}
              >
                <FaArrowLeft className="me-2" /> Kembali ke Halaman Login
              </button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}