var gulp = require ('gulp')
var chug = require ('gulp-chug')
var NodeWebkitBuilder = require ('node-webkit-builder')

gulp.task('build', function () {
	return gulp.src(['./app/gulpfile.js']).pipe(chug());
});

gulp.task('default', ['build'], function (cb) {
	process.chdir('app');

	var nw = new NodeWebkitBuilder({
		files: ['./package.json', './**/**'],
		platforms: ['linux32', 'osx64']
	});

	nw.on('log', console.log.bind(console));

	nw.build(function (err) {
		if (err) console.error(err);
		cb(err);
	});
});
