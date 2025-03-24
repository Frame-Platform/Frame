FROM public.ecr.aws/lambda/nodejs:18

# Install build dependencies
RUN yum install -y git gcc-c++ make

# Create the layer structure
RUN mkdir -p /opt/nodejs

# Set working directory
WORKDIR /opt/nodejs

# Create package.json
RUN echo '{"name":"sharp-lambda-layer","version":"1.0.0","description":"Sharp layer for AWS Lambda","dependencies":{"sharp":"^0.33.2"}}' > package.json

# Install Sharp specifically for Amazon Linux
RUN npm install --platform=linux --arch=x64 sharp

# Clean up to reduce size
RUN find /opt/nodejs/node_modules -type d -name "test" -o -name "tests" -o -name "example" -o -name "docs" | xargs rm -rf
RUN find /opt/nodejs/node_modules -type f -name "*.md" -o -name "*.ts" -o -name "LICENSE" | xargs rm -f
RUN rm -rf /opt/nodejs/node_modules/sharp/src /opt/nodejs/node_modules/sharp/docs /opt/nodejs/node_modules/sharp/vendor
