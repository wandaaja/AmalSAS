package middleware

import (
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
)

type Result struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func UploadFile(next echo.HandlerFunc, formImage string) echo.HandlerFunc {
	return func(c echo.Context) error {
		const MAX_UPLOAD_SIZE = 10 << 20 // 10MB

		// Limit size
		c.Request().Body = http.MaxBytesReader(c.Response(), c.Request().Body, MAX_UPLOAD_SIZE)

		err := c.Request().ParseMultipartForm(MAX_UPLOAD_SIZE)
		if err != nil {
			return c.JSON(http.StatusBadRequest, Result{
				Code:    http.StatusBadRequest,
				Message: "File too large",
			})
		}

		file, _, err := c.Request().FormFile(formImage)
		if err != nil {
			fmt.Println("FormFile error:", err)
			return c.JSON(http.StatusBadRequest, Result{
				Code:    http.StatusBadRequest,
				Message: "Error retrieving the file",
			})
		}
		defer file.Close()

		tempFile, err := os.CreateTemp("uploads", "image-*.png")
		if err != nil {
			fmt.Println("Temp file error:", err)
			return c.JSON(http.StatusInternalServerError, Result{
				Code:    http.StatusInternalServerError,
				Message: "Failed to create temp file",
			})
		}
		defer tempFile.Close()

		_, err = io.Copy(tempFile, file)
		if err != nil {
			fmt.Println("Copy error:", err)
			return c.JSON(http.StatusInternalServerError, Result{
				Code:    http.StatusInternalServerError,
				Message: "Failed to save file",
			})
		}

		filename := tempFile.Name()[8:]
		c.Set("dataFile", filename)

		return next(c)
	}
}
