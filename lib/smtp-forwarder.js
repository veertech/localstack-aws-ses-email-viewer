import nodemailer from "nodemailer";
import mailparser from "mailparser";

const simpleParser = mailparser.simpleParser;

/**
 * SMTPForwarder handles forwarding emails from LocalStack SES to an SMTP server
 */
export class SMTPForwarder {
  constructor(config = {}) {
    this.enabled = config.enabled || false;
    this.host = config.host || 'mailpit';
    this.port = config.port || 1025;
    this.processedMessageIds = new Set();
    this.transporter = null;

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: false,
        tls: {
          rejectUnauthorized: false
        }
      });
      console.log(`SMTP forwarding enabled: ${this.host}:${this.port}`);
    } else {
      console.log('SMTP forwarding disabled');
    }
  }

  /**
   * Forward a message to the SMTP server
   * @param {Object} message - Message object from LocalStack SES API
   * @returns {Promise<boolean>} - true if forwarded, false if skipped
   */
  async forwardMessage(message) {
    if (!this.enabled || !this.transporter) {
      return false;
    }

    const messageId = message.Id;

    // Skip if already processed
    if (this.processedMessageIds.has(messageId)) {
      return false;
    }

    try {
      // Only forward if we have RawData (complete email)
      if (!message.RawData) {
        console.log(`Message ${messageId} has no RawData, skipping SMTP forward`);
        this.processedMessageIds.add(messageId);
        return false;
      }

      // Parse the email to extract recipients
      const parsed = await simpleParser(message.RawData);

      // Extract all recipient addresses
      const recipients = this._extractRecipients(parsed);

      if (recipients.length === 0) {
        console.log(`Message ${messageId} has no recipients, skipping SMTP forward`);
        this.processedMessageIds.add(messageId);
        return false;
      }

      // Forward the raw email via SMTP
      await this.transporter.sendMail({
        envelope: {
          from: parsed.from?.value?.[0]?.address || message.Source,
          to: recipients
        },
        raw: message.RawData
      });

      console.log(`Forwarded email "${parsed.subject}" to SMTP (${recipients.length} recipient(s))`);
      this.processedMessageIds.add(messageId);
      return true;
    } catch (err) {
      console.error(`Failed to forward message ${messageId} to SMTP:`, err.message);
      return false;
    }
  }

  /**
   * Forward multiple messages
   * @param {Array} messages - Array of message objects
   * @returns {Promise<number>} - Number of messages forwarded
   */
  async forwardMessages(messages) {
    if (!this.enabled || !messages) {
      return 0;
    }

    let forwardedCount = 0;
    for (const message of messages) {
      const forwarded = await this.forwardMessage(message);
      if (forwarded) {
        forwardedCount++;
      }
    }
    return forwardedCount;
  }

  /**
   * Extract recipient email addresses from parsed email
   * @private
   */
  _extractRecipients(parsed) {
    const recipients = [];

    if (parsed.to?.value && Array.isArray(parsed.to.value)) {
      recipients.push(...parsed.to.value.map(addr => addr.address));
    }
    if (parsed.cc?.value && Array.isArray(parsed.cc.value)) {
      recipients.push(...parsed.cc.value.map(addr => addr.address));
    }
    if (parsed.bcc?.value && Array.isArray(parsed.bcc.value)) {
      recipients.push(...parsed.bcc.value.map(addr => addr.address));
    }

    return recipients;
  }

  /**
   * Reset processed message IDs (useful for testing)
   */
  resetProcessedMessages() {
    this.processedMessageIds.clear();
  }
}

/**
 * Create an SMTPForwarder from environment variables
 */
export function createFromEnv() {
  return new SMTPForwarder({
    enabled: process.env.SMTP_FORWARD_ENABLED === 'true',
    host: process.env.SMTP_FORWARD_HOST || 'mailpit',
    port: parseInt(process.env.SMTP_FORWARD_PORT || '1025', 10)
  });
}
