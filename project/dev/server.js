const gulp = require('gulp-util'),
      express = require('express'),
      app = express(),
      PORT = process.argv[2],
      DOCUMENT_ROOT = process.argv[3];

app.use(express.static(DOCUMENT_ROOT));

app.listen(PORT, function () {
  gulp.log(`HTTP-Server listening on port ${PORT}!`);
});
