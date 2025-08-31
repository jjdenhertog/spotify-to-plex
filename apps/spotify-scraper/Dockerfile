FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Chromium (works on all architectures)
RUN apt-get update \
    && apt-get install -y chromium chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# ChromeDriver is already included with chromium-driver package

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Configure git for public repositories and install Python dependencies
RUN git config --global url."https://github.com/".insteadOf "git@github.com:" \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd -m -u 1001 scraper
USER scraper

# Expose port 3020
EXPOSE 3020

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=3020
ENV HOST=0.0.0.0

# Start the Flask server
CMD ["python", "app.py"]