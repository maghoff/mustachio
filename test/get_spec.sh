#!/usr/bin/env bash

set -ue
cd "$(dirname "$0")"

if [ ! -e spec-1.1.3 ]
then
	curl -L 'https://github.com/mustache/spec/archive/v1.1.3.tar.gz' | tar zxf -
	ln -s spec-1.1.3/specs .
fi
