#!/bin/bash

# $1 is the absolute path of the file passed by entr
FILENAME="$1"

# Format the current calendar date and system clock time
DATETIME=$(date "+%Y-%m-%d %H:%M:%S")

echo "⚡ File changed: $FILENAME. Pushing updates to GitHub..."

# Fire the automated repository sequence
git add "$FILENAME"
git commit -m "edited $FILENAME at $DATETIME"
git push