#!/bin/sh
if [ "$1" != "" ]; then 
	echo "copying all files from directory "$1" into $(pwd)"; 
	# rm -rf build/*
	rm precache-manifest*.js
	cp -r $1/* .
	rm *.test.js
	# cp -r db build/db
	# cp CNAME build/
	echo "API_URL = 'https://raw.githubusercontent.com/trexsatya/trexsatya.github.io/gh-pages/db/'" >> config.js
	echo "PRELOAD_SEARCH = true" >> config.js
	echo "WRITE_API_URL = 'https://cupitor-ghpages-backend.herokuapp.com/'" >> config.js
	
	# mkdir build/article
	# mkdir build/articles
	# cp build/index.html build/article
	# cp build/index.html build/articles
	# python3 prepare.py 
else 
	echo "Pass parameter: where (dist directory) to pull from?";
	# exit; 
fi
