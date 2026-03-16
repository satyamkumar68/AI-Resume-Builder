#!/bin/bash
# Start script for the AI Engine container

# Use PORT environment variable provided by Cloud Run, Heroku, etc. Default to 8080.
PORT="${PORT:-8080}"

# Start the application with uvicorn
exec uvicorn main:app --host 0.0.0.0 --port $PORT
