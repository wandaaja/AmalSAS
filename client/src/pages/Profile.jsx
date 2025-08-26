import React, { useState, useContext, useMemo } from "react";
import { UserContext } from "../context/userContext";
import { useQuery } from "@tanstack/react-query";
import { API, getImageUrl } from "../config/api";
import { Image, Button, Spinner, Alert } from "react-bootstrap";
import { 
  HiUserCircle, 
  HiMail 
} from "react-icons/hi";
import { 
  MdLocationPin,
  MdLock,
  MdLocalPhone,
} from "react-icons/md";
import { TbGenderBigender } from "react-icons/tb";
import ChangePassword from "../components/ChangePassword";
import ChangeImageModal from "../components/ChangeImage";
import "./Profile-css.css";
import EditProfile from "../components/EditProfile";

export default function Profile() {
  const [state] = useContext(UserContext);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeImage, setShowChangeImage] = useState(false);
  const userId = useMemo(() => state.user?.id, [state.user?.id]);
  const [showEditProfile, setShowEditProfile] = useState(false);

console.log("User data from context:", state.user);
  const { 
    data: userProfile, 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey: ["userProfileCache", userId],
    queryFn: async () => {
      console.log("Fetching user profile for ID:", userId);
      try {
        const res = await API.get(`/users/${userId}`);
        console.log("User profile data data data:", res.data.data);
        return res.data.data;
      } catch (err) {
        // Return default user data if API fails
        console.error("API Error:", err);
        return {
          ...state.user,
          image: null
        };
      }
    },
    enabled: !!userId
  });

 const displayData = useMemo(() => ({
    ...state.user,  
    ...userProfile
  }), [state.user, userProfile]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <Alert variant="danger">
          Failed to load profile: {error.message}
        </Alert>
      </div>
    );
  }

  return (
    <div className="profile-container bg-light">
      <div className="max-width">
        <div className="profile-card">
          <div className="profile-content">
            {/* Left Side - Personal Info */}
            <div className="profile-info">
              <h1 className="profile-title">
                <strong>Personal Info</strong>
              </h1>

              <Button 
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowEditProfile(true)}
                >
                  Edit Profile
                </Button>
              
              
              <div className="info-item">
                <HiUserCircle className="info-icon" />
                <div>
                  <p className="info-value">{displayData?.name || "Not provided"}</p>
                  <small className="info-label">Full name</small>
                </div>
              </div>
              
              <div className="info-item">
                <HiMail className="info-icon" />
                <div>
                  <p className="info-value">{displayData?.email || "Not provided"}</p>
                  <small className="info-label">Email</small>
                </div>
              </div>
              
              <div className="info-item">
                <MdLock className="info-icon" />
                <div>
                  <p 
                    className="info-value clickable"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Change Password
                  </p>
                  <small className="info-label">Password</small>
                </div>
              </div>            
              
              <div className="info-item">
                <TbGenderBigender className="info-icon" />
                <div>
                  <p className="info-value">{displayData?.gender || "Not specified"}</p>
                  <small className="info-label">Gender</small>
                </div>
              </div>
              
              <div className="info-item">
                <MdLocalPhone className="info-icon" />
                <div>
                  <p className="info-value">{displayData?.phone || "Not provided"}</p>
                  <small className="info-label">Phone</small>
                </div>
              </div>
              
              <div className="info-item">
                <MdLocationPin className="info-icon" />
                <div>
                  <p className="info-value">{displayData?.address || "Not provided"}</p>
                  <small className="info-label">Address</small>
                </div>
              </div>
            </div>

            {/* Right Side - Profile Image */}
            <div className="profile-image-section">
              <div className="image-wrapper">
                {displayData?.photo ? (
                  <Image 
                    src={getImageUrl(displayData.photo)} 
                    className="profile-image"
                    alt="Profile"
                  />
                ) : (
                  <HiUserCircle className="default-profile-image" />
                )}
              </div>
              
              <Button
                variant="primary"
                className="change-photo-btn"
                onClick={() => setShowChangeImage(true)}
              >
                Change Profile Photo
              </Button>
            </div>
          </div>
        </div>
      </div>
      <EditProfile 
        show={showEditProfile} 
        onHide={() => setShowEditProfile(false)} 
      />

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