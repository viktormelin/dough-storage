module.exports = {
	mode: "jit",
	purge: ["./public/index.html", "./src/**/*.svelte"],
	darkMode: false, // or 'media' or 'class'
	theme: {
		extend: {
			fontFamily: {
				sans: ["Roboto Condensed", "sans-serif"],
			},
		},
	},
	variants: {
		extend: {},
	},
	plugins: [],
};
