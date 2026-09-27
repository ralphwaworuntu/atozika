FROM golang:1.23-alpine AS build
WORKDIR /src
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/atozika ./cmd/server

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata && mkdir -p /app/uploads
COPY --from=build /out/atozika /app/atozika
ENV PORT=5000
EXPOSE 5000
CMD ["/app/atozika"]
