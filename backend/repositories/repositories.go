package repositories

import (
	"errors"
	"zakat/models"

	"gorm.io/gorm"
)

// ==================== User Repository ====================

type UserRepository interface {
	Create(user *models.User) error
	GetAll() ([]models.User, error)
	GetByID(id uint) (*models.User, error)
	Update(user *models.User) error
	Delete(id uint) error
	GetByEmail(email string) (*models.User, error)
	GetByUsername(username string) (*models.User, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) GetAll() ([]models.User, error) {
	var users []models.User
	err := r.db.Find(&users).Error
	return users, err
}

func (r *userRepository) GetByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}
func (r *userRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *userRepository) GetByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *userRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) Delete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

func (r *userRepository) GetAllWithPagination(limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	r.db.Model(&models.User{}).Count(&total)
	err := r.db.Limit(limit).Offset(offset).Find(&users).Error

	return users, total, err
}

// ==================== Campaign Repository ====================

type CampaignRepository interface {
	Create(campaign *models.Campaign) error
	GetAll() ([]models.Campaign, error)
	GetByID(id uint) (*models.Campaign, error)
	Update(campaign *models.Campaign) error
	Delete(id uint) error
	GetDonations(campaignID uint) ([]models.Donation, error)
	GetByFilters(category, location string) ([]models.Campaign, error)
}

type campaignRepository struct {
	db *gorm.DB
}

func NewCampaignRepository(db *gorm.DB) CampaignRepository {
	return &campaignRepository{db: db}
}

func (r *campaignRepository) Create(campaign *models.Campaign) error {
	return r.db.Create(campaign).Error
}

func (r *campaignRepository) GetAll() ([]models.Campaign, error) {
	var campaigns []models.Campaign
	err := r.db.Preload("User").Preload("Donations").Find(&campaigns).Error
	return campaigns, err
}

// Add this method for filtering
func (r *campaignRepository) GetByFilters(category, location string) ([]models.Campaign, error) {
	var campaigns []models.Campaign
	query := r.db.Preload("User").Preload("Donations")

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if location != "" {
		query = query.Where("location LIKE ?", "%"+location+"%")
	}

	err := query.Find(&campaigns).Error
	return campaigns, err
}

func (r *campaignRepository) GetByID(id uint) (*models.Campaign, error) {
	var campaign models.Campaign
	err := r.db.Preload("User").Preload("Donations").First(&campaign, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &campaign, err
}

func (r *campaignRepository) Update(campaign *models.Campaign) error {
	return r.db.Save(campaign).Error
}

func (r *campaignRepository) Delete(id uint) error {
	return r.db.Delete(&models.Campaign{}, id).Error
}

func (r *campaignRepository) GetDonations(campaignID uint) ([]models.Donation, error) {
	var donations []models.Donation
	err := r.db.Where("campaign_id = ?", campaignID).Preload("User").Find(&donations).Error
	return donations, err
}

// ==================== Donation Repository ====================

type DonationRepository interface {
	Create(donation *models.Donation) error
	GetAll() ([]models.Donation, error)
	GetByID(id uint) (*models.Donation, error)
	Update(donation *models.Donation) error
	Delete(id uint) error
	GetByCampaign(campaignID uint) ([]models.Donation, error)
	CountAll() (int64, error)
	CountPaid() (int64, error)
	SumPaidAmount() (float64, error)
	CountByCampaign(campaignID uint) (int64, error)
}

type donationRepository struct {
	db *gorm.DB
}

func NewDonationRepository(db *gorm.DB) DonationRepository {
	return &donationRepository{db: db}
}

func (r *donationRepository) Create(donation *models.Donation) error {
	return r.db.Create(donation).Error
}

func (r *donationRepository) GetAll() ([]models.Donation, error) {
	var donations []models.Donation
	err := r.db.Preload("User").Preload("Campaign").Find(&donations).Error
	return donations, err
}

func (r *donationRepository) GetByID(id uint) (*models.Donation, error) {
	var donation models.Donation
	err := r.db.Preload("User").Preload("Campaign").First(&donation, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &donation, err
}

func (r *donationRepository) Update(donation *models.Donation) error {
	return r.db.Save(donation).Error
}

func (r *donationRepository) Delete(id uint) error {
	return r.db.Delete(&models.Donation{}, id).Error
}

func (r *donationRepository) GetByCampaign(campaignID uint) ([]models.Donation, error) {
	var donations []models.Donation
	err := r.db.Where("campaign_id = ?", campaignID).Preload("User").Find(&donations).Error
	return donations, err
}

func (r *donationRepository) CountAll() (int64, error) {
	var count int64
	err := r.db.Model(&models.Donation{}).Count(&count).Error
	return count, err
}

func (r *donationRepository) CountPaid() (int64, error) {
	var count int64
	err := r.db.
		Model(&models.Donation{}).
		Where("status = ?", "paid").
		Count(&count).Error
	return count, err
}

func (r *donationRepository) SumPaidAmount() (float64, error) {
	var total float64
	err := r.db.
		Model(&models.Donation{}).
		Select("SUM(amount)").
		Where("status = ?", "paid").
		Scan(&total).Error
	return total, err
}

func (r *donationRepository) CountByCampaign(campaignID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Donation{}).
		Where("campaign_id = ?", campaignID).
		Count(&count).Error
	return count, err
}
