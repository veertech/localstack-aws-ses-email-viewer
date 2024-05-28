# localstack-aws-ses-email-viewer

## Overview

A lightweight web interface to manage emails sent through [LocalStack SES](https://github.com/localstack/localstack) for local development and testing. This tool allows you to easily list, view, and download emails.

## Features

- **List Emails:** Quickly browse through all emails sent via LocalStack SES.

- **View Emails:** Preview the content and details of individual emails with the rendered HTML version displayed in your browser.

- **Download Emails:** Save email contents in EML format for offline access or further analysis.

## Usage
### With Node
1. **Clone and Install:**
   - Clone the repository: `git clone https://github.com/veertech/localstack-aws-ses-email-viewer.git`
   - Navigate to the project directory: `cd localstack-aws-ses-email-viewer`
   - Install dependencies: `npm install`

2. **Run the Application:**
   - Run: `export LOCALSTACK_HOST=http://localhost:4566`
   - Run: `export PORT=3005`
   - Run: `node server.js`

3. **Access the Interface:**
   - Open [http://localhost:3005](http://localhost:3005) in your web browser.

### With Docker
1. **Clone and Install:**
   - Clone the repository: `git clone https://github.com/veertech/localstack-aws-ses-email-viewer.git`
   - Navigate to the project directory: `cd localstack-aws-ses-email-viewer`
2. **Build the Application:**
   - run `docker build  . -t ses-viewer`
3. **Run the Application:**
   - run `docker run --rm --env LOCALSTACK_HOST=http://localstack:4566   -p 3005:3005 ses-viewer`
4. **Access the Interface:**
   - Open [http://localhost:3005](http://localhost:3005) in your web browser.

   
## Requirements

- [LocalStack](https://github.com/localstack/localstack): Ensure LocalStack, especially the SES service, is set up and running.
- [Node.js](https://nodejs.org/): Make sure Node.js is installed on your system.
