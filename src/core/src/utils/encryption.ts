import crypto from "crypto";

const ENCRYPTION_KEY = process.env.MORPH_ENCRYPTION_KEY;
const IV_LENGTH = 16;

function getKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error("MORPH_ENCRYPTION_KEY env variable is not set.");
  }
  return crypto.createHash("sha256").update(String(ENCRYPTION_KEY)).digest();
}

export function encrypt(data: any): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data)),
    cipher.final(),
  ]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(encryptedData: string): any {
  const key = getKey();
  const [ivHex, encryptedHex] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString());
}

// Specific functions for state encryption and decryption
export function encryptState(data: {
  connectionId: string;
  timestamp: number;
}): string {
  return encrypt(data);
}

export function decryptState(encryptedState: string): {
  connectionId: string;
  timestamp: number;
} {
  return decrypt(encryptedState);
}

// Example functions for database token encryption and decryption
export function encryptDatabaseToken(token: string): string {
  return encrypt({ token });
}

export function decryptDatabaseToken(encryptedToken: string): string {
  const decrypted = decrypt(encryptedToken);
  return decrypted.token;
}
