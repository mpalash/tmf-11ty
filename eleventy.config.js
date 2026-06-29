import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import * as path from "path";
import * as fs from "fs";
import * as sass from "sass";
import { minify } from "terser";
import * as pagefind from "pagefind";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

import pluginFilters from "./_config/filters.js";

/* @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function(eleventyConfig) {
	// Watch both SCSS files and partials during serve
	eleventyConfig.addWatchTarget("content/**/*.scss");
	eleventyConfig.addWatchTarget("_includes/scss/*.scss");

	// Process SCSS
	eleventyConfig.addTemplateFormats("scss");
	eleventyConfig.addExtension("scss", {
		outputFileExtension: "css",
		useLayouts: false,
		compile: async function (inputContent, inputPath) {
			if (path.basename(inputPath).startsWith('_')) {
				return;
			}

			const isDev = process.env.NODE_ENV !== 'production';

			let result = sass.compileString(inputContent, {
				loadPaths: [
					".",
					this.config.dir.sass,
					path.dirname(inputPath)
				],
				style: isDev ? "expanded" : "compressed",
				sourceMap: isDev
			});

			return (data) => {
				if (isDev && result.sourceMap) {
					const sm = JSON.stringify(result.sourceMap)
					const smBase64 = (Buffer.from(sm, 'utf8') || '').toString('base64')
					const smComment = '/*# sourceMappingURL=data:application/json;charset=utf-8;base64,' + smBase64 + ' */'
					return result.css.toString() + '\n'.repeat(2) + smComment;
				}
				return result.css.toString();
			};
		}
	});

	// Copy the contents of the `public` folder to the output folder
	// For example, `./public/css/` ends up in `_site/css/`
	eleventyConfig
		.addPassthroughCopy({
			"./public/": "/",
			"node_modules/parvus/dist/js/parvus.esm.min.js": "js/parvus.esm.min.js",
			// ESM helper modules imported by per-page {% js %} bundles at runtime.
			"_includes/js/accordion.js": "js/accordion.js",
			"_includes/js/youtubeEmbed.js": "js/youtubeEmbed.js"
		})
		.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");

	// Run Eleventy when these files change:
	// https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

	// Watch content images for the image pipeline.
	eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

	// Per-page bundles, see https://github.com/11ty/eleventy-plugin-bundle
	// Adds the {% css %} paired shortcode
	eleventyConfig.addBundle("css", {
		toFileDirectory: "dist",
	});
	// Adds the {% js %} paired shortcode
	eleventyConfig.addBundle("js", {
		toFileDirectory: "dist",
	});

	// Official plugins
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	// Image optimization: https://www.11ty.dev/docs/plugins/image/#eleventy-transform
	eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		// File extensions to process in _site folder
		extensions: "html",

		// Output formats for each image.
		formats: ["avif", "svg", "webp", "auto"],
		sharpOptions: {
			animated: true,
			loop: 0
		},

		widths: [400, 600, 800, 1200, 1600, "auto"],

		svgShortCircuit: true,
		outputDir: "./_site/images/",
		urlPath: "/images/",

		filenameFormat: function (id, src, width, format, options) {
			const extension = path.extname(src);
			const name = path.basename(src, extension);

			return `${name}-${width}w.${format}`;
		},

		defaultAttributes: {
			// e.g. <img loading decoding> assigned on the HTML tag will override these values.
			loading: "lazy",
			decoding: "async",
			sizes: "(min-width: 1024px) 64vw, (min-width: 600px) 84vw, 100vw",
		}
	});

	// Filters
	eleventyConfig.addPlugin(pluginFilters);

	eleventyConfig.addPlugin(IdAttributePlugin, {
		// by default we use Eleventy’s built-in `slugify` filter:
		// slugify: eleventyConfig.getFilter("slugify"),
		// selector: "h1,h2,h3,h4,h5,h6", // default
	});

	eleventyConfig.addShortcode("currentBuildDate", () => {
		return (new Date()).toISOString();
	});

	// Single post-build hook: (1) minify JS in production, then (2) build the
	// Pagefind index.
	eleventyConfig.on('eleventy.after', async () => {
		const isProd = process.env.NODE_ENV === 'production';

		// 1. Minify JS in production builds.
		if (isProd) {
			async function minifyDir(dir, { module = false } = {}) {
				if (!fs.existsSync(dir)) return;
				const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.endsWith('.min.js'));
				for (const file of files) {
					const filePath = path.join(dir, file);
					const code = fs.readFileSync(filePath, 'utf-8');
					// ESM files (e.g. the /js/ helper modules) must be minified in
					// module mode so terser doesn't choke on top-level export/import.
					const isModule = module || /^\s*(export|import)\s/m.test(code);
					const result = await minify(code, {
						module: isModule,
						compress: { drop_console: true },
						mangle: true
					});
					if (result.code) {
						fs.writeFileSync(filePath, result.code);
					}
				}
			}

			// Global classic scripts (loaded via <script defer src>).
			await minifyDir(path.join('_site', 'js'));
			// Per-page bundles (loaded via <script type="module">; use ES imports).
			await minifyDir(path.join('_site', 'dist'), { module: true });
		}

		// 2. Build the Pagefind index from the rendered HTML (replaces fuse + the
		// monolithic search-index.json). Indexes only [data-pagefind-body] regions.
		// Skipped on the dev server (it's an expensive WASM pass on every rebuild)
		// unless PAGEFIND=1 is set — use `PAGEFIND=1 npm start` to test search in dev.
		if (isProd || process.env.PAGEFIND === '1') {
			const outDir = path.join('_site', 'pagefind');
			// writeFiles() does not prune stale files; clear first so content-hashed
			// fragments from previous builds don't accumulate.
			fs.rmSync(outDir, { recursive: true, force: true });
			const { index } = await pagefind.createIndex();
			await index.addDirectory({ path: '_site' });
			await index.writeFiles({ outputPath: outDir });
			await pagefind.close();
		}
	});

	// Features to make your build faster (when you need them)

	// If your passthrough copy gets heavy and cumbersome, add this line
	// to emulate the file copy on the dev server. Learn more:
	// https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve

	// eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
};

export const config = {
	// Control which files Eleventy will process
	// e.g.: *.md, *.njk, *.html, *.liquid
	templateFormats: [
		"md",
		"njk",
		"html",
		"liquid",
		"11ty.js",
	],

	// Pre-process *.md files with: (default: `liquid`)
	markdownTemplateEngine: "njk",

	// Pre-process *.html files with: (default: `liquid`)
	htmlTemplateEngine: "njk",

	// These are all optional:
	dir: {
		input: "content",          // default: "."
		includes: "../_includes",  // default: "_includes" (`input` relative)
		sass: "_includes/scss",  // default: "_includes" (`input` relative)
		data: "../_data",          // default: "_data" (`input` relative)
		output: "_site"
	},

	// -----------------------------------------------------------------
	// Optional items:
	// -----------------------------------------------------------------

	// If your site deploys to a subdirectory, change `pathPrefix`.
	// Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

	// When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
	// it will transform any absolute URLs in your HTML to include this
	// folder name and does **not** affect where things go in the output folder.

	// pathPrefix: "/",
};
