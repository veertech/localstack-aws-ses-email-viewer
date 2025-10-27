import { SMTPForwarder } from '../lib/smtp-forwarder.js';
import { jest } from '@jest/globals';

describe('SMTPForwarder', () => {
  describe('constructor', () => {
    it('should create disabled forwarder by default', () => {
      const forwarder = new SMTPForwarder();
      expect(forwarder.enabled).toBe(false);
      expect(forwarder.transporter).toBe(null);
    });

    it('should create enabled forwarder with config', () => {
      const forwarder = new SMTPForwarder({
        enabled: true,
        host: 'localhost',
        port: 2525
      });
      expect(forwarder.enabled).toBe(true);
      expect(forwarder.host).toBe('localhost');
      expect(forwarder.port).toBe(2525);
      expect(forwarder.transporter).not.toBe(null);
    });
  });

  describe('forwardMessage', () => {
    it('should return false when disabled', async () => {
      const forwarder = new SMTPForwarder({ enabled: false });
      const message = { Id: 'test-123', RawData: 'test' };

      const result = await forwarder.forwardMessage(message);
      expect(result).toBe(false);
    });

    it('should skip messages without RawData', async () => {
      const forwarder = new SMTPForwarder({ enabled: true });
      const message = { Id: 'test-123' };

      const result = await forwarder.forwardMessage(message);
      expect(result).toBe(false);
      expect(forwarder.processedMessageIds.has('test-123')).toBe(true);
    });

    it('should skip already processed messages', async () => {
      const forwarder = new SMTPForwarder({ enabled: true });
      const message = {
        Id: 'test-123',
        RawData: 'From: test@example.com\nTo: recipient@example.com\nSubject: Test\n\nTest body'
      };

      // Process once
      await forwarder.forwardMessage(message);

      // Try again - should skip
      const result = await forwarder.forwardMessage(message);
      expect(result).toBe(false);
    });

    it('should forward valid email with recipients', async () => {
      const forwarder = new SMTPForwarder({ enabled: true });

      // Mock the transporter
      forwarder.transporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'sent-123' })
      };

      const rawEmail = 'From: sender@example.com\n' +
                      'To: recipient@example.com\n' +
                      'Subject: Test Email\n' +
                      'MIME-Version: 1.0\n' +
                      'Content-Type: text/plain\n' +
                      '\n' +
                      'Test body';

      const message = {
        Id: 'test-456',
        Source: 'sender@example.com',
        RawData: rawEmail
      };

      const result = await forwarder.forwardMessage(message);

      expect(result).toBe(true);
      expect(forwarder.transporter.sendMail).toHaveBeenCalled();
      expect(forwarder.processedMessageIds.has('test-456')).toBe(true);

      const callArgs = forwarder.transporter.sendMail.mock.calls[0][0];
      expect(callArgs.envelope.to).toContain('recipient@example.com');
      expect(callArgs.raw).toBe(rawEmail);
    });

    it('should skip emails without recipients', async () => {
      const forwarder = new SMTPForwarder({ enabled: true });

      const rawEmail = 'From: sender@example.com\n' +
                      'Subject: Test Email\n' +
                      'MIME-Version: 1.0\n' +
                      '\n' +
                      'Test body';

      const message = {
        Id: 'test-789',
        RawData: rawEmail
      };

      const result = await forwarder.forwardMessage(message);
      expect(result).toBe(false);
      expect(forwarder.processedMessageIds.has('test-789')).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const forwarder = new SMTPForwarder({ enabled: true });

      // Mock the transporter to throw error
      forwarder.transporter = {
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP error'))
      };

      const rawEmail = 'From: sender@example.com\n' +
                      'To: recipient@example.com\n' +
                      'Subject: Test\n' +
                      '\n' +
                      'Body';

      const message = {
        Id: 'test-error',
        RawData: rawEmail
      };

      const result = await forwarder.forwardMessage(message);
      expect(result).toBe(false);
    });
  });

  describe('forwardMessages', () => {
    it('should return 0 when disabled', async () => {
      const forwarder = new SMTPForwarder({ enabled: false });
      const messages = [
        { Id: 'msg-1', RawData: 'test' },
        { Id: 'msg-2', RawData: 'test' }
      ];

      const count = await forwarder.forwardMessages(messages);
      expect(count).toBe(0);
    });

    it('should forward multiple messages', async () => {
      const forwarder = new SMTPForwarder({ enabled: true });

      // Mock the transporter
      forwarder.transporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'sent' })
      };

      const messages = [
        {
          Id: 'msg-1',
          RawData: 'From: sender@example.com\nTo: r1@example.com\nSubject: Test 1\n\nBody 1'
        },
        {
          Id: 'msg-2',
          RawData: 'From: sender@example.com\nTo: r2@example.com\nSubject: Test 2\n\nBody 2'
        }
      ];

      const count = await forwarder.forwardMessages(messages);
      expect(count).toBe(2);
      expect(forwarder.transporter.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should handle null messages', async () => {
      const forwarder = new SMTPForwarder({ enabled: true });
      const count = await forwarder.forwardMessages(null);
      expect(count).toBe(0);
    });
  });

  describe('resetProcessedMessages', () => {
    it('should clear processed message IDs', async () => {
      const forwarder = new SMTPForwarder({ enabled: true });
      forwarder.transporter = {
        sendMail: jest.fn().mockResolvedValue({})
      };

      const message = {
        Id: 'test-reset',
        RawData: 'From: sender@example.com\nTo: r@example.com\nSubject: Test\n\nBody'
      };

      await forwarder.forwardMessage(message);
      expect(forwarder.processedMessageIds.has('test-reset')).toBe(true);

      forwarder.resetProcessedMessages();
      expect(forwarder.processedMessageIds.has('test-reset')).toBe(false);
    });
  });

  describe('_extractRecipients', () => {
    it('should extract recipients from To field', () => {
      const forwarder = new SMTPForwarder();
      const parsed = {
        to: { value: [{ address: 'to@example.com' }] }
      };

      const recipients = forwarder._extractRecipients(parsed);
      expect(recipients).toEqual(['to@example.com']);
    });

    it('should extract recipients from multiple fields', () => {
      const forwarder = new SMTPForwarder();
      const parsed = {
        to: { value: [{ address: 'to@example.com' }] },
        cc: { value: [{ address: 'cc@example.com' }] },
        bcc: { value: [{ address: 'bcc@example.com' }] }
      };

      const recipients = forwarder._extractRecipients(parsed);
      expect(recipients).toEqual([
        'to@example.com',
        'cc@example.com',
        'bcc@example.com'
      ]);
    });

    it('should handle missing recipient fields', () => {
      const forwarder = new SMTPForwarder();
      const parsed = {};

      const recipients = forwarder._extractRecipients(parsed);
      expect(recipients).toEqual([]);
    });
  });
});
