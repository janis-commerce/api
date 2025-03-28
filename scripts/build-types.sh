#!/bin/sh

if [ -d types ]; then
	rm -r types;
fi;

tsc lib/index.js --declaration --allowJs --emitDeclarationOnly --outDir types

# Include manual types
mkdir -p types/types
cp -r lib/types/* types/types/

os=$(uname -s)
if [[ "$os" == "Darwin" ]]; then
sed -i '' -E 's/export \{ (.*) \};/import Request = require(".\/types\/request");\
import Response = require(".\/types\/response");\
export { \1, Request, Response };/' ./types/index.d.ts
else
sed -i -E 's/export \{ (.*) \};/import Request = require(".\/types\/request");\
import Response = require(".\/types\/response");\
export { \1, Request, Response };/' ./types/index.d.ts
fi
