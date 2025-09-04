package main

import (
	"fmt"
	"log"
	"os"

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
		log.Fatal("Failed to load .env file")
	}
	fmt.Println("SECRET_KEY from .env:", os.Getenv("SECRET_KEY"))
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
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.PATCH, echo.DELETE},
		AllowHeaders: []string{"X-Requested-With", "Content-Type", "Authorization"},
	}))

	// Serve static files (uploads folder)
	e.Static("/uploads", "uploads")

	// Initialize routes using existing echo instance
	routes.InitRouter(e, postgres.DB)

	// Get port from .env or fallback
	port := os.Getenv("PORT")
	if port == "" {
		port = "5050"
	}

	fmt.Println("🚀 Server running at http://localhost:" + port)
	fmt.Println("🔗 Midtrans Environment: Sandbox")
	fmt.Println("💳 Payment Notification: http://localhost:" + port + "/api/v1/donations/notifications")

	fmt.Println("🚀 Server running at http://localhost:" + port)
	e.Logger.Fatal(e.Start(":" + port))
}
