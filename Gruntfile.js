module.exports = function(grunt) {
	grunt.initConfig({
		htmlmin: {
			dist: {
				options: {
					removeComments: true,
					collapseWhitespace: true,
					collapseInlineTagWhitespace: false,
					removeTagWhitespace: false,
					continueOnParseError: true,
					keepClosingSlash: true
				},
				files: {
					"build/0-main.html": "src/0-main.html",
					"build/1-templates.html": "src/1-templates.html",
					"build/2-datalists.html": "src/2-datalists.html"
				}
			}
		},
		replace: {
			html: {
				options: {
					patterns: [
						{match: "> <", replacement: "><"},
					],
					usePrefix: false,
					silent: true
				},
				files: [
					{expand: true, flatten: true, src: ["build/0-main.html", "build/1-templates.html", "build/2-datalists.html"], dest: "build"}
				]
			},
			translation: {
				options: {
					patterns: [
						{match: new RegExp("\t//.*", "gi"), replacement: ""},
						{match: new RegExp("(\n)(\n)+", "gi"), replacement: "$1"}
					],
					usePrefix: false,
					silent: true
				},
				files: [
					{src: ["src/0-translation.json"], dest: "translation.json"}
				]
			}
		},
		concat: {
			dist: {
				src: ["build/0-main.html", "build/1-templates.html", "build/2-datalists.html", "src/3-worker.js"],
				dest: "dnd-3-5-deli.html",
				nonull: true
			}
		},
		copy: {
			main: {
				src: "src/0-styles.css",
				dest: "dnd-3-5-deli.css"
			}
		}
	});

	// Load the plugin that provides the tasks
	grunt.loadNpmTasks("grunt-contrib-htmlmin");
	grunt.loadNpmTasks("grunt-replace");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-copy");

	// Default tasks
	grunt.registerTask("default", ["htmlmin", "replace", "concat", "copy"]);

};
