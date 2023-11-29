# localstack-aws-ses-email-viewer

## Overview

A lightweight web interface to manage emails sent through [LocalStack SES](https://github.com/localstack/localstack) for local development and testing. This tool allows you to easily list, view, and download emails.

## Features

- **List Emails:** Quickly browse through all emails sent via LocalStack SES.

- **View Emails:** Preview the content and details of individual emails with the rendered HTML version displayed in your browser.

- **Download Emails:** Save email contents in EML format for offline access or further analysis.

## Usage

1. **Clone and Install:**
   - Clone the repository: `git clone https://github.com/veertech/localstack-aws-ses-email-viewer.git`
   - Navigate to the project directory: `cd localstack-aws-ses-email-viewer`
   - Install dependencies: `npm install`

2. **Run the Application:**
   - Run: `node server.js`

3. **Access the Interface:**
   - Open [http://localhost:3005](http://localhost:3005) in your web browser.

## Requirements

- [LocalStack](https://github.com/localstack/localstack): Ensure LocalStack, especially the SES service, is set up and running.
- [Node.js](https://nodejs.org/): Make sure Node.js is installed on your system.
