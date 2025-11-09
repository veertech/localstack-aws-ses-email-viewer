import supertest from "supertest";
import nock from "nock";

// Disable SMTP forwarding for tests via environment variable
process.env.SMTP_FORWARD_ENABLED = 'false';

import app from "../app.js";

const generateMockEml = () => {
  const timestamp = new Date().toUTCString();
  return `Date: Fri, 27 Sep 2024 00:18:19 +0300
From: sender@example.com
To: recipient@example.com
Subject: Test Email
Content-Type: multipart/related;
 boundary=b510f43f668889c35c6ed92270c106a8dc55a157b9add4fffd76983ad5cc

--b510f43f668889c35c6ed92270c106a8dc55a157b9add4fffd76983ad5cc
Content-Transfer-Encoding: quoted-printable
Content-Type: text/plain; charset=UTF-8

email body

--b510f43f668889c35c6ed92270c106a8dc55a157b9add4fffd76983ad5cc
Content-Disposition: attachment; filename="file.pdf"
Content-ID: <file.pdf>
Content-Transfer-Encoding: quoted-printable
Content-Type: image/pdf; name="file.pdf"

attachment-content
--b510f43f668889c35c6ed92270c106a8dc55a157b9add4fffd76983ad5cc--
`;
};

describe("App Tests", () => {
  beforeEach(() => {
    nock(`${process.env.LOCALSTACK_HOST || "http://localhost:4566"}`)
      .get("/_aws/ses")
      .reply(200, {
        messages: [
          {
            Timestamp: Date.now(),
            RawData: generateMockEml()
          },
          {
            Timestamp: Date.now(),
            RawData: generateMockEml()
          },
          {
            Timestamp: Date.now(),
            Subject: "Test email",
            Destination: {
              ToAddresses: ["jeff@aws.com", "adam@aws.com"]
            },
            Body: {
              text_part: null,
              html_part: "<html>This is a test email with html</html>"
            }
          },
          {
            Timestamp: Date.now(),
            Subject: "Test email",
            Destination: {
              ToAddresses: ["jeff@aws.com"]
            },
            Body: {
              text_part: "This is a test email",
              html_part: null,
            },
          },
          {
            Timestamp: Date.now(),
            Subject: "Test email CC and BCC only",
            Destination: {
              ToAddresses: [],
              CcAddresses: ['cc@example.com'],
              BccAddresses: ['bcc@example.com']
            },
            Body: {
              text_part: "This is a test email with only CC and BCC recipients",
              html_part: null,
            },
          },
        ],
      });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe("with EXTRA_COLUMNS", () => {
    beforeEach(() => {
      process.env.EXTRA_COLUMNS = "Customer=default-logo.png";
    });

    afterEach(() => {
      process.env.EXTRA_COLUMNS = null;
    });

    test("should render the index page with extra column and logos when GET / is called", async () => {
      const response = await supertest(app).get("/");
      expect(response.status).toBe(200);
      expect(response.type).toBe("text/html");
      expect(response.text).toMatch(/Subject/);
      expect(response.text).toMatch(/To/);
      expect(response.text).toMatch(/Customer/);
    });
  });

  test("GET / should return status 200 and render index page", async () => {
    const response = await supertest(app).get("/");
    expect(response.status).toBe(200);
    expect(response.type).toBe("text/html");
  });

  test("GET /emails/latest should return status 200 and the latest email HTML", async () => {
    const response = await supertest(app).get("/emails/latest");
    expect(response.status).toBe(200);
  });

  test("GET /emails/:id should return status 200 and the email HTML by ID", async () => {
    const response = await supertest(app).get("/emails/0");
    expect(response.status).toBe(200);
  });

  test("GET /emails/:id/download should return status 200 and download the email as a file", async () => {
    const response = await supertest(app).get("/emails/0/download");
    expect(response.status).toBe(200);
    expect(response.header["content-disposition"]).toBe('attachment; filename="Test Email.eml"');
  });

  test("GET /emails/:id/download should return status 400 when the email does not contain raw data", async () => {
    const response = await supertest(app).get("/emails/2/download");
    expect(response.status).toBe(400);
  });

  test("GET /emails/:id/attachments/:attachmentId should return status 200 and show attachment", async () => {
    const response = await supertest(app).get("/emails/1/attachments/2");
    expect(response.status).toBe(200);
  });
});
