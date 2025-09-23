import React, { useState, useContext, useEffect } from "react";
import { Modal, Button, Form, Tab, Tabs } from "react-bootstrap";
import { UserContext } from "../context/userContext";
import { API } from "../config/api";
import ChangePassword from "./ChangePassword";
import ChangeImageModal from "./ChangeImage";
import "./EditProfile.css";

export default function EditProfile({ show, onHide }) {
  const [state, dispatch] = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeImage, setShowChangeImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Set form data saat modal dibuka
  useEffect(() => {
    if (show && state.user) {
      setForm({
        first_name: state.user.first_name || state.user.name?.split(" ")[0] || "",
        last_name: state.user.last_name || state.user.name?.split(" ")[1] || "",
        username: state.user.username || "",
        email: state.user.email || "",
        phone: state.user.phone || "",
        address: state.user.address || "",
        gender: state.user.gender || "",
      });
    }
  }, [show, state.user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Token not found, please login again.");
        return;
      }

      if (!state.user?.id) {
        alert("User ID not found.");
        return;
      }

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await API.put(`/users/${state.user.id}`, form, config);

      dispatch({
        type: "USER_SUCCESS",
        payload: response.data.data,
      });

      alert("Profile updated successfully!");
      onHide();
    } catch (err) {
      console.error("Update error:", err.response || err.message);
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-profile-modal">
      <Modal
        show={show}
        onHide={onHide}
        centered
        backdrop="static"
        keyboard={false}
        size="lg"
        className="edit-profile-modal"
      >
        <Modal.Header closeButton className="modal-header">
          <Modal.Title className="modal-title">Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4 profile-tabs"
          >
            <Tab eventKey="profile" title="Profile Info">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3 form-group">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3 form-group">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3 form-group">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3 form-group">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3 form-group">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3 form-group">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-4 form-group">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>

                <div className="d-flex justify-content-between">
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowChangeImage(true)}
                  >
                    Change Photo
                  </Button>

                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Change Password
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="submit-button mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </Form>
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>

      <ChangePassword
        show={showChangePassword}
        onHide={() => setShowChangePassword(false)}
      />

      <ChangeImageModal
        show={showChangeImage}
        onHide={() => setShowChangeImage(false)}
      />
    </div>
  );
}
