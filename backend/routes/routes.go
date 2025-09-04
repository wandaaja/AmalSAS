package routes

import (
	"net/http"

	"zakat/handlers"
	"zakat/pkg/bcrypt"
	"zakat/pkg/middleware"
	"zakat/pkg/midtrans"
	"zakat/repositories"
	"zakat/services"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"
)

func InitRouter(e *echo.Echo, db *gorm.DB) {

	// Tambahkan middleware lagi kalau mau, tapi tidak wajib karena sudah di main.go
	e.Use(echoMiddleware.Logger())
	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORS())

	// Initialize Midtrans
	midtrans.Init()

	// Repositories
	userRepo := repositories.NewUserRepository(db)
	campaignRepo := repositories.NewCampaignRepository(db)
	donationRepo := repositories.NewDonationRepository(db)

	// Services
	paymentService := services.NewPaymentService()

	// Handlers
	handler := handlers.NewHandler(userRepo, campaignRepo, donationRepo, paymentService)

	// API Routes
	api := e.Group("/api/v1")

	api.GET("/check-auth", middleware.Auth(handler.CheckAuth))

	// PATCH image
	api.PATCH("/change-image", middleware.Auth(middleware.UploadFile("photo")(handler.ChangeProfileImage)))

	api.POST("/verify-password", func(c echo.Context) error {
		var req struct {
			Password string `json:"password"`
			Hash     string `json:"hash"`
		}
		if err := c.Bind(&req); err != nil {
			return err
		}

		match := bcrypt.CheckPasswordHash(req.Password, req.Hash)
		return c.JSON(http.StatusOK, map[string]interface{}{
			"match":    match,
			"password": req.Password,
			"hash":     req.Hash,
		})
	})

	api.POST("/signup", handler.CreateUser)
	api.POST("/signin", handler.SignIn)

	// User routes
	userRoutes := api.Group("/users")
	{
		userRoutes.POST("", handler.CreateUser)
		userRoutes.GET("", handler.GetAllUsers)
		userRoutes.GET("/:id", handler.GetUser)
		userRoutes.PUT("/:id", handler.UpdateUser)
		userRoutes.DELETE("/:id", handler.DeleteUser)
		userRoutes.PUT("/change-password", middleware.Auth(handler.ChangePassword))
	}

	// Campaign routes
	campaignRoutes := api.Group("/campaigns")
	{
		// Pasang middleware Auth dan UploadFile untuk upload foto saat create campaign
		campaignRoutes.POST("/add", middleware.Auth(middleware.UploadFile("photo")(handler.CreateCampaign)))
		campaignRoutes.GET("", handler.GetAllCampaigns)
		campaignRoutes.GET("/filter", handler.GetCampaignsByFilters)
		campaignRoutes.GET("/:id", handler.GetCampaignByID)
		// Update campaign tanpa upload foto (jika perlu upload foto, gunakan route upload-photo)
		campaignRoutes.PUT("/edit/:id", handler.UpdateCampaign)
		campaignRoutes.DELETE("/:id", handler.DeleteCampaign)
		campaignRoutes.GET("/:id/donations", handler.GetDonationsByCampaign)
		// Pasang middleware Auth dan UploadFile untuk upload foto campaign
		campaignRoutes.POST("/:id/upload-photo", middleware.Auth(middleware.UploadFile("photo")(handler.UploadCampaignPhoto)))
	}

	// Donation routes
	donationRoutes := api.Group("/donations")
	{
		donationRoutes.POST("", handler.CreateDonation)
		donationRoutes.GET("", handler.GetAllDonations)
		donationRoutes.GET("/:id", handler.GetDonationByID)
		donationRoutes.PUT("/:id", handler.UpdateDonation)
		donationRoutes.DELETE("/:id", handler.DeleteDonation)
		donationRoutes.GET("/by-campaign/:id", handler.GetByCampaign)
		donationRoutes.POST("/notifications", handler.HandlePaymentNotification)
		donationRoutes.GET("/summary", handler.GetDonationSummary)
	}
}
