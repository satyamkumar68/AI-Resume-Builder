FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (build-essential for compiling C extensions like spacy)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download the spaCy english model
RUN python -m spacy download en_core_web_sm

# Copy the rest of the application
COPY . .

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Give execution rights to the startup script
RUN chmod +x start.sh

# Start the application using the bash script
CMD ["./start.sh"]
