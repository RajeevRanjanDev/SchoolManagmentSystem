# ─────────────────────────────────────────────────────────────
#  Multi-stage Dockerfile for School Management System
#
#  Stage 1: Build the JAR with Maven
#  Stage 2: Run with a lean JRE image
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom first so Maven downloads dependencies from cache
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Run ──────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S sms && adduser -S sms -G sms
USER sms

# Copy the fat JAR from the build stage
COPY --from=builder /app/target/school-management-system-*.jar app.jar

# Expose application port
EXPOSE 8080

# JVM options: tuned for containerised environments
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseContainerSupport"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
