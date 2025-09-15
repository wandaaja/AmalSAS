import React, { useContext, useEffect, useState } from "react";
import { Container, Table, Badge, Form, Button, Alert } from "react-bootstrap";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { API } from "../config/api";
import { UserContext } from "../context/userContext";
import { convert } from "rupiah-format";
import "./MyDonations.css";

export default function MyDonations() {
  const [state] = useContext(UserContext);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const is_admin = state.user?.is_admin;

  useEffect(() => {
    document.body.style.background = "rgba(196, 196, 196, 0.25)";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  // Fetch semua campaigns untuk filter (hanya untuk admin)
  const { data: campaignsData } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      try {
        const res = await API.get("/campaigns");
        return res.data.data?.campaigns || res.data.data || [];
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        return [];
      }
    },
    enabled: is_admin, // Hanya fetch jika admin
  });

  useEffect(() => {
    if (campaignsData) {
      setCampaigns(campaignsData);
    }
  }, [campaignsData]);

  // Fetch donations berdasarkan role user
  const {
    data: donations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["donations", state.user?.id, is_admin],
    queryFn: async () => {
      try {
        if (is_admin) {
          // Admin: ambil semua donations
          const res = await API.get("/donations");
          return res.data.data || [];
        } else {
          // User biasa: ambil donations user tersebut
          const res = await API.get("/donations");
          const allDonations = res.data.data || [];
          return allDonations.filter(
            (donation) => donation.user?.id === state.user?.id
          );
        }
      } catch (error) {
        console.error("Error fetching donations:", error);
        throw error;
      }
    },
  });

  // Filter donations berdasarkan campaign (hanya untuk admin)
  useEffect(() => {
    if (donations && selectedCampaign) {
      const filtered = donations.filter(
        (donation) => donation.campaign_id?.toString() === selectedCampaign
      );
      setFilteredDonations(filtered);
    } else {
      setFilteredDonations(donations || []);
    }
  }, [donations, selectedCampaign]);

  const getStatusVariant = (status) => {
    if (!status) return "secondary";
    const statusLower = status.toLowerCase();
    if (
      statusLower.includes("success") ||
      statusLower.includes("completed") ||
      statusLower === "paid" ||
      statusLower === "settlement"
    ) {
      return "success";
    } else if (
      statusLower.includes("pending") ||
      statusLower.includes("process") ||
      statusLower === "pending"
    ) {
      return "warning";
    } else if (
      statusLower.includes("fail") ||
      statusLower.includes("expired") ||
      statusLower.includes("cancel") ||
      statusLower.includes("deny") ||
      statusLower === "failed"
    ) {
      return "danger";
    } else {
      return "secondary";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    const statusLower = status.toLowerCase();
    if (
      statusLower.includes("success") ||
      statusLower.includes("completed") ||
      statusLower === "paid" ||
      statusLower === "settlement"
    ) {
      return "Success";
    } else if (
      statusLower.includes("pending") ||
      statusLower.includes("process") ||
      statusLower === "pending"
    ) {
      return "Pending";
    } else if (
      statusLower.includes("fail") ||
      statusLower.includes("expired") ||
      statusLower.includes("cancel") ||
      statusLower.includes("deny") ||
      statusLower === "failed"
    ) {
      return "Failed";
    } else {
      return status;
    }
  };

  const handleCampaignChange = (e) => {
    setSelectedCampaign(e.target.value);
  };

  const clearFilter = () => {
    setSelectedCampaign("");
  };

  const displayDonations = selectedCampaign ? filteredDonations : donations || [];

  return (
    <Container className="my-5 donation-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="donation-title">
          {is_admin ? "All Donations Management" : "My Donation History"}
        </h3>
        
        {is_admin && campaigns.length > 0 && (
          <div className="d-flex align-items-center gap-2">
            <Form.Select
              value={selectedCampaign}
              onChange={handleCampaignChange}
              style={{ width: "250px" }}
            >
              <option value="">All Campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </Form.Select>
            {selectedCampaign && (
              <Button variant="outline-secondary" onClick={clearFilter} size="sm">
                Clear Filter
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="danger">
          <Alert.Heading>Error Loading Donations</Alert.Heading>
          <p>Failed to load donation history: {error.message}</p>
          <Button variant="outline-danger" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </Alert>
      )}

      <Table hover responsive className="donation-table">
        <thead>
          <tr>
            <th>No</th>
            {is_admin && <th>Donor</th>}
            <th>Campaign</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Status</th>
            <th>Payment Method</th>
            {is_admin && <th>Order ID</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={is_admin ? 8 : 6} className="text-center py-4">
                <div className="spinner-border spinner-border-sm me-2" />
                Loading donations...
              </td>
            </tr>
          ) : displayDonations.length > 0 ? (
            displayDonations.map((donation, index) => (
              <tr key={donation.id || index} className="donation-row">
                <td>{index + 1}</td>
                {is_admin && (
                  <td>
                    <div>
                      <strong>
                        {donation.user?.first_name} {donation.user?.last_name}
                      </strong>
                    </div>
                    <small className="text-muted">
                      {donation.user?.email || donation.user?.username}
                    </small>
                  </td>
                )}
                <td>
                  {donation.campaign?.title || 
                   donation.campaign_title || 
                   `Campaign #${donation.campaign_id}` || 
                   "N/A"}
                </td>
                <td className="fw-bold">{convert(donation.amount)}</td>
                <td>
                  {donation.created_at || donation.date
                    ? dayjs(donation.created_at || donation.date).format(
                        "D MMM YYYY, HH:mm"
                      )
                    : "-"}
                </td>
                <td>
                  <Badge bg={getStatusVariant(donation.status_payment || donation.status)}>
                    {formatStatus(donation.status_payment || donation.status)}
                  </Badge>
                </td>
                <td>
                  {donation.payment_method || 
                   donation.payment_type || 
                   (donation.status_payment === "pending" ? "Midtrans" : "-")}
                </td>
                {is_admin && (
                  <td>
                    <small className="text-muted">
                      {donation.order_id || donation.id || "-"}
                    </small>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={is_admin ? 8 : 6} className="text-center py-5 empty-state">
                <div className="mb-3">
                  <i className="fas fa-donate fa-3x text-muted" />
                </div>
                <div className="fw-bold mb-2">
                  {selectedCampaign 
                    ? "No donations found for this campaign" 
                    : is_admin 
                      ? "No donations available" 
                      : "No donation history found"}
                </div>
                <div className="text-muted small">
                  {selectedCampaign 
                    ? "Try selecting a different campaign or clear the filter" 
                    : is_admin
                      ? "Donations will appear here once users make contributions"
                      : "Your donations will appear here once you make a contribution"}
                </div>
                {selectedCampaign && (
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={clearFilter}
                    className="mt-3"
                  >
                    Clear Filter
                  </Button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Summary untuk Admin */}
      {is_admin && displayDonations.length > 0 && (
        <div className="mt-4 p-3 bg-light rounded">
          <h6>Donation Summary:</h6>
          <div className="d-flex gap-4">
            <div>
              <strong>Total Donations:</strong> {displayDonations.length}
            </div>
            <div>
              <strong>Successful:</strong>{" "}
              {displayDonations.filter(d => 
                getStatusVariant(d.status_payment || d.status) === "success"
              ).length}
            </div>
            <div>
              <strong>Pending:</strong>{" "}
              {displayDonations.filter(d => 
                getStatusVariant(d.status_payment || d.status) === "warning"
              ).length}
            </div>
            <div>
              <strong>Failed:</strong>{" "}
              {displayDonations.filter(d => 
                getStatusVariant(d.status_payment || d.status) === "danger"
              ).length}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}