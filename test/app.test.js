import supertest from "supertest";
import nock from "nock";
import app from "../app.js";

const generateMockEml = () => {
  const timestamp = new Date().toUTCString();
  return `Date: ${timestamp}\r\nFrom: sender@example.com\r\nTo: recipient@example.com\r\nSubject: Test Email\r\n\r\nThis is the body of the email.`;
};

describe("App Tests", () => {
  beforeEach(() => {
    nock("http://localstack:4566")
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
        ],
      });
  });

  afterEach(() => {
    nock.cleanAll();
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
      'attachment; filename="email.eml"',
    );
  });
});
