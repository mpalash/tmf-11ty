import { DateTime } from "luxon";
import markdownIt from "markdown-it";

export default function(eleventyConfig) {
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLL yyyy");
	});

	// Date formatting (day-month)
	eleventyConfig.addFilter("eventDate", dateObj => {
		return DateTime.fromMillis(Date.parse(dateObj)).toFormat("dd LLL yyyy");
	});

	// Date formatting (day-month)
	eleventyConfig.addFilter("eventDateDetail", dateObj => {
		return DateTime.fromMillis(Date.parse(dateObj)).toFormat("HH:mm");
	});

	// Date formatting (year)
	eleventyConfig.addFilter("yearOnly", dateObj => {
		return DateTime.fromMillis(Date.parse(dateObj)).toFormat("yyyy");
	});

	// Date formatting (human readable)
	eleventyConfig.addFilter("articleDate", dateObj => {
		const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		const date = new Date(Date.parse(dateObj));
		var formattedDate = DateTime.fromMillis(Date.parse(dateObj)).toFormat("dd.MM.yyyy");
		var dayName = days[date.getDay()];
		return (dayName + ' ' + formattedDate);
	});

	// Date formatting (ISO)
	eleventyConfig.addFilter("ISODate", dateObj => {
		return DateTime.fromMillis(Date.parse(dateObj)).toISO();
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
	});

	// Event date/time formatter
	// Takes ISO datetime strings and outputs formatted HTML
	// Input: startDateTime='2025-11-13T13:30:00+00:00', endDateTime='2025-11-13T14:30:00+00:00'
	// Output: <div><span class="event-date">13 Nov 2025</span><span class="event-times">15:30-16:30</span></div>
	eleventyConfig.addFilter("formatEventDateTime", (startDateTime, endDateTime) => {
		if (!startDateTime || !endDateTime) {
			return '';
		}

		try {
			const start = new Date(startDateTime);
			const end = new Date(endDateTime);

			// Validate dates
			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				console.warn('Invalid datetime provided to formatEventDateTime');
				return '';
			}

			// Format date
			const dateStr = formatDateRange(start, end);

			// Format time
			const timeStr = formatTimeRange(start, end);

			// Build HTML
			let html = '<div>\n';
			html += `                    <span class="event-date">${dateStr}</span>\n`;
			if (timeStr) {
				html += `                    <span class="event-times">${timeStr}</span>\n`;
			}
			html += '                </div>';

			return html;
		} catch (error) {
			console.error('Error in formatEventDateTime:', error);
			return '';
		}
	});
	// Helper function: Format date range
	function formatDateRange(start, end) {
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		
		const startDay = start.getDate();
		const startMonth = monthNames[start.getMonth()];
		const startYear = start.getFullYear();
		
		const endDay = end.getDate();
		const endMonth = monthNames[end.getMonth()];
		const endYear = end.getFullYear();

		// Same day
		if (start.getDate() === end.getDate() &&
			start.getMonth() === end.getMonth() &&
			start.getFullYear() === end.getFullYear()) {
			return `${startDay} ${startMonth} ${startYear}`;
		}

		// Same month and year
		if (start.getMonth() === end.getMonth() &&
			start.getFullYear() === end.getFullYear()) {
			return `${startDay}-${endDay} ${startMonth} ${startYear}`;
		}

		// Same year, different months
		if (start.getFullYear() === end.getFullYear()) {
			return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
		}

		// Different years
		return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
	}
	// Helper function: Format time range
	function formatTimeRange(start, end) {
		const startHours = start.getHours();
		const startMinutes = start.getMinutes();
		const endHours = end.getHours();
		const endMinutes = end.getMinutes();

		// Check for midnight-to-midnight (all-day event)
		if (startHours === 0 && startMinutes === 0 && endHours === 0 && endMinutes === 0) {
			return '';
		}

		const formatTime = (hours, minutes) => {
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		};

		return `${formatTime(startHours, startMinutes)}-${formatTime(endHours, endMinutes)}`;
	}

	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if(!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	// Return the smallest number argument
	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Return the keys used in an object
	eleventyConfig.addFilter("getKeys", target => {
		return Object.keys(target);
	});

	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
		return (tags || []).filter(tag => ["all", "posts"].indexOf(tag) === -1);
	});

	// Markdownify
	eleventyConfig.addFilter("md", value => {
		if (value != null) {
			var md = markdownIt({
				html: true,
				breaks: true,
				typographer: true,
				quotes: '“”‘’'
			});
			var rendered = md.render(value);
			// rendered = rendered.replace(/a href/gi, 'a data-no-swup href');
			return rendered;
		} else {
			return null
		}
	});

	// Serialize
	eleventyConfig.addFilter("serialize", (value) => {
		return JSON.stringify(value, null, "\t");
	});

};
