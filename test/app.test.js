import supertest from "supertest";
import nock from "nock";
import app from "../app.js";

const generateMockEml = () => {
  const timestamp = new Date().toUTCString();
  return `Date: ${timestamp}\r\nFrom: sender@example.com\r\nTo: recipient@example.com\r\nSubject: Test Email\r\n\r\nThis is the body of the email.`;
};

describe("App Tests", () => {
  beforeEach(() => {
    nock(`${process.env.LOCALSTACK_HOST || 'http://localhost:4566'}`)
      .get("/_aws/ses")
      .reply(200, {
        messages: [
          {
            Timestamp: Date.now(),
            RawData: generateMockEml(),
          },
          {
            Timestamp: Date.now(),
            RawData: generateMockEml(),
          },
          {
            Timestamp: Date.now(),
            Subject: "Test email",
            Destination: {
              ToAddresses: ["jeff@aws.com", "adam@aws.com"]
            },
            Body: {
              text_part: null,
              html_part: "<html>This is a test email with html</html>",
            },
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
    expect(response.header["content-disposition"]).toBe(
      'attachment; filename="Test Email.eml"',
    );
  });

  test("GET /emails/:id/download should return status 400 when the email does not contain raw data", async () => {
    const response = await supertest(app).get("/emails/2/download");
    expect(response.status).toBe(400);
  });
});
