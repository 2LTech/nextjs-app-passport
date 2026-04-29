#!/bin/sh

echo "Start release"

if [ $# -eq 0 ]; then
    echo "Error: Provide a commit description"
    exit 1
fi

branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD)

## Merge
merge() {
    git add .
    git commit -m"[RELEASE] $1" --allow-empty
    git push

    git checkout main
    git merge dev
    git push
}

if [ $branch = "dev" ]; then
    # Merge
    merge $1

    git checkout dev
else
    echo "You must be on dev branch to run a release"
fi
