FROM golang:1.23.3-alpine

WORKDIR /app
COPY backend/ .
RUN go build -o main .
CMD ["./main"]