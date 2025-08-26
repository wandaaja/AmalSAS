package handlers

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	dtoAuth "zakat/dto/auth"
	dtoCampaign "zakat/dto/campaign"
	dto "zakat/dto/result"
	"zakat/models"
	"zakat/pkg/bcrypt"
	"zakat/repositories"
	"zakat/services"

	jwtToken "zakat/pkg/jwt"

	"github.com/golang-jwt/jwt/v4"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	userRepository     repositories.UserRepository
	campaignRepository repositories.CampaignRepository
	donationRepository repositories.DonationRepository
	paymentService     services.PaymentService
}

func NewHandler(
	userRepo repositories.UserRepository,
	campaignRepo repositories.CampaignRepository,
	donationRepo repositories.DonationRepository,
	paymentService services.PaymentService,
) *Handler {
	return &Handler{
		userRepository:     userRepo,
		campaignRepository: campaignRepo,
		donationRepository: donationRepo,
		paymentService:     paymentService,
	}
}

// ================= Check =================
func (h *Handler) CheckAuth(c echo.Context) error {
	// Ambil user_id dari token JWT
	userId := c.Get("userLogin").(int)
	fmt.Println("CheckAuth userId:", userId)

	// Fetch user dari DB
	user, err := h.userRepository.GetByID(uint(userId))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to fetch user",
		})
	}

	// Return user info tanpa password
	userResponse := models.UserResponseJWT{
		ID:       user.ID,
		Name:     user.FirstName + " " + user.LastName,
		Email:    user.Email,
		Username: user.Username,
		Address:  user.Address,
		Phone:    user.Phone,
		Photo:    user.Photo,
		Token:    "",
		IsAdmin:  user.IsAdmin,
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: userResponse,
	})
}

func (h *Handler) ChangePassword(c echo.Context) error {
	userLogin := c.Get("userLogin")
	if userLogin == nil {
		return c.JSON(http.StatusUnauthorized, dto.ErrorResult{
			Code:    http.StatusUnauthorized,
			Message: "Unauthorized",
		})
	}
	userID := userLogin.(int)

	var body struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request",
		})
	}

	user, err := h.userRepository.GetByID(uint(userID))
	if err != nil || user == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "User not found",
		})
	}

	if !bcrypt.CheckPasswordHash(body.OldPassword, user.Password) {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Old password incorrect",
		})
	}

	hashedPassword, err := bcrypt.HashingPassword(body.NewPassword)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Error hashing password",
		})
	}

	user.Password = hashedPassword
	user.UpdatedAt = time.Now()

	if err := h.userRepository.Update(user); err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to update password",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: "Password changed successfully",
	})
}

// ==================== User Handlers ====================

func (h *Handler) CreateUser(c echo.Context) error {
	var req dtoAuth.SignUpRequest
	if err := c.Bind(&req); err != nil {
		log.Println("CreateUser Bind error:", err)
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
		})
	}

	log.Printf("Request Body: %+v", req)

	hashedPassword, err := bcrypt.HashingPassword(req.Password)
	if err != nil {
		log.Println("Hash error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to hash password",
		})
	}

	user := models.User{
		Username:  req.Username,
		Email:     req.Email,
		Password:  hashedPassword,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
		Address:   req.Address,
		IsAdmin:   req.IsAdmin,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	log.Printf("Final User Model: %+v", user)

	if err := h.userRepository.Create(&user); err != nil {
		log.Println("Create error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create user",
		})
	}

	// Generate JWT token
	claims := jwt.MapClaims{
		"id":      user.ID,
		"email":   user.Email,
		"isAdmin": user.IsAdmin,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	}
	tokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	secretKey := []byte(jwtToken.GetSecretKey())

	token, err := tokenObj.SignedString(secretKey)
	if err != nil {
		log.Println("CreateUser GenerateToken error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to generate authentication token",
		})
	}

	// Buat struktur AuthData
	authData := dtoAuth.AuthData{
		ID:        uint(user.ID),
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Username:  user.Username,
		Phone:     user.Phone,
		Address:   user.Address,
		Email:     user.Email,
		IsAdmin:   user.IsAdmin,
		Token:     token,
	}

	return c.JSON(http.StatusCreated, dtoAuth.NewAuthResponse("Registration successful!", authData))
}

func (h *Handler) SignIn(c echo.Context) error {
	var req dtoAuth.SignInRequest

	if err := c.Bind(&req); err != nil {
		log.Println("SignIn Bind error:", err)
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
		})
	}
	req.Password = strings.TrimSpace(req.Password)
	var user *models.User
	var err error

	// Trim whitespace from inputs
	req.Value = strings.TrimSpace(req.Value)
	req.Password = strings.TrimSpace(req.Password)

	if strings.Contains(req.Value, "@") {
		user, err = h.userRepository.GetByEmail(req.Value)
		log.Printf("Looking up by email: %s", req.Value)
	} else {
		user, err = h.userRepository.GetByUsername(req.Value)
		log.Printf("Looking up by username: %s", req.Value)
	}

	if err != nil {
		log.Println("SignIn GetUser DB error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Server error",
		})
	}

	if user == nil {
		log.Println("SignIn: User not found for", req.Value)
		return c.JSON(http.StatusUnauthorized, dto.ErrorResult{
			Code:    http.StatusUnauthorized,
			Message: "Invalid username/email or password",
		})
	}

	// Debug user data (without sensitive info)
	log.Printf("Found user ID: %d, Email: %s, Username: %s", user.ID, user.Email, user.Username)
	log.Printf("Input password length: %d", len(req.Password))
	log.Printf("Stored hash length: %d", len(user.Password))

	// Check password
	isValid := bcrypt.CheckPasswordHash(req.Password, user.Password)
	log.Printf("Password valid: %v", isValid)

	if !isValid {
		return c.JSON(http.StatusUnauthorized, dto.ErrorResult{
			Code:    http.StatusUnauthorized,
			Message: "Invalid username/email or password",
		})
	}

	// Generate JWT token
	claims := jwt.MapClaims{
		"id":       user.ID,
		"email":    user.Email,
		"username": user.Username,
		"isAdmin":  user.IsAdmin,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}

	tokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	secretKey := []byte(jwtToken.GetSecretKey())

	token, err := tokenObj.SignedString(secretKey)
	if err != nil {
		log.Println("SignIn GenerateToken error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to generate authentication token",
		})
	}

	// Prepare response
	response := dto.SuccessResult{
		Code: http.StatusOK,
		Data: map[string]interface{}{
			"token": token,
			"user": models.UserResponseJWT{
				ID:       user.ID,
				Name:     user.FirstName + " " + user.LastName,
				Email:    user.Email,
				Username: user.Username,
				Gender:   user.Gender,
				Phone:    user.Phone,
				Address:  user.Address,
				Photo:    user.Photo,
				Token:    token,
				IsAdmin:  user.IsAdmin,
			},
		},
	}

	return c.JSON(http.StatusOK, response)
}

func (h *Handler) GetUser(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid user ID format",
		})
	}

	user, err := h.userRepository.GetByID(uint(id))
	if err != nil {
		log.Println("GetUser GetByID error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get user",
		})
	}

	if user == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "User not found",
		})
	}

	response := models.UserResponseJWT{
		ID:       user.ID,
		Name:     user.FirstName + " " + user.LastName,
		Email:    user.Email,
		Username: user.Username,
		Gender:   user.Gender,
		Phone:    user.Phone,
		Address:  user.Address,
		Photo:    user.Photo,
		IsAdmin:  user.IsAdmin,
		Token:    "",
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: response,
	})
}

func (h *Handler) GetAllUsers(c echo.Context) error {
	users, err := h.userRepository.GetAll()
	if err != nil {
		log.Println("GetAllUsers GetAll error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get users",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: users,
	})
}

func (h *Handler) UpdateUser(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid user ID format",
		})
	}

	user, err := h.userRepository.GetByID(uint(id))
	if err != nil {
		log.Println("UpdateUser GetByID error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get user",
		})
	}

	if user == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "User not found",
		})
	}

	if err := c.Bind(user); err != nil {
		log.Println("UpdateUser Bind error:", err)
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
		})
	}

	user.UpdatedAt = time.Now()

	if err := h.userRepository.Update(user); err != nil {
		log.Println("UpdateUser Update error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to update user",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: user,
	})
}

func (h *Handler) ChangeProfileImage(c echo.Context) error {
	userLogin := c.Get("userLogin")
	if userLogin == nil {
		return c.JSON(http.StatusUnauthorized, dto.ErrorResult{
			Code:    http.StatusUnauthorized,
			Message: "Unauthorized",
		})
	}
	userID, ok := userLogin.(int)
	if !ok {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Invalid user ID type",
		})
	}

	filename, ok := c.Get("dataFile").(string)
	if !ok || filename == "" {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "No image uploaded",
		})
	}

	user, err := h.userRepository.GetByID(uint(userID))
	if err != nil {
		log.Println("Error fetching user:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get user",
		})
	}
	if user == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "User not found",
		})
	}

	// Update foto
	user.Photo = filename
	user.UpdatedAt = time.Now()

	if err := h.userRepository.Update(user); err != nil {
		log.Println("Error updating user photo:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to update image",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: models.UserResponseJWT{
			ID:       user.ID,
			Name:     user.FirstName + " " + user.LastName,
			Email:    user.Email,
			Username: user.Username,
			Gender:   user.Gender,
			Phone:    user.Phone,
			Address:  user.Address,
			Photo:    user.Photo,
			IsAdmin:  user.IsAdmin,
		},
	})
}

func (h *Handler) DeleteUser(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid user ID format",
		})
	}

	if err := h.userRepository.Delete(uint(id)); err != nil {
		log.Println("DeleteUser Delete error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to delete user",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: "User deleted successfully",
	})
}

// ==================== Campaign Handlers ====================

func (h *Handler) CreateCampaign(c echo.Context) error {
	var req dtoCampaign.CampaignCreateRequest

	// Manual parsing multipart form
	if err := c.Request().ParseMultipartForm(10 << 20); err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{Code: http.StatusBadRequest, Message: "Failed to parse form"})
	}

	req.Title = c.FormValue("title")
	req.Description = c.FormValue("description")
	req.Details = c.FormValue("details")
	req.Category = c.FormValue("category")
	req.CPocket = c.FormValue("cpocket")
	req.Status = c.FormValue("status")
	req.Location = c.FormValue("location")

	// Parse float target_total
	targetTotalStr := c.FormValue("target_total")
	targetTotal, err := strconv.ParseFloat(targetTotalStr, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{Code: http.StatusBadRequest, Message: "Invalid target_total"})
	}
	req.TargetTotal = targetTotal

	// Parse start and end time
	startStr := c.FormValue("start")
	endStr := c.FormValue("end")
	req.Start, err = time.Parse("2006-01-02", startStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{Code: http.StatusBadRequest, Message: "Invalid start date"})
	}
	req.End, err = time.Parse("2006-01-02", endStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{Code: http.StatusBadRequest, Message: "Invalid end date"})
	}

	// File upload
	file, err := c.FormFile("photo")
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{Code: http.StatusBadRequest, Message: "Photo is required"})
	}
	src, _ := file.Open()
	defer src.Close()

	// Simpan file ke folder uploads
	filename := fmt.Sprintf("uploads/%d-%s", time.Now().Unix(), file.Filename)
	dst, _ := os.Create(filename)
	defer dst.Close()
	if _, err := io.Copy(dst, src); err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{Code: http.StatusInternalServerError, Message: "Failed to save photo"})
	}
	req.Photo = filename

	// Get user ID from context
	userIDVal := c.Get("userLogin")
	userID, ok := userIDVal.(int)
	if !ok {
		log.Println("userLogin not found or not an int")
		return c.JSON(http.StatusUnauthorized, dto.ErrorResult{
			Code:    http.StatusUnauthorized,
			Message: "Unauthorized",
		})
	}
	log.Println("Creating campaign for user ID:", userID)
	req.UserID = userID

	// Save to DB via models
	newCampaign := models.Campaign{
		Title:          req.Title,
		Description:    req.Description,
		Details:        req.Details,
		Start:          req.Start,
		End:            req.End,
		CPocket:        req.CPocket,
		Status:         req.Status,
		Photo:          req.Photo,
		TargetTotal:    req.TargetTotal,
		Category:       req.Category,
		Location:       req.Location,
		UserID:         req.UserID,
		TotalCollected: 0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := h.campaignRepository.Create(&newCampaign); err != nil {
		log.Println("CreateCampaign Create error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create campaign",
		})
	}

	return c.JSON(http.StatusCreated, dto.SuccessResult{Code: http.StatusCreated, Data: newCampaign})
}

func (h *Handler) GetCampaignByID(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid campaign ID format",
		})
	}

	campaign, err := h.campaignRepository.GetByID(uint(id))
	if err != nil {
		log.Println("GetCampaignByID GetByID error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get campaign",
		})
	}

	if campaign == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "Campaign not found",
		})
	}

	// Tambahkan baseURL ke photo
	baseURL := c.Scheme() + "://" + c.Request().Host
	if campaign.Photo != "" && !strings.HasPrefix(campaign.Photo, "http") {
		campaign.Photo = baseURL + "/" + campaign.Photo
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: campaign,
	})
}

func (h *Handler) GetAllCampaigns(c echo.Context) error {
	campaigns, err := h.campaignRepository.GetAll()
	if err != nil {
		log.Println("GetAllCampaigns GetAll error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get campaigns",
		})
	}

	baseURL := c.Scheme() + "://" + c.Request().Host

	// Tambahkan full URL ke photo jika belum lengkap
	for i, campaign := range campaigns {
		if campaign.Photo != "" && !strings.HasPrefix(campaign.Photo, "http") {
			campaigns[i].Photo = baseURL + "/" + campaign.Photo
		}
	}

	var totalCollected float64
	for _, c := range campaigns {
		totalCollected += c.TotalCollected
	}

	totalTransactions, err := h.donationRepository.CountPaid()
	if err != nil {
		log.Println("GetAllCampaigns CountPaid error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to count paid donations",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: map[string]interface{}{
			"campaigns":          campaigns,
			"total_campaigns":    len(campaigns),
			"total_collected":    totalCollected,
			"total_transactions": totalTransactions,
		},
	})
}

func (h *Handler) GetCampaignsByFilters(c echo.Context) error {
	category := c.QueryParam("category")
	location := c.QueryParam("location")

	campaigns, err := h.campaignRepository.GetByFilters(category, location)
	if err != nil {
		log.Println("GetCampaignsByFilters error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get campaigns",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: campaigns,
	})
}

func (h *Handler) UpdateCampaign(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid campaign ID format",
		})
	}

	campaign, err := h.campaignRepository.GetByID(uint(id))
	if err != nil {
		log.Println("UpdateCampaign GetByID error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get campaign",
		})
	}

	if campaign == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "Campaign not found",
		})
	}

	if err := c.Bind(campaign); err != nil {
		log.Println("UpdateCampaign Bind error:", err)
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
		})
	}

	campaign.UpdatedAt = time.Now()

	if err := h.campaignRepository.Update(campaign); err != nil {
		log.Println("UpdateCampaign Update error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to update campaign",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: campaign,
	})
}

func (h *Handler) DeleteCampaign(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid campaign ID format",
		})
	}

	if err := h.campaignRepository.Delete(uint(id)); err != nil {
		log.Println("DeleteCampaign Delete error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to delete campaign",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: "Campaign deleted successfully",
	})
}

func (h *Handler) GetDonationsByCampaign(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid campaign ID format",
		})
	}

	donations, err := h.campaignRepository.GetDonations(uint(id))
	if err != nil {
		log.Println("GetDonationsByCampaign GetDonations error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get donations for campaign",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: donations,
	})
}

// ==================== Donation Handlers ====================

func (h *Handler) CreateDonation(c echo.Context) error {
	var req models.Donation

	if err := c.Bind(&req); err != nil {
		log.Println("CreateDonation Bind error:", err)
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
		})
	}

	if req.Amount <= 0 {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Donation amount must be greater than zero",
		})
	}
	// Check if campaign exists and hasn't reached its target
	campaign, err := h.campaignRepository.GetByID(uint(req.CampaignID))
	if err != nil {
		log.Println("CreateDonation GetCampaign error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get campaign",
		})
	}

	if campaign == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "Campaign not found",
		})
	}

	if campaign.TotalCollected >= campaign.TargetTotal {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Campaign has already reached its target",
		})
	}

	now := time.Now()
	req.Date = now
	req.CreatedAt = now
	req.UpdatedAt = now
	req.Status = "pending"

	if err := h.donationRepository.Create(&req); err != nil {
		log.Println("CreateDonation Create error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create donation",
		})
	}

	paymentResp, err := h.paymentService.CreateTransaction(req)
	if err != nil {
		log.Println("CreateDonation PaymentService error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create payment",
		})
	}

	return c.JSON(http.StatusCreated, dto.SuccessResult{
		Code: http.StatusCreated,
		Data: map[string]interface{}{
			"donation":    req,
			"payment_url": paymentResp.RedirectURL,
		},
	})
}

func (h *Handler) GetDonationByID(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid donation ID format",
		})
	}

	donation, err := h.donationRepository.GetByID(uint(id))
	if err != nil {
		log.Println("GetDonationByID GetByID error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get donation",
		})
	}

	if donation == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "Donation not found",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: donation,
	})
}

func (h *Handler) GetAllDonations(c echo.Context) error {
	donations, err := h.donationRepository.GetAll()
	if err != nil {
		log.Println("GetAllDonations GetAll error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get donations",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: donations,
	})
}

func (h *Handler) UpdateDonation(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid donation ID format",
		})
	}

	donation, err := h.donationRepository.GetByID(uint(id))
	if err != nil {
		log.Println("UpdateDonation GetByID error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get donation",
		})
	}

	if donation == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "Donation not found",
		})
	}

	if err := c.Bind(donation); err != nil {
		log.Println("UpdateDonation Bind error:", err)
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
		})
	}

	donation.UpdatedAt = time.Now()

	if err := h.donationRepository.Update(donation); err != nil {
		log.Println("UpdateDonation Update error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to update donation",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: donation,
	})
}

func (h *Handler) DeleteDonation(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid donation ID format",
		})
	}

	if err := h.donationRepository.Delete(uint(id)); err != nil {
		log.Println("DeleteDonation Delete error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to delete donation",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: "Donation deleted successfully",
	})
}

func (h *Handler) GetByCampaign(c echo.Context) error {
	campaignID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid campaign ID format",
		})
	}

	donations, err := h.donationRepository.GetByCampaign(uint(campaignID))
	if err != nil {
		log.Println("GetByCampaign GetByCampaign error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get donations by campaign",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: donations,
	})
}

// ==================== Payment Notification ====================

func (h *Handler) HandlePaymentNotification(c echo.Context) error {
	var notification map[string]interface{}
	if err := c.Bind(&notification); err != nil {
		log.Println("HandlePaymentNotification Bind error:", err)
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid notification payload",
		})
	}

	orderID, ok := notification["order_id"].(string)
	if !ok {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Missing order ID in notification",
		})
	}

	success, err := h.paymentService.VerifyPayment(orderID)
	if err != nil {
		log.Println("HandlePaymentNotification VerifyPayment error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to verify payment",
		})
	}

	if success {
		donationID, _ := strconv.Atoi(orderID)
		donation, err := h.donationRepository.GetByID(uint(donationID))
		if err != nil {
			log.Println("HandlePaymentNotification GetByID error:", err)
			return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
				Code:    http.StatusInternalServerError,
				Message: "Failed to get donation",
			})
		}

		if donation == nil {
			return c.JSON(http.StatusNotFound, dto.ErrorResult{
				Code:    http.StatusNotFound,
				Message: "Donation not found",
			})
		}

		donation.Status = "paid"
		if err := h.donationRepository.Update(donation); err != nil {
			log.Println("HandlePaymentNotification Update error:", err)
			return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
				Code:    http.StatusInternalServerError,
				Message: "Failed to update donation status",
			})
		}

		campaign, err := h.campaignRepository.GetByID(uint(donation.CampaignID))
		if err != nil {
			log.Println("HandlePaymentNotification GetCampaign error:", err)
			return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
				Code:    http.StatusInternalServerError,
				Message: "Failed to get campaign",
			})
		}

		campaign.TotalCollected += donation.Amount
		if err := h.campaignRepository.Update(campaign); err != nil {
			log.Println("HandlePaymentNotification UpdateCampaign error:", err)
			return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
				Code:    http.StatusInternalServerError,
				Message: "Failed to update campaign total",
			})
		}
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: "Notification processed successfully",
	})
}

func (h *Handler) GetDonationSummary(c echo.Context) error {
	count, err := h.donationRepository.CountPaid()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    500,
			Message: "Failed to count donations",
		})
	}

	total, err := h.donationRepository.SumPaidAmount()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    500,
			Message: "Failed to sum donation amount",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: map[string]interface{}{
			"total_transactions": count,
			"total_amount":       total,
		},
	})
}
func (h *Handler) GetDonationCountByCampaign(c echo.Context) error {
	campaignID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid campaign ID format",
		})
	}

	count, err := h.donationRepository.CountByCampaign(uint(campaignID))
	if err != nil {
		log.Println("GetDonationCountByCampaign CountByCampaign error:", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to count donations for campaign",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: map[string]interface{}{
			"campaign_id": uint(campaignID),
			"count":       count,
		},
	})
}
