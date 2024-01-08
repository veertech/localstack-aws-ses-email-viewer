import express from "express";
import fetch from "node-fetch";
import mailparser from "mailparser";

const simpleParser = mailparser.simpleParser;

const app = express();

const apiUrl = "http://localstack:4566/_aws/ses";

app.set("view engine", "pug");

app.get("/", async (req, res, next) => {
  try {
    const messages = await fetchMessages();
    const messagesForTemplate = await Promise.all(
      messages.map(async (message, index) => {
        const parsed = await simpleParser(message.RawData);
        const logo = parsed.attachments.find((attachment) => attachment.filename === "default-logo.png");
        return {
          id: index,
          timestamp: message.Timestamp,
          subject: parsed.subject,
          to: parsed.to.text,
          logo: logo ? logo.content : null,
        };
      }),
    );
    res.render("index", { messages: messagesForTemplate.reverse() });
  } catch (err) {
    next(err);
  }
});

app.get("/emails/latest", async (req, res, next) => {
  try {
    const messages = await fetchMessages();
    const email = messages[messages.length - 1];

    let parsed = await simpleParser(email.RawData);

    res.send(parsed["html"]);
  } catch (err) {
    next(err);
  }
});

app.get("/emails/:id", async (req, res, next) => {
  try {
    const messages = await fetchMessages();
    const email = messages[req.params.id];

    const parsed = await simpleParser(email.RawData);

    res.render("email", {
      subject: parsed.subject,
      to: parsed.to.text,
      htmlContent: parsed.html,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/emails/:id/download", async (req, res, next) => {
  try {
    const messages = await fetchMessages();
    const email = messages[req.params.id];

    const parsed = await simpleParser(email.RawData);

    res.set({ "Content-Disposition": `attachment; filename="${parsed.subject}.eml"` });
    res.send(email.RawData);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

async function fetchMessages() {
  const response = await fetch(apiUrl);
  const data = await response.json();
  return data["messages"];
}

export default app;
