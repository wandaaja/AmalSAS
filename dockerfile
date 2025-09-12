# ---- Build stage ----
FROM golang:1.22 AS builder

WORKDIR /app

# copy go.mod & go.sum dulu biar cache efisien
COPY backend/go.mod backend/go.sum ./backend/
WORKDIR /app/backend
RUN go mod download

# copy seluruh backend
COPY backend/ ./

# build binary
RUN go build -o main .

# ---- Run stage ----
FROM debian:bullseye-slim

WORKDIR /app

# copy hasil build
COPY --from=builder /app/backend/main .

# copy folder uploads kalau ada
COPY backend/uploads ./uploads

EXPOSE 5050

CMD ["./main"]
