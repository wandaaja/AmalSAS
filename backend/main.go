package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"zakat/database"
	"zakat/pkg/midtrans"
	"zakat/pkg/postgres"
	"zakat/routes"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	fmt.Println("Environment loaded successfully")

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

	// CORS Configuration - Enhanced with proper origin validation
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Get allowed origins from environment variable or use defaults
			allowedOriginsStr := os.Getenv("ALLOWED_ORIGINS")
			var allowedOrigins []string

			if allowedOriginsStr != "" {
				allowedOrigins = strings.Split(allowedOriginsStr, ",")
				fmt.Println("Using ALLOWED_ORIGINS from environment:", allowedOrigins)
			} else {
				// Default allowed origins
				allowedOrigins = []string{
					"https://amal-sas.vercel.app",
					"https://amal-sas-git-clean-deploy-wandas-projects-40cc90e9.vercel.app",
					"http://localhost:3000",
					"http://localhost:5173", // Vite dev server
				}
				fmt.Println("Using default ALLOWED_ORIGINS:", allowedOrigins)
			}

			// Get request origin
			requestOrigin := c.Request().Header.Get("Origin")
			fmt.Println("Incoming request from origin:", requestOrigin)

			// Set default allowed origin (first in the list)
			allowOrigin := allowedOrigins[0]

			// Validate request origin against allowed origins
			if requestOrigin != "" {
				for _, origin := range allowedOrigins {
					if requestOrigin == origin {
						allowOrigin = requestOrigin
						break
					}
				}
			}

			// Set CORS headers
			c.Response().Header().Set("Access-Control-Allow-Origin", allowOrigin)
			c.Response().Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Response().Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token")
			c.Response().Header().Set("Access-Control-Allow-Credentials", "true")
			c.Response().Header().Set("Access-Control-Max-Age", "3600") // 1 hour

			// Handle preflight requests
			if c.Request().Method == http.MethodOptions {
				return c.NoContent(http.StatusNoContent)
			}

			return next(c)
		}
	})

	// Serve static files (uploads folder)
	e.Static("/uploads", "uploads")

	// Test endpoint for CORS
	e.GET("/api/test-cors", func(c echo.Context) error {
		origin := c.Request().Header.Get("Origin")
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message":   "CORS test successful",
			"timestamp": time.Now().Unix(),
			"origin":    origin,
			"allowed":   true,
		})
	})

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status": "OK",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// Database health check
	e.GET("/api/health/db", func(c echo.Context) error {
		err := postgres.DB.Raw("SELECT 1").Error
		if err != nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{
				"status":  "DB_ERROR",
				"message": err.Error(),
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"status": "DB_OK",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// Initialize routes using existing echo instance
	routes.InitRouter(e, postgres.DB)

	// Get port from environment or fallback
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Log server information
	fmt.Println("🚀 Server running on port:", port)
	fmt.Println("🌐 Allowed CORS Origins:")
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		fmt.Println("   - https://amal-sas.vercel.app")
		fmt.Println("   - https://amal-sas-git-clean-deploy-wandas-projects-40cc90e9.vercel.app")
		fmt.Println("   - http://localhost:3000")
		fmt.Println("   - http://localhost:5173")
	} else {
		for _, origin := range strings.Split(allowedOrigins, ",") {
			fmt.Println("   -", origin)
		}
	}
	fmt.Println("💳 Payment Notification: https://amalsas-production.up.railway.app/api/v1/donations/notifications")
	fmt.Println("📊 Health Check: https://amalsas-production.up.railway.app/health")
	fmt.Println("🔧 DB Health Check: https://amalsas-production.up.railway.app/api/health/db")

	// Start server
	e.Logger.Fatal(e.Start(":" + port))
}
