#!/bin/bash

# $1 is the absolute path of the file that was just changed
FILE_PATH="$1"

# Extract just the clean filename from the full path
FILENAME=$(basename "$FILE_PATH")

# Get current date and time format
DATETIME=$(date "+%Y-%m-%d %H:%M:%S")

# Check if the changed file actually exists
if [ -f "$FILE_PATH" ]; then
    echo "⚡ File changed: $FILENAME. Analyzing modifications..."
    
    # 1. Stage the file changes temporarily to read the diff cleanly
    git add "$FILE_PATH"
    
    # 2. Extract lines starting with + or - (excluding file headers), limited to 3 lines max
    CHANGES=$(git diff --cached "$FILE_PATH" | grep -E '^(\+[^+]|-\[-])' | sed 's/^+/Added: /g; s/^-/Removed: /g' | head -n 3)
    
    # Fallback text if changes are mostly formatting or empty spaces
    if [ -z "$CHANGES" ]; then
        CHANGES="Code structural adjustments"
    fi

    echo "📝 Commit summary details:"
    echo "$CHANGES"
    
    # 3. Fire the automated repository sequence with detailed summary
    git commit -m "edited $FILENAME at $DATETIME

Modifications:
$CHANGES"
    
    git push
    
    echo "✅ Successfully pushed to GitHub!"
    echo "----------------------------------------"
fi
