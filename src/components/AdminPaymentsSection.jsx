import React, { useState, useEffect } from "react";
import {
  Block,
  BlockTitle,
  List,
  ListItem,
  Icon,
  Card,
  CardContent,
} from "framework7-react";
import { paymentService } from "../services/paymentService";

const AdminPaymentsSection = ({ selectedSchoolForPayments }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (selectedSchoolForPayments?.id) {
        setLoading(true);
        const { data, error } = await paymentService.getPaymentsBySchool(
          selectedSchoolForPayments.id
        );

        if (!error && data) {
          setPayments(data);
        } else {
          console.error("Error fetching payments:", error);
        }
        setLoading(false);
      }
    };

    fetchPayments();
  }, [selectedSchoolForPayments]);

  // Calculate totals
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPayments = payments.length;

  if (loading) {
    return (
      <Block style={{ margin: "16px", textAlign: "center" }}>
        <div className="preloader"></div>
        <p>Betalingen laden...</p>
      </Block>
    );
  }

  return (
    <>
      <BlockTitle style={{ margin: "16px 16px 8px" }}>
        Betalingen - {selectedSchoolForPayments?.name}
      </BlockTitle>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "16px", margin: "0 16px 16px" }}>
        <Card style={{ flex: 1, margin: 0 }}>
          <CardContent style={{ padding: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <Icon f7="money_dollar_circle_fill" size="40" color="green" />
              <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: "8px" }}>
                SRD {totalAmount.toFixed(2)}
              </div>
              <div style={{ fontSize: "13px", color: "gray" }}>
                Totaal Ontvangen
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ flex: 1, margin: 0 }}>
          <CardContent style={{ padding: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <Icon f7="number_circle_fill" size="40" color="blue" />
              <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: "8px" }}>
                {totalPayments}
              </div>
              <div style={{ fontSize: "13px", color: "gray" }}>
                Totaal Betalingen
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <Block style={{ margin: "16px", textAlign: "center" }}>
          <Icon
            f7="creditcard"
            size="60"
            color="gray"
            style={{ marginBottom: "20px" }}
          />
          <p style={{ color: "gray" }}>Geen betalingen gevonden</p>
        </Block>
      ) : (
        <List style={{ margin: "0 16px 16px" }} dividersIos>
          {payments.map((payment) => {
            const paymentDate = new Date(payment.payment_date);
            const studentData = payment.drv_students;

            return (
              <ListItem key={payment.id}>
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {/* Student Info */}
                      <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                        {studentData?.name || "Onbekende Student"}
                      </div>
                      <div style={{ fontSize: "13px", color: "gray", marginTop: "2px" }}>
                        {studentData?.email}
                      </div>
                      <div style={{ fontSize: "13px", color: "gray" }}>
                        {studentData?.phone}
                      </div>
                    </div>

                    {/* Amount and Date */}
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#28a745",
                        }}
                      >
                        SRD {payment.amount.toFixed(2)}
                      </div>
                      <div style={{ fontSize: "12px", color: "gray", marginTop: "4px" }}>
                        {paymentDate.toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      {payment.duration_days && (
                        <div style={{ fontSize: "11px", color: "gray" }}>
                          {payment.duration_days} dagen
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        backgroundColor: "#e3f2fd",
                        color: "var(--app-primary-color)",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      {payment.payment_method || "Contant"}
                    </span>
                  </div>

                  {/* Notes */}
                  {payment.notes && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "gray",
                        fontStyle: "italic",
                        marginTop: "8px",
                        padding: "8px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                      }}
                    >
                      {payment.notes}
                    </div>
                  )}
                </div>
              </ListItem>
            );
          })}
        </List>
      )}
    </>
  );
};

export default AdminPaymentsSection;
