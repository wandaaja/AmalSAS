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

	// Ganti CORS middleware dengan ini saja:
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Response().Header().Set("Access-Control-Allow-Origin", "https://amal-sas.vercel.app")
			c.Response().Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Response().Header().Set("Access-Control-Allow-Headers", "*")
			c.Response().Header().Set("Access-Control-Allow-Credentials", "true")

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
		c.Response().Header().Set("Access-Control-Allow-Origin", "https://amal-sas.vercel.app")
		c.Response().Header().Set("Access-Control-Allow-Credentials", "true")
		return c.JSON(200, map[string]interface{}{
			"message":   "CORS test successful",
			"origin":    c.Request().Header.Get("Origin"),
			"timestamp": time.Now().Unix(),
		})
	})

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		c.Response().Header().Set("Access-Control-Allow-Origin", "*")
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
		port = "5050"
	}

	fmt.Println("🚀 Server running on port:", port)
	fmt.Println("🔗 Midtrans Environment: Sandbox")
	fmt.Println("🌐 Allowed Origins:", getCORSOrigins())
	fmt.Println("💳 Payment Notification: http://localhost:" + port + "/api/v1/donations/notifications")

	e.Logger.Fatal(e.Start(":" + port))
}
