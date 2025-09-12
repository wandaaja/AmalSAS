FROM golang:1.21-alpine

WORKDIR /app
COPY backend/ .
RUN go build -o main .
CMD ["./main"]