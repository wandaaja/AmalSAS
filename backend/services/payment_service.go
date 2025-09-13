package services

import (
	"fmt"
	"log"
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

	// fallback nama user
	fname := donation.User.FirstName + " " + donation.User.LastName
	if fname == "" || fname == " " {
		if donation.User.Username != "" {
			fname = donation.User.Username
		} else {
			fname = "Anonim"
		}
	}

	// fallback email
	email := donation.User.Email
	if email == "" {
		email = "no-reply@amalsas.id"
	}

	// fallback phone
	phone := donation.User.Phone
	if phone == "" {
		phone = "0000000000"
	}

	// fallback campaign
	title := donation.Campaign.Title
	if title == "" {
		title = "Donasi AmalSAS"
	}

	// Buat request Midtrans
	req := &snap.Request{
		TransactionDetails: midtransSdk.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: int64(donation.Amount),
		},
		CustomerDetail: &midtransSdk.CustomerDetails{
			FName: fname,
			Email: email,
			Phone: phone,
		},
		Items: &[]midtransSdk.ItemDetails{
			{
				ID:    fmt.Sprintf("ITEM-%d", donation.CampaignID),
				Price: int64(donation.Amount),
				Qty:   1,
				Name:  fmt.Sprintf("Donasi untuk %s", title),
			},
		},
	}

	log.Printf("Creating Midtrans transaction: %+v\n", donation)

	// Panggil Midtrans Snap
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
