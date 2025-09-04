import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { API } from "../config/api";
import "./ChangeImage.css";

export default function ChangeImageModal({ show, onHide, onSuccess }) {
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) {
      setImage(null);
      setError("");
    }
  }, [show]);

  const handleChange = (e) => {
    setImage(e.target.files[0]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError("Please select an image");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("photo", image);
      
      console.log("Sending request to:", API.defaults.baseURL + "/change-image");
      
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);
      
      const response = await API.patch("/change-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("Success response:", response.data);
      alert("Profile image updated successfully!");
      
      if (onSuccess) {
        onSuccess(response.data.data.user);
      }
      
      onHide();
      
    } catch (err) {
      console.error("Full error:", err);
      console.error("Error response:", err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Failed to update image";
      
      setError(errorMessage);
      alert("Error: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="change-image-modal">
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
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formFile" className="mb-4 form-group">
            <Form.Label className="form-label">Select New Image</Form.Label>
            <Form.Control 
              type="file" 
              accept="image/*" 
              onChange={handleChange} 
              required 
              className="form-control"
              disabled={isLoading}
            />
          </Form.Group>
          <Button 
            type="submit" 
            className="submit-button"
            disabled={isLoading || !image}
          >
            {isLoading ? "Uploading..." : "Upload Image"}
          </Button>
        </Form>
      </Modal.Body>
      
    </Modal>
    </div>
  );
}