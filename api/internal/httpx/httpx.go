package httpx

import (
	"errors"
	"os"

	"github.com/gofiber/fiber/v2"
)

type AppError struct {
	Status  int
	Message string
	Details any
}

func (e *AppError) Error() string { return e.Message }

func New(status int, message string, details ...any) *AppError {
	err := &AppError{Status: status, Message: message}
	if len(details) > 0 {
		err.Details = details[0]
	}
	return err
}

func Success(c *fiber.Ctx, data any) error {
	return c.JSON(fiber.Map{"status": "success", "data": data})
}

func Created(c *fiber.Ctx, data any) error {
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"status": "success", "data": data})
}

func Message(c *fiber.Ctx, message string) error {
	return c.JSON(fiber.Map{"status": "success", "message": message})
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"
	var details any

	var app *AppError
	if errors.As(err, &app) {
		code = app.Status
		message = app.Message
		details = app.Details
	} else {
		var fe *fiber.Error
		if errors.As(err, &fe) {
			code = fe.Code
			message = fe.Message
		} else if err != nil {
			message = err.Error()
		}
	}

	payload := fiber.Map{"status": "error", "message": message}
	if details != nil {
		payload["details"] = details
	}
	if os.Getenv("NODE_ENV") != "production" {
		payload["stack"] = err.Error()
	}
	return c.Status(code).JSON(payload)
}
