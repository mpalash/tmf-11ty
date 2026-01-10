/**
 * Event Status Computer
 * Computes and injects event status (upcoming/ongoing/past) at runtime
 * Works with data attributes on event elements
 */

(function() {
    'use strict';

    /**
     * Determine event status based on dates
     * @param {string} dateFrom - ISO date string
     * @param {string|null} dateTo - ISO date string or null
     * @returns {object} Status object with status, isUpcoming, isPast, isOngoing
     */
    function computeEventStatus(dateFrom, dateTo) {
        const now = new Date();
        
        if (!dateFrom) {
            return {
                status: 'unknown',
                isUpcoming: false,
                isPast: true,
                isOngoing: false
            };
        }
        
        const startDate = new Date(dateFrom);
        const endDate = dateTo ? new Date(dateTo) : null;
        
        if (endDate) {
            // Multi-day event with start and end date
            if (now < startDate) {
                // Event hasn't started yet
                return {
                    status: 'upcoming',
                    isUpcoming: true,
                    isPast: false,
                    isOngoing: false
                };
            } else if (now >= startDate && now <= endDate) {
                // Event is currently happening
                return {
                    status: 'ongoing',
                    isUpcoming: false,
                    isPast: false,
                    isOngoing: true
                };
            } else {
                // Event has ended
                return {
                    status: 'past',
                    isUpcoming: false,
                    isPast: true,
                    isOngoing: false
                };
            }
        } else {
            // Single day event - compare against end of day
            const eventEndOfDay = new Date(startDate);
            eventEndOfDay.setHours(23, 59, 59, 999);
            
            if (now <= eventEndOfDay) {
                return {
                    status: 'upcoming',
                    isUpcoming: true,
                    isPast: false,
                    isOngoing: false
                };
            } else {
                return {
                    status: 'past',
                    isUpcoming: false,
                    isPast: true,
                    isOngoing: false
                };
            }
        }
    }

    /**
     * Process event elements and add status classes and data attributes
     */
    function processEvents() {
        // Find all event elements with date data attributes
        const eventElements = document.querySelectorAll('[data-date-from]');
        
        if (eventElements.length === 0) {
            console.log('No events found with data-date-from attribute');
            return;
        }
        
        console.log(`Processing ${eventElements.length} events...`);
        
        eventElements.forEach(function(element) {
            const dateFrom = element.getAttribute('data-date-from');
            const dateTo = element.getAttribute('data-date-to');
            
            // Compute status
            const statusInfo = computeEventStatus(dateFrom, dateTo);
            
            // Add status as data attribute
            element.setAttribute('data-status', statusInfo.status);
            
            // Add status class
            element.classList.add('event-' + statusInfo.status);
            
            // Add boolean flags as data attributes
            element.setAttribute('data-is-upcoming', statusInfo.isUpcoming);
            element.setAttribute('data-is-past', statusInfo.isPast);
            element.setAttribute('data-is-ongoing', statusInfo.isOngoing);
            
            // Find and update any status badge elements
            const statusBadge = element.querySelector('.event-status-badge');
            if (statusBadge) {
                statusBadge.textContent = statusInfo.status;
                statusBadge.className = 'event-status-badge badge badge-' + statusInfo.status;
            }
        });
        
        console.log('Event status processing complete');
    }

    /**
     * Process sub-events within event detail sections
     */
    function processSubEvents() {
        // Find all sub-event elements with date data attributes
        const subEventElements = document.querySelectorAll('[data-sub-event-date-from]');
        
        if (subEventElements.length === 0) {
            return;
        }
        
        console.log(`Processing ${subEventElements.length} sub-events...`);
        
        subEventElements.forEach(function(element) {
            const dateFrom = element.getAttribute('data-sub-event-date-from');
            const dateTo = element.getAttribute('data-sub-event-date-to');
            
            // Compute status
            const statusInfo = computeEventStatus(dateFrom, dateTo);
            
            // Add status as data attribute
            element.setAttribute('data-sub-event-status', statusInfo.status);
            
            // Add status class
            element.classList.add('sub-event-' + statusInfo.status);
            
            // Find and update any status badge elements
            const statusBadge = element.querySelector('.sub-event-status-badge');
            if (statusBadge) {
                statusBadge.textContent = statusInfo.status;
                statusBadge.className = 'sub-event-status-badge badge-' + statusInfo.status;
            }
        });
    }

    /**
     * Initialize on DOM ready
     */
    function init() {
        processEvents();
        processSubEvents();
        
        // Expose function globally for manual refresh if needed
        window.updateEventStatus = function() {
            processEvents();
            processSubEvents();
        };
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
