package services

import (
	"sync"
	"time"

	"cc-bouncer/models"
)

// DecisionCacheEntry represents a cached decision
type DecisionCacheEntry struct {
	Decision  *models.IAuthorizationDecision
	Timestamp time.Time
	TTL       time.Duration
}

// DecisionCache provides caching for authorization decisions
type DecisionCache struct {
	cache map[string]*DecisionCacheEntry
	mutex sync.RWMutex
	ttl   time.Duration
}

// NewDecisionCache creates a new decision cache
func NewDecisionCache(ttl time.Duration, maxSize int) *DecisionCache {
	return &DecisionCache{
		cache: make(map[string]*DecisionCacheEntry),
		ttl:   ttl,
	}
}

// Get retrieves a decision from cache
func (dc *DecisionCache) Get(key string) (*models.IAuthorizationDecision, bool) {
	dc.mutex.RLock()
	defer dc.mutex.RUnlock()

	entry, exists := dc.cache[key]
	if !exists {
		return nil, false
	}

	// Check if entry has expired
	if time.Since(entry.Timestamp) > entry.TTL {
		delete(dc.cache, key)
		return nil, false
	}

	return entry.Decision, true
}

// Set stores a decision in cache
func (dc *DecisionCache) Set(key string, decision *models.IAuthorizationDecision) {
	dc.mutex.Lock()
	defer dc.mutex.Unlock()

	dc.cache[key] = &DecisionCacheEntry{
		Decision:  decision,
		Timestamp: time.Now(),
		TTL:       dc.ttl,
	}
}

// Clear removes all entries from cache
func (dc *DecisionCache) Clear() {
	dc.mutex.Lock()
	defer dc.mutex.Unlock()

	dc.cache = make(map[string]*DecisionCacheEntry)
}

// Size returns the number of entries in cache
func (dc *DecisionCache) Size() int {
	dc.mutex.RLock()
	defer dc.mutex.RUnlock()

	return len(dc.cache)
}

// GetStats returns cache statistics
func (dc *DecisionCache) GetStats() map[string]interface{} {
	dc.mutex.RLock()
	defer dc.mutex.RUnlock()

	return map[string]interface{}{
		"size": len(dc.cache),
		"ttl":  dc.ttl.String(),
	}
}
