package main

import (
	"fmt"
	"log"
	"os"

	"zakat/database"
	"zakat/pkg/mysql"
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

	// Initialize database connection
	mysql.DatabaseInit()

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
	routes.InitRouter(e, mysql.DB)

	// Get port from .env or fallback
	port := os.Getenv("PORT")
	if port == "" {
		port = "5050"
	}

	fmt.Println("🚀 Server running at http://localhost:" + port)
	e.Logger.Fatal(e.Start(":" + port))
}
