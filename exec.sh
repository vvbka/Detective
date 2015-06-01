#!/bin/bash

type="osx64"
if [ "$(sysctl -b kernel.ostype 2>&1)" == "Linux" ]; then
  type="linux32"
fi

rm -rf app/build
NODE_ENV=development HOST_OS=${type} gulp

if [ "$type" == "osx64" ]; then
  open app/build/detective/${type}/detective.app
else
  app/build/detective/${type}/detective
fi
