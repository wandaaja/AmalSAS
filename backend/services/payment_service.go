package services

import (
	"fmt"
	"time"
	"zakat/models"
	zakatMidtrans "zakat/pkg/midtrans"

	midtransSdk "github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"github.com/midtrans/midtrans-go/snap"
)

type PaymentService interface {
	CreateTransaction(donation models.Donation) (*snap.Response, error)
	VerifyPayment(orderID string) (bool, error)
	GetTransactionStatus(orderID string) (*coreapi.TransactionStatusResponse, error)
}

type paymentService struct{}

func NewPaymentService() PaymentService {
	return &paymentService{}
}

func (s *paymentService) CreateTransaction(donation models.Donation) (*snap.Response, error) {
	// Generate unique order ID dengan timestamp
	orderID := fmt.Sprintf("DONATION-%d-%d", donation.ID, time.Now().Unix())

	// Gunakan Snap API untuk mendapatkan payment URL
	req := &snap.Request{
		TransactionDetails: midtransSdk.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: int64(donation.Amount),
		},
		CustomerDetail: &midtransSdk.CustomerDetails{
			FName: donation.User.FirstName + " " + donation.User.LastName,
			Email: donation.User.Email,
			Phone: donation.User.Phone,
		},
		Items: &[]midtransSdk.ItemDetails{
			{
				ID:    fmt.Sprintf("ITEM-%d", donation.CampaignID),
				Price: int64(donation.Amount),
				Qty:   1,
				Name:  fmt.Sprintf("Donasi untuk %s", donation.Campaign.Title),
			},
		},
	}

	snapResp, err := zakatMidtrans.SnapClient.CreateTransaction(req)
	if err != nil {
		return nil, fmt.Errorf("failed to create snap transaction: %v", err)
	}

	return snapResp, nil
}

func (s *paymentService) VerifyPayment(orderID string) (bool, error) {
	status, err := s.GetTransactionStatus(orderID)
	if err != nil {
		return false, err
	}

	// Check if payment is successful
	isSuccess := status.TransactionStatus == "settlement" ||
		status.TransactionStatus == "capture" ||
		status.TransactionStatus == "authorize"

	return isSuccess, nil
}

func (s *paymentService) GetTransactionStatus(orderID string) (*coreapi.TransactionStatusResponse, error) {
	status, err := zakatMidtrans.CoreClient.CheckTransaction(orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to check transaction status: %v", err)
	}

	return status, nil
}
