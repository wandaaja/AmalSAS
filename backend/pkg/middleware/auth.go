package middleware

import (
	"fmt"
	"net/http"
	"strings"

	dto "zakat/dto/result"
	jwtToken "zakat/pkg/jwt"

	"github.com/labstack/echo/v4"
)

// Auth is an Echo middleware
func Auth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return c.JSON(http.StatusUnauthorized, dto.ErrorResult{
				Code:    http.StatusUnauthorized,
				Message: "Authorization header missing",
			})
		}

		splitToken := strings.Split(authHeader, " ")
		if len(splitToken) != 2 || strings.ToLower(splitToken[0]) != "bearer" {
			return c.JSON(http.StatusUnauthorized, dto.ErrorResult{
				Code:    http.StatusUnauthorized,
				Message: "Invalid token format",
			})
		}

		token := splitToken[1]

		claims, err := jwtToken.DecodeToken(token)
		if err != nil {
			fmt.Println("Decode error:", err)
			return c.JSON(http.StatusUnauthorized, dto.ErrorResult{
				Code:    http.StatusUnauthorized,
				Message: "Invalid or expired token",
			})
		}

		fmt.Println("Decoded claims:", claims)

		// Simpan user ID ke context Echo
		c.Set("userLogin", int(claims["id"].(float64)))

		return next(c)
	}
}
