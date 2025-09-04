package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/labstack/echo/v4"
)

type Result struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func UploadFile(formImage string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			const MAX_UPLOAD_SIZE = 10 << 20 // 10MB

			// Batasi ukuran upload
			c.Request().Body = http.MaxBytesReader(c.Response(), c.Request().Body, MAX_UPLOAD_SIZE)

			err := c.Request().ParseMultipartForm(MAX_UPLOAD_SIZE)
			if err != nil {
				return c.JSON(http.StatusBadRequest, Result{
					Code:    http.StatusBadRequest,
					Message: "File too large",
				})
			}

			file, fileHeader, err := c.Request().FormFile(formImage)
			if err != nil {
				return c.JSON(http.StatusBadRequest, Result{
					Code:    http.StatusBadRequest,
					Message: "Error retrieving the file",
				})
			}
			defer file.Close()

			// Ambil konfigurasi Cloudinary dari environment variables
			cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
			apiKey := os.Getenv("CLOUDINARY_API_KEY")
			apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

			// Validasi konfigurasi
			if cloudName == "" || apiKey == "" || apiSecret == "" {
				return c.JSON(http.StatusInternalServerError, Result{
					Code:    http.StatusInternalServerError,
					Message: "Cloudinary configuration missing",
				})
			}

			// Inisialisasi Cloudinary
			cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, Result{
					Code:    http.StatusInternalServerError,
					Message: "Failed to initialize cloudinary",
				})
			}

			// Buat public ID unik untuk file
			publicID := fmt.Sprintf("uploads/%d-%s", time.Now().UnixNano(), fileHeader.Filename)

			// Upload ke Cloudinary
			uploadResult, err := cld.Upload.Upload(context.Background(), file, uploader.UploadParams{
				PublicID: publicID,
			})
			if err != nil {
				return c.JSON(http.StatusInternalServerError, Result{
					Code:    http.StatusInternalServerError,
					Message: "Failed to upload file to cloudinary",
				})
			}

			// Simpan URL hasil upload ke context agar handler bisa akses
			c.Set("dataFile", uploadResult.SecureURL)

			return next(c)
		}
	}
}
