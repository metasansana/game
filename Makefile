
docs: docs/assets/js/app.js
	touch $@
# Bundle the sources into a single file.
docs/assets/js/app.js: lib/main.js
	./node_modules/.bin/browserify \
	--debug \
	-o $@ \
	lib/main.js

lib/main.js: lib
	touch $@

# Copy all the sources to the lib folder then build tsc.
lib: $(shell find src -type f)
	rm -R lib 2> /dev/null || true 
	mkdir lib
	cp -R -u src/* lib
	./node_modules/.bin/tsc --project lib


