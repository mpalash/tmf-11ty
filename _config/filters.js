import { DateTime } from "luxon";
import markdownIt from "markdown-it";

export default function(eleventyConfig) {
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
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
