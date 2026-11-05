FROM alpine:3.21

# Install curl for the healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Create a real index.html file
RUN printf '%s\n' \
  '<!doctype html>' \
  '<html><head><title>Tender Scrapping</title></head>' \
  '<body><h1>Tender Scrapping</h1><p>Docker environment is running successfully!</p></body></html>' \
  > /app/index.html

EXPOSE 8080

# Tell Docker how to check if the app is actually running
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -fsS http://localhost:8080/ || exit 1

# Run the web server in the foreground
CMD ["httpd", "-f", "-p", "8080", "-h", "/app"]