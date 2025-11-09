# Localstack AWS SES Email Viewer

## Overview

A lightweight web interface to manage emails sent through [LocalStack SES](https://github.com/localstack/localstack) for local development and testing.
This tool allows you to easily list, view, and download emails.

## Features

- **List Emails:** Quickly browse through all emails sent via LocalStack SES.
- **View Emails:** Preview the content and details of individual emails with the rendered HTML version displayed in your browser.
- **Download Emails:** Save email contents in EML format for offline access or further analysis.
- **SMTP Forwarding:** Optionally forward emails to an external SMTP server (e.g., Mailpit) for advanced testing and inspection.

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

## Configuration

The following environment variables can be used to configure the viewer:

| Variable | Description | Default |
|----------|-------------|---------|
| `LOCALSTACK_HOST` | LocalStack SES endpoint URL | `http://localhost:4566` |
| `PORT` | Port for the web interface | `3005` |
| `EXTRA_COLUMNS` | Custom columns for email list (format: `Name=value,Name2=value2`) | - |
| `SMTP_FORWARD_ENABLED` | Enable SMTP forwarding | `false` |
| `SMTP_FORWARD_HOST` | SMTP server hostname for forwarding | `mailpit` |
| `SMTP_FORWARD_PORT` | SMTP server port for forwarding | `1025` |

### SMTP Forwarding

When `SMTP_FORWARD_ENABLED=true`, the viewer will automatically forward all emails fetched from LocalStack to the configured SMTP server. This is useful for:

- Using modern email testing tools like [Mailpit](https://github.com/axllent/mailpit) alongside the viewer
- Integrating with existing email testing workflows
- Testing email delivery without needing LocalStack Pro's built-in SMTP features

**Example with Mailpit:**

```yaml
services:
  localstack-aws-ses-email-viewer:
    build: .
    environment:
      - LOCALSTACK_HOST=http://localstack:4566
      - SMTP_FORWARD_ENABLED=true
      - SMTP_FORWARD_HOST=mailpit
      - SMTP_FORWARD_PORT=1025
    ports:
      - "3005:3005"
    depends_on:
      - localstack
      - mailpit

  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "8025:8025"  # Web UI
      - "1025:1025"  # SMTP server
```

With this setup:
- View emails in the SES viewer at http://localhost:3005
- Access Mailpit's modern UI at http://localhost:8025
- All emails are automatically available in both interfaces

## Requirements

- [LocalStack](https://github.com/localstack/localstack): Ensure LocalStack, especially the SES service, is set up and running.
- [Node.js](https://nodejs.org/): Make sure Node.js is installed on your system.
