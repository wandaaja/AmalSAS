package handlers

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"
	dtoAuth "zakat/dto/auth"
	dtoCampaign "zakat/dto/campaign"
	dtoDonation "zakat/dto/donations"
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
	passwordRepository repositories.PasswordResetRepository
}

func NewHandler(
	userRepo repositories.UserRepository,
	campaignRepo repositories.CampaignRepository,
	donationRepo repositories.DonationRepository,
	paymentService services.PaymentService,
	passwordRepo repositories.PasswordResetRepository,
) *Handler {
	return &Handler{
		userRepository:     userRepo,
		campaignRepository: campaignRepo,
		donationRepository: donationRepo,
		paymentService:     paymentService,
		passwordRepository: passwordRepo,
	}
}

// ========= password handle =======
type ForgotPasswordRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Whatsapp string `json:"whatsapp,omitempty"` // Opsional
}
type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

// Generate random token
func generateResetToken() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 32)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func (h *Handler) ForgotPassword(c echo.Context) error {
	var req ForgotPasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request format",
		})
	}

	// Validasi email
	if req.Email == "" {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Email is required",
		})
	}

	// Cek apakah user dengan email tersebut ada
	user, err := h.userRepository.GetByEmail(req.Email)
	if err != nil || user == nil {
		// Untuk keamanan, jangan beri tahu jika email tidak ditemukan
		return c.JSON(http.StatusOK, dto.SuccessResult{
			Code: http.StatusOK,
			Data: "If the email exists, a reset link has been sent",
		})
	}

	// Generate reset token
	token := generateResetToken()
	expiresAt := time.Now().Add(1 * time.Hour) // Token berlaku 1 jam

	// Simpan token ke database
	resetRecord := &models.PasswordReset{
		Email:     req.Email,
		Token:     token,
		ExpiresAt: expiresAt,
		Used:      false,
	}

	if err := h.passwordRepository.Create(resetRecord); err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create reset token",
		})
	}

	// TODO: Implementasi pengiriman email
	resetLink := fmt.Sprintf("https://yourdomain.com/reset-password?token=%s", token)

	// Kirim via Email (implementasi nyata akan menggunakan service email)
	fmt.Printf("Reset link for %s: %s\n", req.Email, resetLink)

	// Kirim via WhatsApp jika provided (implementasi nyata akan menggunakan API WhatsApp)
	if req.Whatsapp != "" {
		whatsappMessage := fmt.Sprintf("Halo! Untuk reset password Anda, silakan klik link berikut: %s", resetLink)
		fmt.Printf("WhatsApp message to %s: %s\n", req.Whatsapp, whatsappMessage)
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: map[string]interface{}{
			"message": "Reset instructions sent successfully",
			"channel": "email", // atau "whatsapp" jika dikirim via WhatsApp
		},
	})
}

func (h *Handler) ResetPassword(c echo.Context) error {
	var req ResetPasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request format",
		})
	}

	// Validasi token
	resetRecord, err := h.passwordRepository.GetByToken(req.Token)
	if err != nil || resetRecord == nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid or expired reset token",
		})
	}

	// Cek apakah token sudah digunakan
	if resetRecord.Used {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Reset token has already been used",
		})
	}

	// Cek apakah token sudah expired
	if time.Now().After(resetRecord.ExpiresAt) {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Reset token has expired",
		})
	}

	// Cari user berdasarkan email
	user, err := h.userRepository.GetByEmail(resetRecord.Email)
	if err != nil || user == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "User not found",
		})
	}

	// Hash password baru
	hashedPassword, err := bcrypt.HashingPassword(req.NewPassword)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Error hashing password",
		})
	}

	// Update password user
	user.Password = hashedPassword
	user.UpdatedAt = time.Now()

	if err := h.userRepository.Update(user); err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to update password",
		})
	}

	// Tandai token sebagai sudah digunakan
	if err := h.passwordRepository.MarkAsUsed(req.Token); err != nil {
		// Log error tapi jangan return error ke client karena password sudah diupdate
		fmt.Printf("Failed to mark token as used: %v\n", err)
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: "Password reset successfully",
	})
}

// VerifyResetToken handler
func (h *Handler) VerifyResetToken(c echo.Context) error {
	token := c.QueryParam("token")
	if token == "" {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Token is required",
		})
	}

	resetRecord, err := h.passwordRepository.GetByToken(token)
	if err != nil || resetRecord == nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid or expired reset token",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: map[string]interface{}{
			"valid":      true,
			"email":      resetRecord.Email,
			"expires_at": resetRecord.ExpiresAt,
		},
	})
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

func (h *Handler) GetAdminCount(c echo.Context) error {
	count, err := h.userRepository.CountAdmins()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get admin count",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"admin_count":      count,
		"max_admins":       3,
		"can_create_admin": count < 3,
	})
}

// ==================== User Handlers ====================

func (h *Handler) CreateUser(c echo.Context) error {
	var req dtoAuth.SignUpRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
		})
	}

	log.Printf("Request Body: %+v", req)

	// Cek apakah username sudah digunakan
	if existingUser, _ := h.userRepository.GetByUsername(req.Username); existingUser != nil {
		return c.JSON(http.StatusConflict, dto.ErrorResult{
			Code:    http.StatusConflict,
			Message: "Username sudah digunakan",
		})
	}

	// Cek apakah email sudah digunakan
	if existingUser, _ := h.userRepository.GetByEmail(req.Email); existingUser != nil {
		return c.JSON(http.StatusConflict, dto.ErrorResult{
			Code:    http.StatusConflict,
			Message: "Email sudah digunakan",
		})
	}

	// Cek batas admin (max 3)
	if req.IsAdmin {
		adminCount, err := h.userRepository.CountAdmins()
		if err != nil {
			log.Printf("❌ Error CountAdmins: %v", err)
			return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
				Code:    http.StatusInternalServerError,
				Message: "Failed to check admin count",
			})
		}

		if adminCount >= 3 {
			return c.JSON(http.StatusForbidden, dto.ErrorResult{
				Code:    http.StatusForbidden,
				Message: "Admin limit reached (max 3 admins allowed)",
			})
		}
	}

	// Hash password
	hashedPassword, err := bcrypt.HashingPassword(req.Password)
	if err != nil {
		log.Printf("❌ Error hashing password: %v", err)
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
		log.Printf("❌ Error CreateUser DB: %v", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create user",
		})
	}

	// Generate JWT token
	claims := jwt.MapClaims{
		"id":       user.ID,
		"email":    user.Email,
		"is_admin": user.IsAdmin,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	}
	tokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	secretKey := []byte(jwtToken.GetSecretKey())
	token, err := tokenObj.SignedString(secretKey)
	if err != nil {
		log.Printf("❌ Error generate token: %v", err)
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to generate authentication token",
		})
	}

	// Buat response AuthData
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
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Server error",
		})
	}

	if user == nil {
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

	// Gunakan DTO untuk request
	var req dtoAuth.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
		})
	}
	println(req, "req")

	// Update hanya jika field tidak kosong
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Username != "" {
		user.Username = req.Username
	}
	if req.Gender != "" {
		user.Gender = req.Gender
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Address != "" {
		user.Address = req.Address
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Photo != "" {
		user.Photo = req.Photo
	}

	user.UpdatedAt = time.Now()

	if err := h.userRepository.Update(user); err != nil {
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

	// Ambil URL Cloudinary dari context
	cloudinaryURL, ok := c.Get("dataFile").(string)
	if !ok || cloudinaryURL == "" {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "No image uploaded",
		})
	}

	user, err := h.userRepository.GetByID(uint(userID))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get user",
		})
	}

	if user == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "User  not found",
		})
	}

	// Tidak perlu hapus file lokal karena sudah upload ke Cloudinary

	// Update field photo dengan URL Cloudinary
	user.Photo = cloudinaryURL
	user.UpdatedAt = time.Now()

	if err := h.userRepository.Update(user); err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to update image",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: map[string]interface{}{
			"message": "Profile image updated successfully",
			"photo":   cloudinaryURL,
			"user": models.UserResponseJWT{
				ID:       user.ID,
				Name:     user.FirstName + " " + user.LastName,
				Email:    user.Email,
				Username: user.Username,
				Gender:   user.Gender,
				Phone:    user.Phone,
				Address:  user.Address,
				Photo:    cloudinaryURL,
				IsAdmin:  user.IsAdmin,
			},
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

	// Manual parsing multipart form (untuk field non-file)
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

	targetTotalStr := c.FormValue("target_total")
	targetTotal, err := strconv.ParseFloat(targetTotalStr, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{Code: http.StatusBadRequest, Message: "Invalid target_total"})
	}
	req.TargetTotal = targetTotal

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

	// Ambil URL foto hasil upload Cloudinary dari middleware
	photoURL, ok := c.Get("dataFile").(string)
	if !ok || photoURL == "" {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{Code: http.StatusBadRequest, Message: "Photo is required"})
	}
	req.Photo = photoURL

	userIDVal := c.Get("userLogin")
	userID, ok := userIDVal.(int)
	if !ok {
		return c.JSON(http.StatusUnauthorized, dto.ErrorResult{
			Code:    http.StatusUnauthorized,
			Message: "Unauthorized",
		})
	}
	req.UserID = userID

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
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create campaign",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: map[string]interface{}{
			"id":      newCampaign.ID,
			"title":   newCampaign.Title,
			"message": "Campaign berhasil dibuat",
		},
	})
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
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get campaigns",
		})
	}

	baseURL := c.Scheme() + "://" + c.Request().Host // e.g., http://localhost:5000

	// Tambahkan full URL ke photo jika belum lengkap
	for i, campaign := range campaigns {
		if campaign.Photo != "" {
			if strings.HasPrefix(campaign.Photo, "http") {
				// Sudah full URL, biarkan saja
				continue
			} else if strings.HasPrefix(campaign.Photo, "uploads/") {
				// Format: uploads/filename.jpg
				campaigns[i].Photo = baseURL + "/" + campaign.Photo
			} else {
				// Format: filename.jpg (tanpa folder)
				campaigns[i].Photo = baseURL + "/uploads/" + campaign.Photo
			}
		} else {
			// Default image jika tidak ada photo
			campaigns[i].Photo = "https://via.placeholder.com/600x300?text=No+Image"
		}
	}
	var totalCollected float64
	for _, c := range campaigns {
		totalCollected += c.TotalCollected
	}

	totalTransactions, err := h.donationRepository.CountPaid()
	if err != nil {
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

	// Get existing campaign
	campaign, err := h.campaignRepository.GetByID(uint(id))
	if err != nil {
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

	// Bind to DTO instead of directly to model
	var updateRequest dtoCampaign.CampaignCreateRequest
	if err := c.Bind(&updateRequest); err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
		})
	}

	// Update campaign fields from DTO
	campaign.Title = updateRequest.Title
	campaign.Description = updateRequest.Description
	campaign.Details = updateRequest.Details
	campaign.Start = updateRequest.Start
	campaign.End = updateRequest.End
	campaign.CPocket = updateRequest.CPocket
	campaign.Status = updateRequest.Status
	campaign.TargetTotal = updateRequest.TargetTotal
	campaign.Category = updateRequest.Category
	campaign.Location = updateRequest.Location
	campaign.UpdatedAt = time.Now()

	// Handle photo upload separately if needed
	if updateRequest.Photo != "" {
		campaign.Photo = updateRequest.Photo
	}

	if err := h.campaignRepository.Update(campaign); err != nil {
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

func (h *Handler) UploadCampaignPhoto(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid campaign ID",
		})
	}

	campaign, err := h.campaignRepository.GetByID(uint(id))
	if err != nil || campaign == nil {
		return c.JSON(http.StatusNotFound, dto.ErrorResult{
			Code:    http.StatusNotFound,
			Message: "Campaign not found",
		})
	}

	// Ambil URL foto hasil upload Cloudinary dari middleware
	photoURL, ok := c.Get("dataFile").(string)
	if !ok || photoURL == "" {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "No photo file provided",
		})
	}

	// Update campaign dengan URL Cloudinary
	campaign.Photo = photoURL
	campaign.UpdatedAt = time.Now()

	if err := h.campaignRepository.Update(campaign); err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to update campaign photo",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: map[string]interface{}{
			"message":  "Photo uploaded successfully",
			"filename": photoURL,
		},
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
	var req dtoDonation.DonationCreateRequest
	if err := c.Bind(&req); err != nil {
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

	campaign, err := h.campaignRepository.GetByID(uint(req.CampaignID))
	if err != nil {
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

	user, err := h.userRepository.GetByID(uint(req.UserID))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get user information",
		})
	}

	now := time.Now()

	orderID := fmt.Sprintf("DONATION-%d-%d", req.UserID, now.Unix())

	donation := models.Donation{
		Amount:     req.Amount,
		Date:       now,
		Status:     "pending",
		UserID:     req.UserID,
		CampaignID: req.CampaignID,
		CreatedAt:  now,
		UpdatedAt:  now,
		OrderID:    orderID,
	}

	if err := h.donationRepository.Create(&donation); err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create donation",
		})
	}

	donation.User = *user
	donation.Campaign = *campaign

	paymentResp, err := h.paymentService.CreateTransaction(donation)
	if err != nil {
		donation.Status = "failed"
		_ = h.donationRepository.Update(&donation)

		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create payment: " + err.Error(),
		})
	}

	donation.PaymentURL = paymentResp.RedirectURL
	if err := h.donationRepository.Update(&donation); err != nil {
	}

	return c.JSON(http.StatusCreated, dto.SuccessResult{
		Code: http.StatusCreated,
		Data: map[string]interface{}{
			"donation":    donation,
			"payment_url": paymentResp.RedirectURL,
			"token":       paymentResp.Token,
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

// GetAllDonationsAdmin - Get all donations for admin
func (h *Handler) GetAllDonationsAdmin(c echo.Context) error {
	// Check if user is admin
	userID := c.Get("userLogin").(int)
	user, err := h.userRepository.GetByID(uint(userID))
	if err != nil || user == nil || !user.IsAdmin {
		return c.JSON(http.StatusForbidden, dto.ErrorResult{
			Code:    http.StatusForbidden,
			Message: "Access denied. Admin only.",
		})
	}

	donations, err := h.donationRepository.GetAllWithDetails()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to fetch donations",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: donations,
	})
}

// GetDonationsByUser - Get donations by user ID
func (h *Handler) GetDonationsByUser(c echo.Context) error {
	userIDStr := c.Param("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid user ID",
		})
	}

	// Check if requesting own data or admin
	currentUserID := c.Get("userLogin").(int)
	currentUser, err := h.userRepository.GetByID(uint(currentUserID))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to verify user",
		})
	}

	// Allow if admin or requesting own data
	if !currentUser.IsAdmin && currentUserID != userID {
		return c.JSON(http.StatusForbidden, dto.ErrorResult{
			Code:    http.StatusForbidden,
			Message: "Access denied",
		})
	}

	donations, err := h.donationRepository.GetByUser(uint(userID))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to fetch user donations",
		})
	}

	return c.JSON(http.StatusOK, dto.SuccessResult{
		Code: http.StatusOK,
		Data: donations,
	})
}

// GetAllDonations - Get all donations (bisa dengan filter)
func (h *Handler) GetAllDonations(c echo.Context) error {
	// Jika ada query parameter campaign_id, filter by campaign
	campaignID := c.QueryParam("campaign_id")
	if campaignID != "" {
		campaignIDUint, err := strconv.ParseUint(campaignID, 10, 32)
		if err != nil {
			return c.JSON(http.StatusBadRequest, dto.ErrorResult{
				Code:    http.StatusBadRequest,
				Message: "Invalid campaign ID",
			})
		}

		donations, err := h.donationRepository.GetByCampaign(uint(campaignIDUint))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
				Code:    http.StatusInternalServerError,
				Message: "Failed to fetch campaign donations",
			})
		}

		return c.JSON(http.StatusOK, dto.SuccessResult{
			Code: http.StatusOK,
			Data: donations,
		})
	}

	// Jika tidak ada filter, kembalikan semua donations
	donations, err := h.donationRepository.GetAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to fetch donations",
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
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
		})
	}

	donation.UpdatedAt = time.Now()

	if err := h.donationRepository.Update(donation); err != nil {
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
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Invalid notification payload",
		})
	}

	// Ambil order_id
	orderID, ok := notification["order_id"].(string)
	if !ok || orderID == "" {
		return c.JSON(http.StatusBadRequest, dto.ErrorResult{
			Code:    http.StatusBadRequest,
			Message: "Missing order ID in notification",
		})
	}

	// Ambil transaction status
	transactionStatus, _ := notification["transaction_status"].(string)
	fraudStatus, _ := notification["fraud_status"].(string)
	paymentType, _ := notification["payment_type"].(string)

	// Cari donation berdasarkan order_id
	donation, err := h.donationRepository.GetByOrderID(orderID)
	if err != nil {
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

	// Mapping status Midtrans ke status internal
	switch transactionStatus {
	case "capture":
		switch fraudStatus {
		case "accept":
			donation.Status = "success"
		case "challenge":
			donation.Status = "pending"
		default:
			donation.Status = "failed"
		}

	case "settlement":
		donation.Status = "success"

	case "pending":
		donation.Status = "pending"

	case "deny", "cancel", "expire":
		donation.Status = "failed"

	default:
		donation.Status = "unknown"
	}

	donation.PaymentMethod = paymentType

	// Update donation
	if err := h.donationRepository.Update(donation); err != nil {
		return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
			Code:    http.StatusInternalServerError,
			Message: "Failed to update donation status",
		})
	}

	// Kalau sukses, update campaign total_collected
	if donation.Status == "success" {
		campaign, err := h.campaignRepository.GetByID(uint(donation.CampaignID))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, dto.ErrorResult{
				Code:    http.StatusInternalServerError,
				Message: "Failed to get campaign",
			})
		}

		campaign.TotalCollected += donation.Amount
		if err := h.campaignRepository.Update(campaign); err != nil {
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
