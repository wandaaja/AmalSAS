import React, { useContext, useEffect } from "react";
import { Container, Table, Badge } from "react-bootstrap";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { API } from "../config/api";
import { UserContext } from "../context/userContext";
import { convert } from "rupiah-format";
import "./MyDonations.css";

export default function MyDonations() {
  const [state] = useContext(UserContext);

  useEffect(() => {
    document.body.style.background = "rgba(196, 196, 196, 0.25)";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  const {
    data: donations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myDonations", state.user?.id],
    queryFn: async () => {
      const res = await API.get("/donations");
      // filter sesuai user login
      return res.data.data.filter(
        (donation) => donation.user?.id === state.user?.id
      );
    },
  });

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
    <Container className="my-5 donation-container">
      <h3 className="donation-title">My Donation History</h3>

      {error && (
        <div className="alert alert-danger">
          Failed to load donation history: {error.message}
        </div>
      )}

      <Table striped bordered hover responsive className="donation-table">
        <thead>
          <tr>
            <th>No</th>
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
              <td colSpan="6" className="text-center">
                <div className="spinner-border spinner-border-sm me-2" />
                Loading donations...
              </td>
            </tr>
          ) : donations?.length > 0 ? (
            donations.map((donation, index) => (
              <tr key={donation.id}>
                <td>{index + 1}</td>
                <td>{donation.campaign?.title || "N/A"}</td>
                <td>{convert(donation.amount)}</td>
                <td>
                  {donation.created_at || donation.date
                    ? dayjs(donation.created_at || donation.date).format(
                        "D MMM YYYY, HH:mm"
                      )
                    : "-"}
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
              <td colSpan="6" className="text-center text-muted py-4">
                <div>
                  <i
                    className="fas fa-donate fa-2x mb-3"
                    style={{ opacity: 0.5 }}
                  />
                </div>
                No donation history available.
                <div className="small mt-2">
                  Your donations will appear here once you make a contribution.
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}
