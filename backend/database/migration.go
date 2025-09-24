package database

import (
	"fmt"
	"zakat/models"
	"zakat/pkg/postgres"
)

func RunMigration() {
	err := postgres.DB.AutoMigrate(
		&models.User{},
		&models.Campaign{},
		&models.Donation{},
		&models.PasswordReset{},
	)
	if err != nil {
		fmt.Println("❌ Migration failed:", err)
		panic("Migration Failed")
	}
	fmt.Println("✅ Migration Success")
}
