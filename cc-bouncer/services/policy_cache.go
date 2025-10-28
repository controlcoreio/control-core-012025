package services

import (
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// PolicyCache manages policy caching with TTL and invalidation
type PolicyCache struct {
	cache    map[string]*CacheEntry
	mutex    sync.RWMutex
	ttl      time.Duration
	maxSize  int
	cleanup  time.Duration
	stopChan chan bool
}

// CacheEntry represents a cached item
type CacheEntry struct {
	Data        interface{}
	ExpiresAt   time.Time
	CreatedAt   time.Time
	AccessCount int64
	LastAccess  time.Time
}

// NewPolicyCache creates a new policy cache
func NewPolicyCache(ttl time.Duration, maxSize int) *PolicyCache {
	cache := &PolicyCache{
		cache:    make(map[string]*CacheEntry),
		ttl:      ttl,
		maxSize:  maxSize,
		cleanup:  5 * time.Minute,
		stopChan: make(chan bool),
	}

	// Start cleanup goroutine
	go cache.cleanupExpired()

	return cache
}

// Set stores a value in the cache
func (c *PolicyCache) Set(key string, value interface{}) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	// Check if we need to evict entries
	if len(c.cache) >= c.maxSize {
		c.evictLRU()
	}

	c.cache[key] = &CacheEntry{
		Data:        value,
		ExpiresAt:   time.Now().Add(c.ttl),
		CreatedAt:   time.Now(),
		AccessCount: 0,
		LastAccess:  time.Now(),
	}

	logrus.WithFields(logrus.Fields{
		"key": key,
		"ttl": c.ttl,
	}).Debug("💾 CACHE: Policy cached")
}

// Get retrieves a value from the cache
func (c *PolicyCache) Get(key string) (interface{}, bool) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	entry, exists := c.cache[key]
	if !exists {
		return nil, false
	}

	// Check if expired
	if time.Now().After(entry.ExpiresAt) {
		delete(c.cache, key)
		logrus.WithField("key", key).Debug("💾 CACHE: Policy expired")
		return nil, false
	}

	// Update access statistics
	entry.AccessCount++
	entry.LastAccess = time.Now()

	logrus.WithFields(logrus.Fields{
		"key":          key,
		"access_count": entry.AccessCount,
	}).Debug("💾 CACHE: Policy cache hit")

	return entry.Data, true
}

// Delete removes a value from the cache
func (c *PolicyCache) Delete(key string) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	delete(c.cache, key)
	logrus.WithField("key", key).Debug("💾 CACHE: Policy deleted")
}

// Clear removes all entries from the cache
func (c *PolicyCache) Clear() {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	c.cache = make(map[string]*CacheEntry)
	logrus.Info("💾 CACHE: All policies cleared")
}

// Size returns the current cache size
func (c *PolicyCache) Size() int {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	return len(c.cache)
}

// Stats returns cache statistics
func (c *PolicyCache) Stats() map[string]interface{} {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	totalAccess := int64(0)
	expiredCount := 0

	for _, entry := range c.cache {
		totalAccess += entry.AccessCount
		if time.Now().After(entry.ExpiresAt) {
			expiredCount++
		}
	}

	return map[string]interface{}{
		"size":          len(c.cache),
		"max_size":      c.maxSize,
		"ttl":           c.ttl.String(),
		"total_access":  totalAccess,
		"expired_count": expiredCount,
	}
}

// evictLRU evicts the least recently used entry
func (c *PolicyCache) evictLRU() {
	var oldestKey string
	var oldestTime time.Time

	for key, entry := range c.cache {
		if oldestKey == "" || entry.LastAccess.Before(oldestTime) {
			oldestKey = key
			oldestTime = entry.LastAccess
		}
	}

	if oldestKey != "" {
		delete(c.cache, oldestKey)
		logrus.WithField("key", oldestKey).Debug("💾 CACHE: LRU eviction")
	}
}

// cleanupExpired periodically cleans up expired entries
func (c *PolicyCache) cleanupExpired() {
	ticker := time.NewTicker(c.cleanup)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.cleanupExpiredEntries()
		case <-c.stopChan:
			return
		}
	}
}

// cleanupExpiredEntries removes expired entries
func (c *PolicyCache) cleanupExpiredEntries() {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	now := time.Now()
	expiredCount := 0

	for key, entry := range c.cache {
		if now.After(entry.ExpiresAt) {
			delete(c.cache, key)
			expiredCount++
		}
	}

	if expiredCount > 0 {
		logrus.WithField("count", expiredCount).Debug("💾 CACHE: Expired entries cleaned up")
	}
}

// Stop stops the cache cleanup goroutine
func (c *PolicyCache) Stop() {
	close(c.stopChan)
}

// UpdatePolicies updates the policy cache with new policies
func (c *PolicyCache) UpdatePolicies(bundle *PolicyBundle) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	// Store policies in cache
	for _, policy := range bundle.Policies {
		key := fmt.Sprintf("policy_%s", policy.ID)
		c.cache[key] = &CacheEntry{
			Data:        policy,
			ExpiresAt:   time.Now().Add(c.ttl),
			CreatedAt:   time.Now(),
			AccessCount: 0,
			LastAccess:  time.Now(),
		}
	}

	logrus.WithField("policy_count", len(bundle.Policies)).Info("💾 CACHE: Policies updated")
	return nil
}

// GetPolicy retrieves a policy by ID
func (c *PolicyCache) GetPolicy(policyID string) (*Policy, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	key := fmt.Sprintf("policy_%s", policyID)
	entry, exists := c.cache[key]
	if !exists {
		return nil, fmt.Errorf("policy not found: %s", policyID)
	}

	// Check if expired
	if time.Now().After(entry.ExpiresAt) {
		return nil, fmt.Errorf("policy expired: %s", policyID)
	}

	// Update access statistics
	entry.AccessCount++
	entry.LastAccess = time.Now()

	return entry.Data.(*Policy), nil
}

// ListPolicies returns all policies
func (c *PolicyCache) ListPolicies() ([]*Policy, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	var policies []*Policy
	now := time.Now()

	for _, entry := range c.cache {
		if !now.After(entry.ExpiresAt) {
			if policy, ok := entry.Data.(*Policy); ok {
				policies = append(policies, policy)
			}
		}
	}

	return policies, nil
}

// GetStats returns cache statistics (alias for Stats method)
func (c *PolicyCache) GetStats() map[string]interface{} {
	return c.Stats()
}
