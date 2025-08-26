package dto

import "time"

type DonationCreateRequest struct {
	Amount     float64 `json:"amount" form:"amount"`
	Status     string  `json:"status" form:"status"`
	UserID     int     `json:"user_id" form:"user_id"`
	CampaignID int     `json:"campaign_id" form:"campaign_id"`
}

type DonationResponse struct {
	ID         int       `json:"id"`
	Amount     float64   `json:"amount"`
	Date       time.Time `json:"date"`
	Status     string    `json:"status"`
	UserID     int       `json:"user_id"`
	UserName   string    `json:"user_name"`
	CampaignID int       `json:"campaign_id"`
	Campaign   string    `json:"campaign"`
	CreatedAt  time.Time `json:"created_at"`
	PaymentURL string    `json:"payment_url,omitempty"`
}
