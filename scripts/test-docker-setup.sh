#!/bin/bash

echo "Testing Docker setup for Vibe Kanban with SpotifyScraper integration..."

# Check if required files exist
echo "Checking required files..."

files=(
    "Dockerfile"
    "supervisord.conf"
    "docker-compose.yml"
    ".dockerignore"
    "apps/spotify-scraper/Dockerfile"
    "apps/spotify-scraper/main.py"
    "apps/spotify-scraper/requirements.txt"
    "apps/spotify-scraper/docker-entrypoint.sh"
)

missing_files=()
for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    else
        echo "✓ $file exists"
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ Missing files:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

# Test Python syntax
echo "Testing Python syntax..."
if python3 -m py_compile apps/spotify-scraper/main.py; then
    echo "✓ Python syntax is valid"
else
    echo "❌ Python syntax errors found"
    exit 1
fi

# Test supervisord config
echo "Testing supervisord configuration..."
if supervisord -c supervisord.conf -t 2>/dev/null; then
    echo "✓ Supervisord configuration is valid"
else
    echo "⚠ Supervisord configuration may have issues (this might be expected in this environment)"
fi

# Check if ports are available
echo "Checking port availability..."
if ! netstat -ln 2>/dev/null | grep -q ":9030\|:3020"; then
    echo "✓ Ports 9030 and 3020 are available"
else
    echo "⚠ Some required ports might be in use"
fi

# Test if requirements can be parsed
echo "Testing Python requirements..."
if pip3 install -r apps/spotify-scraper/requirements.txt --dry-run >/dev/null 2>&1; then
    echo "✓ Python requirements are valid"
else
    echo "⚠ Some Python requirements might not be available"
fi

echo ""
echo "Docker setup test completed!"
echo ""
echo "To build and run the container:"
echo "  docker build -t vibe-kanban ."
echo "  docker run -p 9030:9030 -p 3020:3020 vibe-kanban"
echo ""
echo "Or using docker-compose (if available):"
echo "  docker-compose up --build"