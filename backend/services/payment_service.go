package services

import (
	"fmt"
	"zakat/models"
	zakatMidtrans "zakat/pkg/midtrans"

	midtransSdk "github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
)

type PaymentService interface {
	CreateTransaction(donation models.Donation) (*coreapi.ChargeResponse, error)
	VerifyPayment(orderID string) (bool, error)
}

type paymentService struct{}

func NewPaymentService() PaymentService {
	return &paymentService{}
}

func (s *paymentService) CreateTransaction(donation models.Donation) (*coreapi.ChargeResponse, error) {
	req := &coreapi.ChargeReq{
		PaymentType: coreapi.PaymentTypeBankTransfer,
		TransactionDetails: midtransSdk.TransactionDetails{
			OrderID:  fmt.Sprintf("%d", donation.ID),
			GrossAmt: int64(donation.Amount),
		},
		BankTransfer: &coreapi.BankTransferDetails{
			Bank: midtransSdk.BankBca,
		},
	}

	return zakatMidtrans.CoreClient.ChargeTransaction(req)

}

func (s *paymentService) VerifyPayment(orderID string) (bool, error) {
	status, err := zakatMidtrans.CoreClient.CheckTransaction(orderID)
	if err != nil {
		return false, err
	}

	return status.TransactionStatus == "settlement" || status.TransactionStatus == "capture", nil
}
