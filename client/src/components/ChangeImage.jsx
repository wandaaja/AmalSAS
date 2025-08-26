import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { API } from "../config/api";
import "./ChangeImage.css";

export default function ChangeImageModal({ show, onHide }) {
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!show) {
      setImage(null);
    }
  }, [show]);

  const handleChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);

      await API.patch("/change-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Profile image updated successfully!");
      onHide();
    } catch (err) {
      console.error(err);
      alert("Failed to update image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered
      backdrop="static"
      keyboard={false}
      className="change-image-modal"
    >
      <Modal.Header closeButton className="modal-header">
        <Modal.Title className="modal-title">Change Profile Image</Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body">
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formFile" className="mb-4 form-group">
            <Form.Label className="form-label">Select New Image</Form.Label>
            <Form.Control 
              type="file" 
              accept="image/*" 
              onChange={handleChange} 
              required 
              className="form-control"
            />
          </Form.Group>
          <Button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}