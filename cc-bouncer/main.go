package main

import (
	"bytes"
	"cc-bouncer/models"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"cc-bouncer/handlers"
	"cc-bouncer/services"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// Control Core Bouncer - Policy Enforcement Point (PEP) with integrated PDP
// This is the reverse proxy that enforces policies on incoming requests
// and includes Policy Decision Point (PDP) functionality

// BouncerConfig represents the configuration for the Bouncer
type BouncerConfig struct {
	Port           string
	TargetHost     string
	PAPAPIURL      string
	OPALServerURL  string
	TenantID       string
	APIKey         string
	EncryptionKey  string
	LogEnabled     bool
	MaxBodySize    int64
	CacheEnabled   bool
	CacheTTL       time.Duration
	MetricsEnabled bool
	MetricsPort    string
}

// ControlCoreBouncer is the main Bouncer implementation with integrated PDP
type ControlCoreBouncer struct {
	config           *BouncerConfig
	policyCache      *services.PolicyCache
	decisionCache    *services.DecisionCache
	auditLogger      *services.AuditLogger
	authExtractor    *AuthorizationExtractor
	contentInjector  *services.ContentInjector
	pdpService       *services.PDPService
	opaClient        *services.OPAClient
	papClient        *services.PAPClient
	policyManager    *services.PolicyManager
	policyEngine     *services.PolicyEngine
	opalClient       *services.OPALClient
	contextIngestion *services.ContextIngestionService
	contextConfig    *services.ContextConfigManager
	opalPIPService   *services.OPALPIPService
	telemetryClient  *services.TelemetryClient
}

// NewControlCoreBouncer creates a new Bouncer instance with integrated PDP
func NewControlCoreBouncer(config *BouncerConfig) *ControlCoreBouncer {
	// Initialize OPA client for direct policy evaluation
	opaClient := services.NewOPAClient(config.OPALServerURL)

	// Initialize PAP client for policy management
	papClient := services.NewPAPClient(config.PAPAPIURL)

	// Initialize PDP service
	pdpService := services.NewPDPService(opaClient, papClient)

	// Initialize OPAL client for policy synchronization
	opalClient := services.NewOPALClient(config.OPALServerURL)
	opalClient.SetCredentials(config.TenantID, config.APIKey)

	// INTELLIGENT ENVIRONMENT-AWARE CONFIGURATION
	// Set bouncer ID and environment so OPAL can automatically filter policies
	// Control Core handles the intelligence - no manual configuration needed
	bouncerID := getEnv("BOUNCER_ID", generateBouncerID())
	environment := getEnv("ENVIRONMENT", "sandbox")
	opalClient.SetEnvironmentContext(bouncerID, environment)

	// Initialize policy cache
	policyCache := services.NewPolicyCache(config.CacheTTL, 1000)
	decisionCache := services.NewDecisionCache(config.CacheTTL, 5000)

	// Initialize policy manager
	policyManager := services.NewPolicyManager(policyCache, opalClient)

	// Initialize OPA service
	opaService := services.NewOPAService(config.OPALServerURL)

	// Initialize policy engine
	policyEngine := services.NewPolicyEngine(opaService, policyManager, policyCache, decisionCache)

	// Initialize context ingestion service
	contextConfig := services.NewContextConfigManager("/etc/controlcore/context-config.json")
	if err := contextConfig.LoadConfiguration(); err != nil {
		logrus.WithError(err).Warn("Failed to load context configuration, using defaults")
	}
	contextIngestion := services.NewContextIngestionService(contextConfig.GetConfiguration())

	// Initialize OPAL PIP service with environment awareness
	opalPIPConfig := &services.OPALPIPConfig{
		OPALServerURL: config.OPALServerURL,
		TenantID:      config.TenantID,
		APIKey:        config.APIKey,
		BouncerID:     bouncerID,   // Pass bouncer ID for intelligent filtering
		Environment:   environment, // Pass environment for data source routing
		SyncInterval:  5 * time.Minute,
		CacheTTL:      30 * time.Minute,
		EncryptionKey: config.EncryptionKey,
	}
	opalPIPService := services.NewOPALPIPService(opalPIPConfig)

	// Initialize telemetry client
	businessAdminURL := getEnv("BUSINESS_ADMIN_URL", "http://localhost:3001")
	telemetryClient := services.NewTelemetryClient(
		businessAdminURL,
		config.APIKey,
		config.MetricsEnabled,
	)

	return &ControlCoreBouncer{
		config:           config,
		policyCache:      policyCache,
		decisionCache:    decisionCache,
		auditLogger:      services.NewAuditLogger(),
		authExtractor:    NewAuthorizationExtractor(),
		contentInjector:  services.NewContentInjector(),
		pdpService:       pdpService,
		opaClient:        opaClient,
		papClient:        papClient,
		policyManager:    policyManager,
		policyEngine:     policyEngine,
		opalClient:       opalClient,
		contextIngestion: contextIngestion,
		contextConfig:    contextConfig,
		opalPIPService:   opalPIPService,
		telemetryClient:  telemetryClient,
	}
}

// ServeHTTP handles incoming requests and enforces policies
func (b *ControlCoreBouncer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	requestID := b.generateRequestID()

	logrus.WithFields(logrus.Fields{
		"method":      r.Method,
		"path":        r.URL.Path,
		"remote_addr": r.RemoteAddr,
		"request_id":  requestID,
	}).Info("BOUNCER: Processing request")

	// Handle health checks without policy enforcement
	if b.isHealthCheck(r.URL.Path) {
		b.handleHealth(w, r)
		return
	}

	// Extract authorization context
	authContext := b.authExtractor.ExtractAuthorizationRequest(r)
	authContext.Context["request_id"] = requestID
	authContext.Context["timestamp"] = startTime.Format(time.RFC3339)

	// Perform context ingestion if enabled
	contextResponse, err := b.contextIngestion.IngestContext(services.ContextRequest{
		User: services.User{
			ID:         authContext.User.ID,
			Roles:      authContext.User.Roles,
			Groups:     authContext.User.Groups,
			Attributes: authContext.User.Attributes,
		},
		Resource: services.Resource{
			ID:         authContext.Resource.ID,
			Type:       authContext.Resource.Type,
			Name:       authContext.Resource.Name,
			Attributes: authContext.Resource.Attributes,
		},
		Action: services.Action{
			Name:       authContext.Action.Name,
			Type:       authContext.Action.Type,
			Attributes: authContext.Action.Attributes,
		},
		Context:     authContext.Context,
		Sources:     []string{"internal-api", "user-profile", "security-context"},
		Permissions: []string{"context.ingest", "context.read"},
		RequestID:   requestID,
		Timestamp:   startTime,
	})
	if err != nil {
		logrus.WithError(err).Warn("CONTEXT_WARNING: Context ingestion failed, continuing with original context")
		// Continue with original context if ingestion fails
	} else {
		// Merge enriched context into auth context
		for k, v := range contextResponse.Context {
			authContext.Context[k] = v
		}
		logrus.WithFields(logrus.Fields{
			"request_id":     requestID,
			"sources_count":  len(contextResponse.Sources),
			"security_level": contextResponse.SecurityLevel,
		}).Info("🔍 CONTEXT: Context enriched successfully")
	}

	// Use policy engine to evaluate request with enriched context
	decision, err := b.policyEngine.EvaluateRequest(services.PolicyEvaluationRequest{
		User: services.User{
			ID:         authContext.User.ID,
			Roles:      authContext.User.Roles,
			Groups:     authContext.User.Groups,
			Attributes: authContext.User.Attributes,
		},
		Resource: services.Resource{
			ID:         authContext.Resource.ID,
			Type:       authContext.Resource.Type,
			Name:       authContext.Resource.Name,
			Attributes: authContext.Resource.Attributes,
		},
		Action: services.Action{
			Name:       authContext.Action.Name,
			Type:       authContext.Action.Type,
			Attributes: authContext.Action.Attributes,
		},
		Context: authContext.Context,
	})
	if err != nil {
		logrus.WithError(err).Error("POLICY_ERROR: Failed to evaluate policy")
		http.Error(w, "Policy evaluation failed", http.StatusInternalServerError)
		return
	}

	// Enforce decision
	b.enforceDecision(w, r, decision, requestID, startTime)
}

// enforceDecision enforces the authorization decision
func (b *ControlCoreBouncer) enforceDecision(w http.ResponseWriter, r *http.Request, decision *services.PolicyEvaluationResponse, requestID string, startTime time.Time) {
	// Convert PolicyEvaluationResponse to models.IAuthorizationDecision
	authDecision := &models.IAuthorizationDecision{
		Allow:      decision.Allow,
		Reason:     decision.Reason,
		Extra:      decision.Constraints,
		MaskedData: nil,
	}

	// Log decision
	context := map[string]interface{}{
		"request_id":  requestID,
		"method":      r.Method,
		"path":        r.URL.Path,
		"remote_addr": r.RemoteAddr,
		"duration":    time.Since(startTime).String(),
	}
	b.auditLogger.LogDecision(authDecision, context)

	if !decision.Allow {
		logrus.WithFields(logrus.Fields{
			"request_id": requestID,
			"reason":     decision.Reason,
		}).Warn("ACCESS_DENIED")
		http.Error(w, fmt.Sprintf("Access denied: %s", decision.Reason), http.StatusForbidden)
		return
	}

	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"reason":     decision.Reason,
	}).Info("ACCESS_GRANTED")

	// Apply content injection if configured
	// TODO: Implement content injection using b.contentInjector

	// Forward request to target
	b.forwardRequest(w, r, requestID, startTime)
}

// forwardRequest forwards the request to the target service
func (b *ControlCoreBouncer) forwardRequest(w http.ResponseWriter, r *http.Request, requestID string, startTime time.Time) {
	// Build target URL
	targetURL := fmt.Sprintf("http://%s%s", b.config.TargetHost, r.URL.RequestURI())

	// Create proxy request
	proxyReq, err := http.NewRequestWithContext(r.Context(), r.Method, targetURL, r.Body)
	if err != nil {
		logrus.WithError(err).Error("PROXY_ERROR: Failed to create proxy request")
		http.Error(w, "Proxy error", http.StatusBadGateway)
		return
	}

	// Copy headers
	b.copyHeaders(r.Header, proxyReq.Header)

	// Add Bouncer headers
	proxyReq.Header.Set("X-ControlCore-Request-ID", requestID)
	proxyReq.Header.Set("X-ControlCore-Bouncer", "true")

	// Execute request
	client := &http.Client{Timeout: 30 * time.Second}
	response, err := client.Do(proxyReq)
	if err != nil {
		logrus.WithError(err).Error("PROXY_ERROR: Failed to execute request")
		http.Error(w, "Target service unavailable", http.StatusBadGateway)
		return
	}
	defer response.Body.Close()

	// Apply response content injection if configured
	// TODO: Implement response injection using b.contentInjector

	// Copy response headers
	b.copyHeaders(response.Header, w.Header())

	// Set status code
	w.WriteHeader(response.StatusCode)

	// Stream response body
	io.Copy(w, response.Body)

	logrus.WithFields(logrus.Fields{
		"method":      r.Method,
		"path":        r.URL.Path,
		"status_code": response.StatusCode,
		"request_id":  requestID,
		"duration":    time.Since(startTime),
	}).Info("PROXY_SUCCESS")
}

// Helper methods
func (b *ControlCoreBouncer) isHealthCheck(path string) bool {
	healthPaths := []string{"/health", "/healthz", "/ready", "/ping"}
	for _, healthPath := range healthPaths {
		if path == healthPath {
			return true
		}
	}
	return false
}

func (b *ControlCoreBouncer) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "healthy",
		"service":   "controlcore-bouncer",
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "1.0.0",
		"features":  []string{"pep", "pdp", "caching", "audit"},
	})
}

func (b *ControlCoreBouncer) generateRequestID() string {
	return fmt.Sprintf("cc_%d", time.Now().UnixNano())
}

func (b *ControlCoreBouncer) copyHeaders(src, dst http.Header) {
	hopByHopHeaders := map[string]bool{
		"Connection":          true,
		"Keep-Alive":          true,
		"Proxy-Authenticate":  true,
		"Proxy-Authorization": true,
		"Te":                  true,
		"Trailers":            true,
		"Transfer-Encoding":   true,
		"Upgrade":             true,
	}

	for header, values := range src {
		if !hopByHopHeaders[header] {
			for _, value := range values {
				dst.Add(header, value)
			}
		}
	}
}

func main() {
	// Configure logging
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetLevel(logrus.InfoLevel)

	// Load configuration from environment
	config := &BouncerConfig{
		Port:           getEnv("BOUNCER_PORT", "8080"),
		TargetHost:     getEnv("TARGET_HOST", "localhost:8000"),
		PAPAPIURL:      getEnv("PAP_API_URL", "http://localhost:8000"),
		OPALServerURL:  getEnv("OPAL_SERVER_URL", "http://localhost:7000"),
		TenantID:       getEnv("TENANT_ID", "default"),
		APIKey:         getEnv("API_KEY", ""),
		LogEnabled:     getEnv("LOG_ENABLED", "true") != "false",
		MaxBodySize:    1024 * 1024, // 1MB
		CacheEnabled:   getEnv("CACHE_ENABLED", "true") != "false",
		CacheTTL:       5 * time.Minute,
		MetricsEnabled: getEnv("METRICS_ENABLED", "true") != "false",
		MetricsPort:    getEnv("METRICS_PORT", "9090"),
	}

	// Validate configuration
	if config.APIKey == "" {
		logrus.Fatal("API_KEY environment variable is required")
	}

	// Initialize Bouncer with integrated PDP
	bouncer := NewControlCoreBouncer(config)

	// Register bouncer with Control Plane
	bouncerID := getEnv("BOUNCER_ID", generateBouncerID())
	bouncerInfo := map[string]interface{}{
		"bouncer_id":   bouncerID,
		"bouncer_name": getEnv("BOUNCER_NAME", "bouncer-1"),
		"bouncer_type": getEnv("BOUNCER_TYPE", "reverse-proxy"),
		"tenant_id":    config.TenantID,
		"resource": map[string]interface{}{
			"name":                     getEnv("RESOURCE_NAME", "Unknown Resource"),
			"type":                     getEnv("RESOURCE_TYPE", "api"),
			"target_host":              config.TargetHost,
			"original_host_url":        getEnv("ORIGINAL_HOST_URL", ""),
			"deployment_url":           getEnv("BOUNCER_PUBLIC_URL", ""),
			"default_security_posture": getEnv("SECURITY_POSTURE", "deny-all"),
		},
		"deployment_info": map[string]interface{}{
			"platform":    getEnv("DEPLOYMENT_PLATFORM", "docker"),
			"version":     "1.0.0",
			"environment": getEnv("ENVIRONMENT", "production"),
		},
	}

	// Register via PAP API
	if err := registerWithPAP(config.PAPAPIURL, bouncerInfo, config.APIKey); err != nil {
		logrus.WithError(err).Warn("Failed to register with PAP API, continuing...")
	} else {
		logrus.Info("✅ Successfully registered with Control Plane")
	}

	// Start heartbeat goroutine
	go startHeartbeat(config.PAPAPIURL, bouncerID, config.APIKey)

	// Initialize handlers for PDP endpoints
	authHandler := handlers.NewAuthorizationHandler(bouncer.pdpService)

	// Setup Gin router for PDP endpoints
	router := setupRouter(authHandler, bouncer)

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
		logrus.WithField("port", config.Port).Info("🚀 Starting Control Core Bouncer with integrated PDP")
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

// setupRouter configures the Gin router with all routes and middleware
func setupRouter(authHandler *handlers.AuthorizationHandler, bouncer *ControlCoreBouncer) *gin.Engine {
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
	router.GET("/health", func(c *gin.Context) {
		bouncer.handleHealth(c.Writer, c.Request)
	})
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "ok",
			"service":   "ControlCore Bouncer with PDP",
			"timestamp": time.Now(),
		})
	})

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Authorization endpoints - the core PDP functionality
		v1.POST("/authorize", authHandler.Authorize)
		v1.POST("/authorize/bulk", authHandler.BulkAuthorize)

		// Policy information endpoints
		v1.GET("/policies", authHandler.GetPolicyInfo)

		// OPA debugging endpoints
		v1.GET("/opa/data", authHandler.GetOPAData)

		// Policy management endpoints
		v1.GET("/policies/sync", bouncer.handlePolicySync)
		v1.GET("/policies/cache", bouncer.handleCacheStats)
		v1.POST("/policies/cache/clear", bouncer.handleCacheClear)

		// OPAL integration endpoints
		v1.POST("/opal/sync", bouncer.handleOPALSync)
		v1.GET("/opal/data-sources", bouncer.handleDataSources)

		// Metrics and monitoring endpoints
		v1.GET("/metrics", bouncer.handleMetrics)
		v1.GET("/stats", bouncer.handleStats)

		// Context ingestion endpoints
		v1.POST("/context/ingest", bouncer.handleContextIngest)
		v1.GET("/context/sources", bouncer.handleContextSources)
		v1.GET("/context/rules", bouncer.handleContextRules)
		v1.POST("/context/rules", bouncer.handleContextRuleCreate)
		v1.PUT("/context/rules/:id", bouncer.handleContextRuleUpdate)
		v1.DELETE("/context/rules/:id", bouncer.handleContextRuleDelete)
		v1.GET("/context/security-policies", bouncer.handleContextSecurityPolicies)
		v1.POST("/context/security-policies", bouncer.handleContextSecurityPolicyCreate)
		v1.PUT("/context/security-policies/:id", bouncer.handleContextSecurityPolicyUpdate)
		v1.DELETE("/context/security-policies/:id", bouncer.handleContextSecurityPolicyDelete)
		v1.GET("/context/config", bouncer.handleContextConfig)
		v1.PUT("/context/config", bouncer.handleContextConfigUpdate)

		// OPAL PIP endpoints
		v1.GET("/opal/status", bouncer.handleOPALStatus)
		v1.POST("/opal/sync/:connection_id", bouncer.handleOPALSync)
		v1.GET("/opal/connections", bouncer.handleOPALConnections)
		v1.POST("/opal/connections", bouncer.handleOPALConnectionCreate)
		v1.PUT("/opal/connections/:id", bouncer.handleOPALConnectionUpdate)
		v1.DELETE("/opal/connections/:id", bouncer.handleOPALConnectionDelete)
		v1.POST("/opal/fetch-sensitive", bouncer.handleOPALFetchSensitive)
		v1.DELETE("/opal/cache/:connection_id", bouncer.handleOPALClearCache)
		v1.GET("/opal/cache-stats", bouncer.handleOPALCacheStats)

	}

	// Documentation endpoint
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service":     "ControlCore Bouncer with PDP",
			"version":     "1.0.0",
			"description": "Policy Enforcement Point (PEP) with integrated Policy Decision Point (PDP)",
			"features":    []string{"reverse_proxy", "policy_enforcement", "decision_caching", "audit_logging", "content_injection"},
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

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Handler methods for new API endpoints

// handlePolicySync handles policy synchronization
func (b *ControlCoreBouncer) handlePolicySync(c *gin.Context) {
	if err := b.policyManager.SyncPoliciesFromOPAL(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to sync policies",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Policies synced successfully",
		"last_sync": b.policyManager.GetLastSync(),
	})
}

// handleCacheStats handles cache statistics
func (b *ControlCoreBouncer) handleCacheStats(c *gin.Context) {
	stats := b.policyEngine.GetStats()
	c.JSON(http.StatusOK, stats)
}

// handleCacheClear handles cache clearing
func (b *ControlCoreBouncer) handleCacheClear(c *gin.Context) {
	b.policyEngine.InvalidateCache()
	c.JSON(http.StatusOK, gin.H{
		"message": "Cache cleared successfully",
	})
}

// handleOPALStatus handles OPAL status check
func (b *ControlCoreBouncer) handleOPALStatus(c *gin.Context) {
	if err := b.opalClient.HealthCheck(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"last_sync": b.policyManager.GetLastSync(),
	})
}

// handleOPALSync handles OPAL synchronization
func (b *ControlCoreBouncer) handleOPALSync(c *gin.Context) {
	if err := b.policyManager.SyncPoliciesFromOPAL(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to sync with OPAL",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "OPAL sync completed successfully",
		"last_sync": b.policyManager.GetLastSync(),
	})
}

// handleDataSources handles data sources listing
func (b *ControlCoreBouncer) handleDataSources(c *gin.Context) {
	sources, err := b.policyManager.GetDataSources()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch data sources",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data_sources": sources,
		"count":        len(sources),
	})
}

// handleMetrics handles metrics endpoint
func (b *ControlCoreBouncer) handleMetrics(c *gin.Context) {
	stats := b.policyEngine.GetStats()

	// Add additional metrics
	stats["bouncer"] = gin.H{
		"uptime":              time.Since(time.Now()).String(),
		"cache_size":          b.policyCache.Size(),
		"decision_cache_size": b.decisionCache.Size(),
		"last_sync":           b.policyManager.GetLastSync(),
	}

	c.JSON(http.StatusOK, stats)
}

// handleStats handles statistics endpoint
func (b *ControlCoreBouncer) handleStats(c *gin.Context) {
	stats := b.policyEngine.GetStats()

	// Add bouncer-specific stats
	stats["bouncer"] = gin.H{
		"config": gin.H{
			"target_host":   b.config.TargetHost,
			"cache_enabled": b.config.CacheEnabled,
			"cache_ttl":     b.config.CacheTTL.String(),
		},
		"performance": gin.H{
			"cache_hit_ratio":       "N/A", // Would be calculated from actual metrics
			"average_response_time": "N/A",
		},
	}

	c.JSON(http.StatusOK, stats)
}

// Context ingestion handler methods

// handleContextIngest handles context ingestion requests
func (b *ControlCoreBouncer) handleContextIngest(c *gin.Context) {
	var request services.ContextRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	response, err := b.contextIngestion.IngestContext(request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Context ingestion failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// handleContextSources handles context sources listing
func (b *ControlCoreBouncer) handleContextSources(c *gin.Context) {
	config := b.contextConfig.GetConfiguration()
	sources := make([]gin.H, len(config.DataSources))

	for i, source := range config.DataSources {
		sources[i] = gin.H{
			"id":          source.ID,
			"name":        source.Name,
			"type":        source.Type,
			"url":         source.URL,
			"auth_type":   source.AuthType,
			"permissions": source.Permissions,
			"rate_limit":  source.RateLimit,
			"timeout":     source.Timeout,
			"enabled":     source.Enabled,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"sources": sources,
		"count":   len(sources),
	})
}

// handleContextRules handles context rules listing
func (b *ControlCoreBouncer) handleContextRules(c *gin.Context) {
	config := b.contextConfig.GetConfiguration()
	rules := make([]gin.H, len(config.IngestionRules))

	for i, rule := range config.IngestionRules {
		rules[i] = gin.H{
			"id":          rule.ID,
			"name":        rule.Name,
			"description": rule.Description,
			"source":      rule.Source,
			"target":      rule.Target,
			"conditions":  rule.Conditions,
			"transform":   rule.Transform,
			"permissions": rule.Permissions,
			"priority":    rule.Priority,
			"enabled":     rule.Enabled,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"rules": rules,
		"count": len(rules),
	})
}

// handleContextRuleCreate handles context rule creation
func (b *ControlCoreBouncer) handleContextRuleCreate(c *gin.Context) {
	var rule services.IngestionRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid rule format",
			"details": err.Error(),
		})
		return
	}

	if err := b.contextConfig.AddIngestionRule(rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create rule",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Rule created successfully",
		"rule_id": rule.ID,
	})
}

// handleContextRuleUpdate handles context rule updates
func (b *ControlCoreBouncer) handleContextRuleUpdate(c *gin.Context) {
	ruleID := c.Param("id")
	var rule services.IngestionRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid rule format",
			"details": err.Error(),
		})
		return
	}

	rule.ID = ruleID
	if err := b.contextConfig.AddIngestionRule(rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update rule",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Rule updated successfully",
		"rule_id": ruleID,
	})
}

// handleContextRuleDelete handles context rule deletion
func (b *ControlCoreBouncer) handleContextRuleDelete(c *gin.Context) {
	ruleID := c.Param("id")

	if err := b.contextConfig.RemoveIngestionRule(ruleID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Rule not found",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Rule deleted successfully",
		"rule_id": ruleID,
	})
}

// handleContextSecurityPolicies handles security policies listing
func (b *ControlCoreBouncer) handleContextSecurityPolicies(c *gin.Context) {
	config := b.contextConfig.GetConfiguration()
	policies := make([]gin.H, len(config.SecurityPolicies))

	for i, policy := range config.SecurityPolicies {
		policies[i] = gin.H{
			"id":          policy.ID,
			"name":        policy.Name,
			"description": policy.Description,
			"rules":       policy.Rules,
			"permissions": policy.Permissions,
			"priority":    policy.Priority,
			"enabled":     policy.Enabled,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"policies": policies,
		"count":    len(policies),
	})
}

// handleContextSecurityPolicyCreate handles security policy creation
func (b *ControlCoreBouncer) handleContextSecurityPolicyCreate(c *gin.Context) {
	var policy services.SecurityPolicy
	if err := c.ShouldBindJSON(&policy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid policy format",
			"details": err.Error(),
		})
		return
	}

	if err := b.contextConfig.AddSecurityPolicy(policy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create policy",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Security policy created successfully",
		"policy_id": policy.ID,
	})
}

// handleContextSecurityPolicyUpdate handles security policy updates
func (b *ControlCoreBouncer) handleContextSecurityPolicyUpdate(c *gin.Context) {
	policyID := c.Param("id")
	var policy services.SecurityPolicy
	if err := c.ShouldBindJSON(&policy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid policy format",
			"details": err.Error(),
		})
		return
	}

	policy.ID = policyID
	if err := b.contextConfig.AddSecurityPolicy(policy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update policy",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Security policy updated successfully",
		"policy_id": policyID,
	})
}

// handleContextSecurityPolicyDelete handles security policy deletion
func (b *ControlCoreBouncer) handleContextSecurityPolicyDelete(c *gin.Context) {
	policyID := c.Param("id")

	if err := b.contextConfig.RemoveSecurityPolicy(policyID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Policy not found",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Security policy deleted successfully",
		"policy_id": policyID,
	})
}

// handleContextConfig handles context configuration retrieval
func (b *ControlCoreBouncer) handleContextConfig(c *gin.Context) {
	config := b.contextConfig.GetConfiguration()
	c.JSON(http.StatusOK, config)
}

// handleContextConfigUpdate handles context configuration updates
func (b *ControlCoreBouncer) handleContextConfigUpdate(c *gin.Context) {
	var config services.ContextIngestionConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid configuration format",
			"details": err.Error(),
		})
		return
	}

	if err := b.contextConfig.UpdateConfiguration(&config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update configuration",
			"details": err.Error(),
		})
		return
	}

	// Update the context ingestion service with new configuration
	b.contextIngestion.UpdateConfiguration(&config)

	c.JSON(http.StatusOK, gin.H{
		"message": "Configuration updated successfully",
	})
}

// handleOPALConnections handles OPAL connections listing
func (b *ControlCoreBouncer) handleOPALConnections(c *gin.Context) {
	// In real implementation, this would list OPAL connections
	connections := []gin.H{
		{
			"id":        "pip-1",
			"name":      "Auth0 Production",
			"type":      "iam",
			"status":    "synced",
			"last_sync": time.Now().Add(-5 * time.Minute).Format(time.RFC3339),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"connections": connections,
		"count":       len(connections),
	})
}

// handleOPALConnectionCreate handles OPAL connection creation
func (b *ControlCoreBouncer) handleOPALConnectionCreate(c *gin.Context) {
	var connection services.PIPConnection
	if err := c.ShouldBindJSON(&connection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid connection format",
			"details": err.Error(),
		})
		return
	}

	// Sync connection to OPAL
	err := b.opalPIPService.SyncPIPConnection(&connection)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to sync connection",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "Connection synced to OPAL successfully",
		"connection_id": connection.ID,
	})
}

// handleOPALConnectionUpdate handles OPAL connection updates
func (b *ControlCoreBouncer) handleOPALConnectionUpdate(c *gin.Context) {
	connectionID := c.Param("id")
	var connection services.PIPConnection
	if err := c.ShouldBindJSON(&connection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid connection format",
			"details": err.Error(),
		})
		return
	}

	connection.ID = connectionID
	err := b.opalPIPService.UpdateConnection(&connection)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update connection",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Connection updated successfully",
		"connection_id": connectionID,
	})
}

// handleOPALConnectionDelete handles OPAL connection deletion
func (b *ControlCoreBouncer) handleOPALConnectionDelete(c *gin.Context) {
	connectionID := c.Param("id")

	err := b.opalPIPService.RemoveConnection(connectionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to remove connection",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Connection removed successfully",
		"connection_id": connectionID,
	})
}

// handleOPALFetchSensitive handles sensitive attribute fetching
func (b *ControlCoreBouncer) handleOPALFetchSensitive(c *gin.Context) {
	var request struct {
		ConnectionID string   `json:"connection_id"`
		Attributes   []string `json:"attributes"`
		UserID       string   `json:"user_id"`
		RequestID    string   `json:"request_id"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	attributes, err := b.opalPIPService.FetchSensitiveAttributes(
		request.ConnectionID,
		request.Attributes,
		request.UserID,
		request.RequestID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch sensitive attributes",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"connection_id": request.ConnectionID,
		"attributes":    attributes,
		"fetched_at":    time.Now().Format(time.RFC3339),
	})
}

// handleOPALClearCache handles cache clearing
func (b *ControlCoreBouncer) handleOPALClearCache(c *gin.Context) {
	connectionID := c.Param("connection_id")

	err := b.opalPIPService.ClearCache(connectionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to clear cache",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Cache cleared successfully",
		"connection_id": connectionID,
	})
}

// handleOPALCacheStats handles cache statistics
func (b *ControlCoreBouncer) handleOPALCacheStats(c *gin.Context) {
	stats, err := b.opalPIPService.GetCacheStatistics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get cache statistics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// registerWithPAP registers the bouncer with the PAP API
func registerWithPAP(papURL string, bouncerInfo map[string]interface{}, apiKey string) error {
	url := fmt.Sprintf("%s/api/v1/peps/register", papURL)

	jsonData, err := json.Marshal(bouncerInfo)
	if err != nil {
		return fmt.Errorf("failed to marshal bouncer info: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to register: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("registration failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// generateBouncerID generates a unique bouncer ID
func generateBouncerID() string {
	return fmt.Sprintf("bouncer-%d", time.Now().UnixNano())
}

// startHeartbeat sends periodic heartbeats to the PAP API
func startHeartbeat(papURL, bouncerID, apiKey string) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		// Send heartbeat
		// The PAP API expects the bouncer ID in the path, but we need to find the PEP ID
		// For now, we'll skip the heartbeat or implement it differently
		// This would require the bouncer to store its PEP ID from the registration response
		logrus.Debug("Heartbeat tick (implementation pending)")
	}
}
