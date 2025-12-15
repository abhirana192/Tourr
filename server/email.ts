import { RequestHandler } from "express";

export interface EmailNotification {
  action: "create" | "update" | "delete";
  type: "staff" | "tour" | "arrival";
  changes: {
    [key: string]: {
      old?: any;
      new?: any;
    };
  };
  changedBy: {
    id: string;
    name: string;
    email: string;
  };
  recordId: string;
  recordName?: string;
  timestamp: string;
}

async function makeSupabaseRequest(method: string, path: string, body?: any) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase credentials");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${anonKey}`,
      "apikey": anonKey,
      "Content-Type": "application/json",
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase API error: ${response.status} ${error}`);
  }

  const text = await response.text();
  if (!text) {
    return [];
  }

  return JSON.parse(text);
}

function generateEmailContent(notification: EmailNotification): {
  subject: string;
  html: string;
  text: string;
} {
  const { action, type, changes, changedBy, recordName, timestamp } =
    notification;

  const actionText =
    action === "create" ? "created" : action === "update" ? "updated" : "deleted";
  const typeText = type === "staff" ? "Staff Member" : type === "tour" ? "Tour" : "Guest Arrival";

  let changesHtml = "";
  let changesText = "";

  Object.entries(changes).forEach(([field, { old, new: newVal }]) => {
    const fieldDisplay = field
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    if (action === "update") {
      changesHtml += `<tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 8px; font-weight: 500;">${fieldDisplay}</td>
        <td style="padding: 8px; color: #d32f2f;">${old || "—"}</td>
        <td style="padding: 8px; color: #388e3c;">${newVal || "—"}</td>
      </tr>`;
      changesText += `\n${fieldDisplay}: "${old || "—"}" → "${newVal || "—"}"`;
    } else if (action === "create") {
      changesHtml += `<tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 8px; font-weight: 500;">${fieldDisplay}</td>
        <td style="padding: 8px; color: #388e3c;">${newVal || "—"}</td>
      </tr>`;
      changesText += `\n${fieldDisplay}: ${newVal || "—"}`;
    } else if (action === "delete") {
      changesHtml += `<tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 8px; font-weight: 500;">${fieldDisplay}</td>
        <td style="padding: 8px; color: #d32f2f;">${old || "—"}</td>
      </tr>`;
      changesText += `\n${fieldDisplay}: ${old || "—"}`;
    }
  });

  const subject = `${typeText} ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}${recordName ? ` - ${recordName}` : ""}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1976d2; color: white; padding: 20px; border-radius: 4px 4px 0 0; }
    .header h2 { margin: 0; font-size: 18px; }
    .content { background: #f5f5f5; padding: 20px; border-radius: 0 0 4px 4px; }
    .info-box { background: white; padding: 15px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #1976d2; }
    .info-box p { margin: 5px 0; }
    .info-box .label { font-weight: 600; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #e3f2fd; padding: 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #1976d2; }
    td { padding: 8px; }
    .action-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .action-create { background: #c8e6c9; color: #2e7d32; }
    .action-update { background: #ffecb3; color: #f57f17; }
    .action-delete { background: #ffcdd2; color: #c62828; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${subject}</h2>
    </div>
    <div class="content">
      <div class="info-box">
        <p><span class="label">Action:</span> <span class="action-badge action-${action}">${action.toUpperCase()}</span></p>
        <p><span class="label">Type:</span> ${typeText}</p>
        <p><span class="label">Changed by:</span> ${changedBy.name} (${changedBy.email})</p>
        <p><span class="label">Time:</span> ${new Date(timestamp).toLocaleString()}</p>
      </div>

      ${
        action === "update"
          ? `<table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Previous Value</th>
            <th>New Value</th>
          </tr>
        </thead>
        <tbody>
          ${changesHtml}
        </tbody>
      </table>`
          : action === "create"
            ? `<table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${changesHtml}
        </tbody>
      </table>`
            : `<table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Deleted Value</th>
          </tr>
        </thead>
        <tbody>
          ${changesHtml}
        </tbody>
      </table>`
      }

      <div class="footer">
        <p>This is an automated notification from the staff management system.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `${subject}

Action: ${action.toUpperCase()}
Type: ${typeText}
Changed by: ${changedBy.name} (${changedBy.email})
Time: ${new Date(timestamp).toLocaleString()}

Changes:${changesText}

---
This is an automated notification from the staff management system.
  `;

  return { subject, html, text };
}

export interface EmailSendResult {
  success: boolean;
  recipientCount: number;
  recipients: string[];
  timestamp: string;
  senderName: string;
  senderEmail: string;
}

export async function sendNotificationEmail(
  notification: EmailNotification
): Promise<EmailSendResult | null> {
  try {
    // Fetch all staff members except the one who made the change
    const staffList = await makeSupabaseRequest(
      "GET",
      `/staff?id=neq.${notification.changedBy.id}&select=id,email,first_name,last_name`
    );

    if (!staffList || staffList.length === 0) {
      console.log("No other staff members to notify");
      return null;
    }

    const emailContent = generateEmailContent(notification);
    const recipientEmails = staffList
      .map((staff: any) => staff.email)
      .filter((email: string) => email);

    if (recipientEmails.length === 0) {
      console.log("No email addresses found for staff members");
      return null;
    }

    // Check if Resend API is configured
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      // Send via Resend from the staff member's email
      await sendViaResend(
        recipientEmails,
        emailContent.subject,
        emailContent.html,
        resendApiKey,
        notification.changedBy.email,
        notification.changedBy.name
      );
    } else {
      // Fallback: log to console for development
      console.log("\n=== EMAIL NOTIFICATION ===");
      console.log(`From: ${notification.changedBy.name} <${notification.changedBy.email}>`);
      console.log(`To: ${recipientEmails.join(", ")}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log("\n--- HTML Content ---");
      console.log(emailContent.html);
      console.log("\n--- Text Content ---");
      console.log(emailContent.text);
      console.log("========================\n");
    }

    return {
      success: true,
      recipientCount: recipientEmails.length,
      recipients: recipientEmails,
      timestamp: new Date().toISOString(),
      senderName: notification.changedBy.name,
      senderEmail: notification.changedBy.email,
    };
  } catch (error) {
    console.error("Error sending notification email:", error);
    // Don't throw - we don't want email failures to block the main operation
    return null;
  }
}

async function sendViaResend(
  to: string[],
  subject: string,
  html: string,
  apiKey: string,
  senderEmail: string,
  senderName: string
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${senderName} <${process.env.RESEND_FROM_EMAIL || "onboard@resend.dev"}>`,
      reply_to: senderEmail,
      to: to,
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log(`Email sent successfully. Message ID: ${result.id}`);
}
