# Use AWS Lambda Node.js 20 base image
FROM public.ecr.aws/lambda/nodejs:20

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
RUN npm ci --only=production

# Install Playwright
RUN npx playwright install chromium --with-deps

# Copy function code
COPY index.js ./
COPY playwright-script.js ./

# Set the Lambda handler
CMD [ "index.handler" ]