package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"cc-pdp/handlers"
	"cc-pdp/services"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func main() {
	// Configure logging
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetLevel(logrus.InfoLevel)

	// Get configuration from environment variables
	config := getConfig()

	// Initialize OPA client for direct policy evaluation
	opaClient := services.NewOPAClient(config.OPAURL)

	// Initialize PAP client for policy management
	papClient := services.NewPAPClient(config.PAPURL)

	// Initialize PDP service
	pdpService := services.NewPDPService(opaClient, papClient)

	// Initialize handlers
	authHandler := handlers.NewAuthorizationHandler(pdpService)

	// Setup Gin router
	router := setupRouter(authHandler)

	// Configure server
	port := fmt.Sprintf(":%s", config.Port)
	srv := &http.Server{
		Addr:         port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logrus.WithField("port", config.Port).Info("🚀 Starting PDP server")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.WithError(err).Fatal("Failed to start server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logrus.Info("Shutting down server...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logrus.WithError(err).Error("Server forced to shutdown")
	} else {
		logrus.Info("Server shutdown gracefully")
	}
}

// Config holds application configuration
type Config struct {
	Port   string
	PAPURL string
	OPAURL string
}

// getConfig loads configuration from environment variables with defaults
func getConfig() *Config {
	// Check for PORT first (standard), then PDP_PORT (specific), then default
	port := os.Getenv("PORT")
	if port == "" {
		port = getEnvOrDefault("PDP_PORT", "8081")
	}

	// Get required URLs from environment variables
	papURL := getEnvOrDefault("PAP_URL", os.Getenv("PAP_ENDPOINT"))
	if papURL == "" {
		logrus.Fatal("❌ PAP_URL or PAP_ENDPOINT environment variable is required")
	}

	opaURL := getEnvOrDefault("OPA_URL", os.Getenv("OPAL_CLIENT_URL"))
	if opaURL == "" {
		logrus.Fatal("❌ OPA_URL or OPAL_CLIENT_URL environment variable is required")
	}

	config := &Config{
		Port:   port,
		PAPURL: papURL,
		OPAURL: opaURL,
	}

	// Log configuration
	logrus.WithFields(logrus.Fields{
		"port":     config.Port,
		"pap_url":  config.PAPURL,
		"opa_url":  config.OPAURL,
		"gin_mode": getEnvOrDefault("GIN_MODE", "release"),
	}).Info("📋 Configuration loaded")

	return config
}

// getEnvOrDefault returns environment variable value or default if not set
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// setupRouter configures the Gin router with all routes and middleware
func setupRouter(authHandler *handlers.AuthorizationHandler) *gin.Engine {
	// Set Gin mode based on environment
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(corsMiddleware())
	router.Use(requestIDMiddleware())

	// Health check endpoints
	router.GET("/health", authHandler.HealthCheck)
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "ok",
			"service":   "PDP",
			"timestamp": time.Now(),
		})
	})

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Authorization endpoints - the core functionality
		v1.POST("/authorize", authHandler.Authorize)
		v1.POST("/authorize/bulk", authHandler.BulkAuthorize)

		// Policy information endpoints
		v1.GET("/policies", authHandler.GetPolicyInfo)

		// OPA debugging endpoints
		v1.GET("/opa/data", authHandler.GetOPAData)
	}

	// Documentation endpoint
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service":     "ControlCore PDP",
			"version":     "1.0.0",
			"description": "Policy Decision Point for ControlCore - accepts IAuthorizationRequest format ONLY",
			"endpoints": gin.H{
				"authorization": gin.H{
					"POST /api/v1/authorize":      "Make authorization decision",
					"POST /api/v1/authorize/bulk": "Make bulk authorization decisions",
				},
				"policies": gin.H{
					"GET /api/v1/policies": "Get policy information from PAP",
				},
				"debugging": gin.H{
					"GET /api/v1/opa/data": "Get current OPA data for debugging",
				},
				"health": gin.H{
					"GET /health":  "Health check",
					"GET /healthz": "Simple health check",
				},
			},
			"format": "IAuthorizationRequest with User, Resource, Action, and Context fields",
		})
	})

	return router
}

// corsMiddleware adds CORS headers
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Request-ID, X-Environment")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// requestIDMiddleware adds request ID to context
func requestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}
		c.Header("X-Request-ID", requestID)
		c.Set("RequestID", requestID)
		c.Next()
	}
}

// generateRequestID generates a simple request ID
func generateRequestID() string {
	return fmt.Sprintf("req_%d", time.Now().UnixNano())
}
