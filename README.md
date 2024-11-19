# Localstack AWS SES Email Viewer

## Overview

A lightweight web interface to manage emails sent through [LocalStack SES](https://github.com/localstack/localstack) for local development and testing.
This tool allows you to easily list, view, and download emails.

## Features

- **List Emails:** Quickly browse through all emails sent via LocalStack SES.
- **View Emails:** Preview the content and details of individual emails with the rendered HTML version displayed in your browser.
- **Download Emails:** Save email contents in EML format for offline access or further analysis.

## Usage
- Clone the repository: `git clone https://github.com/veertech/localstack-aws-ses-email-viewer.git`
- Navigate to the project directory: `cd localstack-aws-ses-email-viewer`

### Run locally
- Install dependencies: `npm install`
- Run: `Run: LOCALSTACK_HOST=http://localhost:4566 PORT=3005 node server.js`
- Open http://localhost:3005 in a web browser.

### Run with docker

- Build image: `docker build  . -t ses-viewer`
- Run: `docker run --rm --env LOCALSTACK_HOST=http://localstack:4566 -p 3005:3005 ses-viewer`
- Open http://localhost:3005 in a web browser.

## Requirements

- [LocalStack](https://github.com/localstack/localstack): Ensure LocalStack, especially the SES service, is set up and running.
- [Node.js](https://nodejs.org/): Make sure Node.js is installed on your system.
