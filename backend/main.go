package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"zakat/database"
	"zakat/pkg/midtrans"
	"zakat/pkg/postgres"
	"zakat/routes"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func getCORSOrigins() []string {
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "https://amal-sas.vercel.app"
	}

	// Allow both the frontend URL and any Railway preview URLs
	return []string{
		frontendURL,
		"https://amal-sas.vercel.app",
		"http://localhost:3000",
		"http://localhost:5173",
	}
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment")
	}

	fmt.Println("Environment loaded successfully")
	fmt.Println("FRONTEND_URL:", os.Getenv("FRONTEND_URL"))

	// Initialize Midtrans
	fmt.Println("Initializing Midtrans...")
	midtrans.Init()

	// Initialize database connection
	postgres.DatabaseInit()

	// Run database migration
	database.RunMigration()

	// Create Echo instance
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Enhanced CORS configuration
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     getCORSOrigins(),
		AllowMethods:     []string{echo.GET, echo.POST, echo.PUT, echo.PATCH, echo.DELETE, echo.OPTIONS},
		AllowHeaders:     []string{"*"},
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	// Additional CORS handling for preflight requests
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Set CORS headers
			origin := c.Request().Header.Get("Origin")
			if origin != "" {
				allowedOrigins := getCORSOrigins()
				for _, allowedOrigin := range allowedOrigins {
					if origin == allowedOrigin || allowedOrigin == "*" {
						c.Response().Header().Set("Access-Control-Allow-Origin", origin)
						break
					}
				}
			}

			c.Response().Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Response().Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin")
			c.Response().Header().Set("Access-Control-Allow-Credentials", "true")
			c.Response().Header().Set("Access-Control-Max-Age", "86400")

			// Handle preflight requests
			if c.Request().Method == "OPTIONS" {
				return c.NoContent(200)
			}

			return next(c)
		}
	})

	// Serve static files (uploads folder)
	e.Static("/uploads", "uploads")

	// Test endpoint for CORS
	e.GET("/api/test-cors", func(c echo.Context) error {
		return c.JSON(200, map[string]interface{}{
			"message":   "CORS test successful",
			"origin":    c.Request().Header.Get("Origin"),
			"timestamp": time.Now().Unix(),
		})
	})

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(200, map[string]string{
			"status": "OK",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// Initialize routes using existing echo instance
	routes.InitRouter(e, postgres.DB)

	// Get port from .env or fallback
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Println("🚀 Server running on port:", port)
	fmt.Println("🔗 Midtrans Environment: Sandbox")
	fmt.Println("🌐 Allowed Origins:", getCORSOrigins())
	fmt.Println("💳 Payment Notification: http://localhost:" + port + "/api/v1/donations/notifications")

	e.Logger.Fatal(e.Start(":" + port))
}
