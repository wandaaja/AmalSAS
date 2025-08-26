import React, { useContext, useEffect } from "react";
import { Container, Table } from "react-bootstrap";
import Moment from "react-moment";
import { useQuery } from "react-query";
import { API } from "../config/api";
import { UserContext } from "../context/userContext";
import NavbarWithoutSearch from "../components/NavbarWithoutSearch";
import { convert } from "rupiah-format";

export default function DonationHistory() {
  const [state] = useContext(UserContext);

  useEffect(() => {
    document.body.style.background = "rgba(196, 196, 196, 0.25)";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  // Fetch donations for this user
  const { data: donations, isLoading } = useQuery(
    "donationsCache",
    async () => {
      const res = await API.get("/donations");
      return res.data.data;
    }
  );

  // Filter only current user's donations
  const userDonations = donations?.filter(
    (donation) => donation.user.id === state.user.id
  );

  return (
    <>


      <Container className="my-5">
        <h3 className="fw-bold mb-4">My Donation History</h3>

        <Table striped bordered hover responsive>
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
                  Loading...
                </td>
              </tr>
            ) : userDonations?.length > 0 ? (
              userDonations.map((donation, index) => (
                <tr key={donation.id}>
                  <td>{index + 1}</td>
                  <td>{donation.campaign?.title || "N/A"}</td>
                  <td>{convert(donation.amount)}</td>
                  <td>
                    <Moment format="D MMM YYYY">{donation.created_at}</Moment>
                  </td>
                  <td>{donation.status_payment}</td>
                  <td>{donation.payment_method || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No donation history available.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Container>
    </>
  );
}
import React, { useContext, useEffect } from "react";
import { Container, Table } from "react-bootstrap";
import Moment from "react-moment";
import { useQuery } from "react-query";
import { API } from "../config/api";
import { UserContext } from "../context/userContext";
import NavbarWithoutSearch from "../components/NavbarWithoutSearch";
import { convert } from "rupiah-format";

export default function DonationHistory() {
  const [state] = useContext(UserContext);

  useEffect(() => {
    document.body.style.background = "rgba(196, 196, 196, 0.25)";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  // Fetch donations for this user
  const { data: donations, isLoading } = useQuery(
    "donationsCache",
    async () => {
      const res = await API.get("/donations");
      return res.data.data;
    }
  );

  // Filter only current user's donations
  const userDonations = donations?.filter(
    (donation) => donation.user.id === state.user.id
  );

  return (
    <>
      <NavbarWithoutSearch />

      <Container className="my-5">
        <h3 className="fw-bold mb-4">My Donation History</h3>

        <Table striped bordered hover responsive>
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
                  Loading...
                </td>
              </tr>
            ) : userDonations?.length > 0 ? (
              userDonations.map((donation, index) => (
                <tr key={donation.id}>
                  <td>{index + 1}</td>
                  <td>{donation.campaign?.title || "N/A"}</td>
                  <td>{convert(donation.amount)}</td>
                  <td>
                    <Moment format="D MMM YYYY">{donation.created_at}</Moment>
                  </td>
                  <td>{donation.status_payment}</td>
                  <td>{donation.payment_method || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No donation history available.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Container>
    </>
  );
}
