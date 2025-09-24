package dto

import (
	"net/http"
	"time"
)

type SuccessResult struct {
	Code int         `json:"code"`
	Data interface{} `json:"data"`
}

type ErrorResult struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// BaseResponse lebih fleksibel untuk success/error response
type BaseResponse struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// Helper untuk response sukses
func SuccessResponse(data interface{}) SuccessResult {
	return SuccessResult{
		Code: http.StatusOK,
		Data: data,
	}
}

// Helper untuk response error
func ErrorResponse(code int, message string) ErrorResult {
	return ErrorResult{
		Code:    code,
		Message: message,
	}
}
