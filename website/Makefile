# Makefile
# 
# Converts Markdown to other formats (HTML, PDF) using Pandoc
# <http://johnmacfarlane.net/pandoc/>
#
# Run "make" (or "make all") to convert to all other formats
#
# Run "make clean" to delete converted files
#
# Adapted from: https://gist.github.com/kristopherjohnson/7466917

# Convert all files in this directory that have a .md suffix
SOURCE_DOCS := $(shell find dither-spec/ -type f -name '*.md')

EXPORTED_DOCS = $(patsubst dither-spec/%.md, static/spec/%.html, $(SOURCE_DOCS))

.PHONY: build clean

build: $(EXPORTED_DOCS)

clean:
	rm $(EXPORTED_DOCS)
	rmdir static/ideas/*/

static/spec/%.html : dither-spec/%.md
	@mkdir -p "$(@D)"
	pandoc -s -o $@ $< --lua-filter=links-to-html.lua --css="/style.css"

host:
	ipfs add -r -w static/*