#!/bin/sh
if [ "$1" != "" ]; then 
	echo "copyging from "$1" to $(pwd)"; 
	# rm -rf build/*
	cp -r $1/* .
	# cp -r db build/db
	# cp CNAME build/
	echo "API_URL = 'https://raw.githubusercontent.com/trexsatya/trexsatya.github.io/gh-pages/db/'" >> build/config.js
	echo "PRELOAD_SEARCH = true" >> build/config.js
	echo "WRITE_API_URL = 'https://cupitor-ghpages-backend.herokuapp.com/'" >> build/config.js
	
	# mkdir build/article
	# mkdir build/articles
	# cp build/index.html build/article
	# cp build/index.html build/articles
	# python3 prepare.py 
else 
	echo "Pass parameter: where (directory) to pull from?"; 
	# exit; 
fi