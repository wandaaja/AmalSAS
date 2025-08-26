import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { API } from "../config/api";
import "./ChangePassword.css";

export default function ChangePassword({ show, onHide }) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordType, setPasswordType] = useState("password");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!show) {
      // Reset form when modal closes
      setForm({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
      setPasswordType("password");
      setMessage(null);
    }
  }, [show]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (form.newPassword !== form.confirmNewPassword) {
      setMessage("New passwords don't match!");
      return;
    }
    
    if (form.newPassword.length < 8) {
      setMessage("Password must be at least 8 characters long");
      return;
    }
    
    try {
      await API.put(`/users/change-password`, {
        old_password: form.oldPassword,
        new_password: form.newPassword
      });

      alert("Password changed successfully!");
      onHide();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to change password";
      setMessage(errorMsg);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered
      backdrop="static"
      keyboard={false}
      size="md"
      className="change-password-modal"
    >
      <Modal.Header closeButton className="modal-header">
        <Modal.Title className="modal-title">Change Password</Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body">
        {message && (
          <div className="alert alert-danger alert-message">
            {message}
          </div>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4 form-group">
            <Form.Label htmlFor="oldPassword" className="form-label">
              Old Password
            </Form.Label>
            <div className="password-input-group">
              <Form.Control
                size="lg"
                type={passwordType}
                id="oldPassword"
                name="oldPassword"
                placeholder="Type your old password"
                value={form.oldPassword}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-4 form-group">
            <Form.Label htmlFor="newPassword" className="form-label">
              New Password
            </Form.Label>
            <div className="password-input-group">
              <Form.Control
                size="lg"
                type={passwordType}
                id="newPassword"
                name="newPassword"
                placeholder="Type your new password"
                value={form.newPassword}
                onChange={handleChange}
                className="form-control"
                required
                minLength={8}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-4 form-group">
            <Form.Label htmlFor="confirmNewPassword" className="form-label">
              Confirm New Password
            </Form.Label>
            <div className="password-input-group">
              <Form.Control
                size="lg"
                type={passwordType}
                id="confirmNewPassword"
                name="confirmNewPassword"
                placeholder="Confirm your new password"
                value={form.confirmNewPassword}
                onChange={handleChange}
                className="form-control"
                required
                minLength={8}
              />
            </div>
          </Form.Group>

          <div className="w-100 mb-4 password-toggle">
            <span
              className={passwordType === "password" ? "peek-password" : "hide-password"}
              onClick={togglePasswordVisibility}
            >
              {passwordType === "password" ? "Show Password" : "Hide Password"}
            </span>
          </div>

          <Button
            size="lg"
            type="submit"
            className="submit-button"
          >
            Save Changes
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}