import { google } from "googleapis";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.value;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Google Sheets: missing Replit connector env vars");
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=google-sheet`,
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  );

  const data = await resp.json() as any;
  const item = data.items?.[0];
  const accessToken =
    item?.settings?.access_token ||
    item?.settings?.oauth?.credentials?.access_token;

  if (!accessToken) {
    throw new Error("Google Sheets: not connected");
  }

  const expiresAt = item?.settings?.expires_at
    ? new Date(item.settings.expires_at).getTime()
    : Date.now() + 3500 * 1000;

  cachedToken = { value: accessToken, expiresAt };
  return accessToken;
}

export async function getGoogleSheetsClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth: oauth2Client });
}

export const MEMBERSHIP_SHEET_ID = "1byi1bcsjzjREU-7_1qdkHhtUXi4ts3FCNfZoyKI3OtQ";
export const MEMBERSHIP_SHEET_NAME = "Form Responses 1";

export interface SheetOrder {
  timestamp: string;
  name: string;
  phone: string;
  memberStatus: string;
  address: string;
  products: string;
  totalPrice: string;
  shippingMethod: string;
  notes: string;
}

export async function getMemberOrdersByPhone(phone: string): Promise<SheetOrder[]> {
  const sheets = await getGoogleSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: MEMBERSHIP_SHEET_ID,
    range: `${MEMBERSHIP_SHEET_NAME}!A:P`,
  });

  const rows = resp.data.values ?? [];
  if (rows.length < 2) return [];

  const normalizePhone = (p: string) => p.replace(/\D/g, "").replace(/^0/, "84");
  const searchPhone = normalizePhone(phone);

  return rows
    .slice(1)
    .filter((row) => {
      const rowPhone = normalizePhone(row[2] ?? "");
      return rowPhone === searchPhone || (row[2] ?? "").trim() === phone.trim();
    })
    .map((row) => ({
      timestamp: row[0] ?? "",
      name: row[1] ?? "",
      phone: row[2] ?? "",
      memberStatus: row[3] ?? "",
      address: row[4] || row[7] || "",
      products: row[9] ?? "",
      totalPrice: row[10] ?? "",
      shippingMethod: row[14] ?? "",
      notes: row[15] ?? "",
    }));
}
