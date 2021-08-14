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
SOURCE_DOCS := $(shell find libdither/ideas/ -type f -name '*.md')

EXPORTED_DOCS = $(patsubst libdither/ideas/%.md, static/ideas/%.html, $(SOURCE_DOCS))

.PHONY: all clean

all: $(EXPORTED_DOCS)
	

clean:
	- rm -r static/ideas/*

static/ideas/%.html : libdither/ideas/%.md
	@mkdir -p "$(@D)"
	@echo $< -> $@ 
	pandoc -s -o $@ $<

