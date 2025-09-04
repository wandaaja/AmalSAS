package dto

import "time"

type CampaignCreateRequest struct {
	Title       string    `json:"title" form:"title"`
	Description string    `json:"description" form:"description"`
	Details     string    `json:"details" form:"details"`
	Start       time.Time `json:"start" form:"start"`
	End         time.Time `json:"end" form:"end"`
	CPocket     string    `json:"cpocket" form:"cpocket"`
	Status      string    `json:"status" form:"status"`
	Photo       string    `json:"photo" form:"photo"`
	TargetTotal float64   `json:"target_total" form:"target_total"`
	Category    string    `json:"category" form:"category"`
	Location    string    `json:"location" form:"location"`
	UserID      int       `json:"user_id" form:"user_id"`
}

type CampaignUpdateRequest struct {
	Title       string    `json:"title" form:"title"`
	Description string    `json:"description" form:"description"`
	Details     string    `json:"details" form:"details"`
	Start       time.Time `json:"start" form:"start"`
	End         time.Time `json:"end" form:"end"`
	CPocket     string    `json:"cpocket" form:"cpocket"`
	Status      string    `json:"status" form:"status"`
	Photo       string    `json:"photo" form:"photo"`
	TargetTotal float64   `json:"target_total" form:"target_total"`
	Category    string    `json:"category" form:"category"`
	Location    string    `json:"location" form:"location"`
}

type CampaignResponse struct {
	ID             int       `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Details        string    `json:"details"`
	Start          time.Time `json:"start"`
	End            time.Time `json:"end"`
	CPocket        string    `json:"cpocket"`
	Status         string    `json:"status"`
	Photo          string    `json:"photo"`
	TargetTotal    float64   `json:"target_total"`
	TotalCollected float64   `json:"total_collected"`
	Category       string    `json:"category"`
	Location       string    `json:"location"`
	UserID         int       `json:"user_id"`
	UserName       string    `json:"user_name"`
	CreatedAt      time.Time `json:"created_at"`
}
