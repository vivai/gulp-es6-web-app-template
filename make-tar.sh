#!/bin/sh
tar --exclude node_modules \
    --exclude project/target \
    --exclude .git \
    --exclude .DS_Store \
    --exclude make-tar.sh \
    --exclude gulp-es6-web-app-template.tar \
    -cvf gulp-es6-web-app-template.tar .
