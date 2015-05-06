#!/bin/bash

type="osx64"
if [ "$(sysctl -b kernel.ostype)" == "Linux" ]; then
  type="linux32"
fi

rm -rf app/build
NODE_ENV=development HOST_OS=${type} gulp
app/build/detective/${type}/detective
