# Use AWS Lambda Node.js 20 base image with x86_64 architecture
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:20

# Install system dependencies for Playwright
RUN dnf update -y && \
    dnf install -y \
    wget \
    unzip \
    libdrm \
    mesa-libgbm \
    xorg-x11-server-Xvfb \
    gtk3 \
    libXScrnSaver \
    alsa-lib \
    && dnf clean all

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --omit=dev

# Install Playwright browsers and set environment
ENV PLAYWRIGHT_BROWSERS_PATH=/var/task/.playwright
RUN npx playwright install chromium

# Copy function code
COPY index.js ./

# Set the Lambda handler
CMD [ "index.handler" ]