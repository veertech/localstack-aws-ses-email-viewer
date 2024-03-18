import express from "express";
import fetch from "node-fetch";
import mailparser from "mailparser";

const simpleParser = mailparser.simpleParser;

const app = express();

const apiUrl = "http://localstack:4566/_aws/ses";

app.set("view engine", "pug");

app.get("/", async (_req, res, next) => {
  try {
    const messages = await fetchMessages();
    const extraColumns = parseExtraColumns() || [];
    const messagesForTemplate = await Promise.all(
      messages.map(async (message, index) => {
        let email = await createEmail(message, index);
        const logos = extraColumns.map(
          (column) =>
            email.attachments.find(
              (attachment) => attachment.filename === column.value,
            )?.content,
        );

        email.id = index;
        email.logos = logos;
        return email;
      }),
    );
    res.render("index", {
      extraColumns,
      messages: messagesForTemplate.reverse(),
    });
  } catch (err) {
    next(err);
  }
});

app.get("/emails/latest", async (_req, res, next) => {
  try {
    const messages = await fetchMessages();
    const message = messages[messages.length - 1];

    const email = await createEmail(message);

    res.send(email.html);
  } catch (err) {
    next(err);
  }
});

app.get("/emails/:id", async (req, res, next) => {
  try {
    const messages = await fetchMessages();
    const message = messages[req.params.id];

    const email = await createEmail(message);

    res.render("email", {
      subject: email.subject,
      to: email.to,
      htmlContent: email.html,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/emails/:id/download", async (req, res, next) => {
  try {
    const messages = await fetchMessages();
    const message = messages[req.params.id];

    if (!message.RawData) {
      res.status(400).send("Can't download emails without RawData!")
      return;
    }

    const parsed = await simpleParser(message.RawData);

    res.set({
      "Content-Disposition": `attachment; filename="${parsed.subject}.eml"`,
    });
    res.send(message.RawData);
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

async function fetchMessages() {
  const response = await fetch(apiUrl);
  const data = await response.json();
  return data["messages"];
}

async function createEmail(message) {
  if (message.RawData) {
    const parsed = await simpleParser(message.RawData);
    return {
      timestamp: message.Timestamp,
      subject: parsed.subject,
      to: parsed.to.text,
      html: parsed.html,
      attachments: parsed.attachments,
      isDownloadable: true,
    };
  }

  return {
    timestamp: message.Timestamp,
    subject: message.Subject,
    to: message.Destination.ToAddresses,
    html: message.Body.html_part ?? message.Body.text_part,
    attachments: [],
    isDownloadable: false,
  };
}

function parseExtraColumns() {
  return process.env.EXTRA_COLUMNS?.split(",").map((column) => {
    const [name, value] = column.split("=");
    return { name, value };
  });
}

export default app;
