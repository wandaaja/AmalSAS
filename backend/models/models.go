package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        int            `gorm:"primaryKey" json:"id"`
	FirstName string         `json:"first_name" form:"first_name"`
	LastName  string         `json:"last_name" form:"last_name"`
	Username  string         `json:"username" form:"username" gorm:"unique"`
	Gender    string         `json:"gender" form:"gender"`
	Phone     string         `json:"phone" form:"phone"`
	Address   string         `json:"address" form:"address"`
	Email     string         `json:"email" form:"email" gorm:"unique"`
	Password  string         `json:"-" form:"password"`
	Photo     string         `json:"photo" form:"photo"`
	IsAdmin   bool           `json:"isAdmin" form:"isAdmin"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relasi
	Campaigns []Campaign `gorm:"foreignKey:UserID" json:"campaigns,omitempty"`
	Donations []Donation `gorm:"foreignKey:UserID" json:"donations,omitempty"`
}

type UserResponseJWT struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Gender   string `json:"gender" form:"gender"`
	Phone    string `json:"phone" form:"phone"`
	Address  string `json:"address" form:"address"`
	Photo    string `json:"photo" form:"photo"`
	Token    string `json:"token"`
	IsAdmin  bool   `json:"isAdmin" form:"isAdmin"`
}

type Campaign struct {
	ID             int            `gorm:"primaryKey" json:"id"`
	Title          string         `json:"title" form:"title"`
	Description    string         `json:"description" form:"description"`
	Details        string         `json:"details" form:"details"`
	Start          time.Time      `json:"start" form:"start"`
	End            time.Time      `json:"end" form:"end"`
	CPocket        string         `json:"cpocket" form:"cpocket"`
	Status         string         `json:"status" form:"status"`
	Photo          string         `json:"photo" form:"photo"`
	TargetTotal    float64        `json:"target_total" form:"target_total"`
	TotalCollected float64        `json:"total_collected" form:"total_collected"`
	Category       string         `json:"category" form:"category"`
	Location       string         `json:"location" form:"location"`
	UserID         int            `json:"user_id"`
	User           User           `gorm:"foreignKey:UserID" json:"user"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
	Donations      []Donation     `gorm:"foreignKey:CampaignID" json:"donations,omitempty"`
}

type Donation struct {
	ID         int            `gorm:"primaryKey" json:"id" form:"id"`
	Amount     float64        `json:"amount" form:"amount"`
	Date       time.Time      `json:"date" form:"date"`
	Status     string         `json:"status" form:"status"`
	UserID     int            `json:"user_id"`
	User       User           `gorm:"foreignKey:UserID" json:"user"`
	OrderID    string         `json:"order_id" gorm:"type:varchar(100);uniqueIndex"`
	PaymentURL string         `json:"payment_url" gorm:"type:text"`
	CampaignID int            `json:"campaign_id"`
	Campaign   Campaign       `gorm:"foreignKey:CampaignID" json:"campaign"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}
