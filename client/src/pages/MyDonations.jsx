import React, { useContext, useEffect } from "react";
import { Container, Table, Badge } from "react-bootstrap";
import Moment from "react-moment";
import { useQuery } from "react-query";
import { API } from "../config/api";
import { UserContext } from "../context/userContext";
import { convert } from "rupiah-format";

export default function DonationHistory() {
  const [state] = useContext(UserContext);

  useEffect(() => {
    document.body.style.background = "rgba(196, 196, 196, 0.25)";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  // Fetch all donations
  const { data: donations, isLoading, error } = useQuery(
    "donationsCache",
    async () => {
      try {
        const res = await API.get("/donations");
        return res.data.data;
      } catch (error) {
        console.error("Error fetching donations:", error);
        throw error;
      }
    }
  );

  // Filter data based on role
  let displayDonations = [];

  if (state.user.role === "admin") {
    // Group donations by campaign for admin view
    // Flatten donations grouped by campaign, or just show all donations sorted by campaign
    // Here kita tampilkan semua donasi, tapi bisa diurutkan berdasarkan campaign
    displayDonations = donations?.sort((a, b) => {
      const titleA = a.campaign?.title?.toLowerCase() || "";
      const titleB = b.campaign?.title?.toLowerCase() || "";
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });
  } else {
    // For donatur, filter donations by user id
    displayDonations = donations?.filter(
      (donation) => donation.user?.id === state.user.id
    );
  }

  // Function to get status badge color
  const getStatusVariant = (status) => {
    if (!status) return "secondary";

    const statusLower = status.toLowerCase();
    if (
      statusLower.includes("success") ||
      statusLower.includes("completed") ||
      statusLower === "paid"
    ) {
      return "success";
    } else if (
      statusLower.includes("pending") ||
      statusLower.includes("process")
    ) {
      return "warning";
    } else if (
      statusLower.includes("fail") ||
      statusLower.includes("expired") ||
      statusLower.includes("cancel")
    ) {
      return "danger";
    } else {
      return "secondary";
    }
  };

  // Function to format status text
  const formatStatus = (status) => {
    if (!status) return "Unknown";

    const statusLower = status.toLowerCase();
    if (
      statusLower.includes("success") ||
      statusLower.includes("completed") ||
      statusLower === "paid"
    ) {
      return "Success";
    } else if (
      statusLower.includes("pending") ||
      statusLower.includes("process")
    ) {
      return "Pending";
    } else if (
      statusLower.includes("fail") ||
      statusLower.includes("expired") ||
      statusLower.includes("cancel")
    ) {
      return "Failed";
    } else {
      return status;
    }
  };

  return (
    <>
      <Container className="my-5">
        <h3 className="fw-bold mb-4">
          {state.user.role === "admin"
            ? "Donation History by Campaign"
            : "My Donation History"}
        </h3>

        {error && (
          <div className="alert alert-danger">
            Failed to load donation history: {error.message}
          </div>
        )}

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>No</th>
              {state.user.role === "admin" && <th>User</th>}
              <th>Campaign</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={state.user.role === "admin" ? "7" : "6"} className="text-center">
                  <div className="spinner-border spinner-border-sm me-2" />
                  Loading donations...
                </td>
              </tr>
            ) : displayDonations?.length > 0 ? (
              displayDonations.map((donation, index) => (
                <tr key={donation.id}>
                  <td>{index + 1}</td>
                  {state.user.role === "admin" && (
                    <td>{donation.user?.name || "N/A"}</td>
                  )}
                  <td>{donation.campaign?.title || "N/A"}</td>
                  <td>{convert(donation.amount)}</td>
                  <td>
                    <Moment format="D MMM YYYY, HH:mm">
                      {donation.created_at || donation.date}
                    </Moment>
                  </td>
                  <td>
                    <Badge bg={getStatusVariant(donation.status_payment)}>
                      {formatStatus(donation.status_payment)}
                    </Badge>
                  </td>
                  <td>{donation.payment_method || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={state.user.role === "admin" ? "7" : "6"} className="text-center text-muted py-4">
                  <div>
                    <i
                      className="fas fa-donate fa-2x mb-3"
                      style={{ opacity: 0.5 }}
                    />
                  </div>
                  No donation history available.
                  <div className="small mt-2">
                    {state.user.role === "admin"
                      ? "No donations found for any campaign."
                      : "Your donations will appear here once you make a contribution."}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Container>
    </>
  );
}