import React, { useState } from "react";
import { Modal, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useMutation } from "@tanstack/react-query";
import { API } from "../config/api";
import { FaKey, FaCheckCircle, FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPasswordModal({ show, onHide, token, email }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validated, setValidated] = useState(false);

  const { mutate, isLoading } = useMutation({
    mutationFn: async () => {
      const response = await API.post("/auth/reset-password", {
        token,
        new_password: password
      });
      return response.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setMessage({
        type: "success",
        text: "Password berhasil direset! Silakan login dengan password baru Anda.",
      });
    },
    onError: (error) => {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Gagal reset password. Silakan coba lagi.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false || password !== confirmPassword) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    mutate();
  };

  const handleClose = () => {
    setPassword("");
    setConfirmPassword("");
    setMessage(null);
    setSuccess(false);
    setValidated(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="w-100 text-center">
          <div className="d-flex justify-content-center mb-3">
            <div className="bg-primary rounded-circle p-3">
              <FaKey size={24} className="text-white" />
            </div>
          </div>
          <h3 className="fw-bold text-dark mb-2">
            {success ? "Berhasil!" : "Reset Password"}
          </h3>
          {email && !success && (
            <p className="text-muted small mb-0">Untuk: {email}</p>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {message && (
          <Alert variant={message.type} className="text-center">
            {message.text}
          </Alert>
        )}

        {success ? (
          <div className="text-center py-3">
            <FaCheckCircle className="text-success mb-3" size={48} />
            <p className="text-muted mb-4">
              Password Anda telah berhasil direset. Silakan login dengan password baru.
            </p>
            <Button variant="primary" onClick={handleClose}>
              Tutup
            </Button>
          </div>
        ) : (
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Password Baru</Form.Label>
              <div className="position-relative">
                <Form.Control
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  minLength={8}
                />
                <Button
                  variant="link"
                  className="position-absolute end-0 top-0 text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
              <Form.Control.Feedback type="invalid">
                Password minimal 8 karakter
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Konfirmasi Password Baru</Form.Label>
              <Form.Control
                required
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi password baru"
                isInvalid={validated && password !== confirmPassword}
              />
              <Form.Control.Feedback type="invalid">
                Password tidak cocok
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100 py-2 fw-bold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Memproses...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}