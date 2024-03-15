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
        const parsed = await simpleParser(message.RawData);
        const logos = extraColumns.map(
          (column) =>
            parsed.attachments.find(
              (attachment) => attachment.filename === column.value,
            )?.content,
        );
        return {
          id: index,
          timestamp: message.Timestamp,
          subject: parsed.subject,
          to: parsed.to.text,
          logos,
        };
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

    res.set({
      "Content-Disposition": `attachment; filename="${parsed.subject}.eml"`,
    });
    res.send(email.RawData);
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
  return data["messages"].filter(x => x.RawData);
}

function parseExtraColumns() {
  return process.env.EXTRA_COLUMNS?.split(",").map((column) => {
    const [name, value] = column.split("=");
    return { name, value };
  });
}

export default app;
