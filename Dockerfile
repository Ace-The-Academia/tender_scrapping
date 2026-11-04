
FROM alpine:3.21

WORKDIR /app

# Install basic utilities
RUN apk add --no-cache bash curl

# Create a placeholder application
RUN echo "Tender Scrapping - Docker environment is running!" > index.html

EXPOSE 8080

CMD ["sh", "-c", "while true; do echo 'Tender Scrapping container is running'; sleep 60; done"]
