# ---- Build stage ----
FROM golang:1.22 AS builder

# Set working directory
WORKDIR /app

# Copy backend module files
COPY backend/go.mod backend/go.sum ./backend/
WORKDIR /app/backend
RUN go mod download

# Copy source code
COPY backend/ ./ 

# Build Go binary
RUN go build -o main .

# ---- Run stage ----
FROM debian:bullseye-slim

WORKDIR /app

# Copy binary dari builder
COPY --from=builder /app/backend/main .

# Copy folder uploads kalau ada
COPY backend/uploads ./uploads

# Expose port 5050
EXPOSE 5050

# Jalankan app
CMD ["./main"]
