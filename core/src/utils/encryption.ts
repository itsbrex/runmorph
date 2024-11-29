import crypto from "crypto";

import { config } from "dotenv";

config();

const ENCRYPTION_KEY = process.env.MORPH_ENCRYPTION_KEY;
const IV_LENGTH = parseInt(process.env.MORPH_ENCRYPTION_IV_LENGTH || "16");

// Fonction pour chiffrer une valeur de texte
function encryptValue(value: string): string {
  const iv = crypto.randomBytes(IV_LENGTH); // IV pour AES-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

// Fonction pour déchiffrer une valeur de texte
function decryptValue(encryptedValue: string): string {
  try {
    const parts = encryptedValue.split(":");
    if (parts.length < 3) {
      throw new Error("Invalid encrypted value format");
    }
    const iv = Buffer.from(parts.shift()!, "hex");
    const authTag = Buffer.from(parts.shift()!, "hex");
    const encryptedText = parts.join(":");

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      iv
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Error decrypting value:", error);
    return encryptedValue; // Return the original value if decryption fails
  }
}

// Function to encrypt JSON data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function encryptJson<T extends Record<string, any>>(
  data: T,
  encryptAll = false
): T {
  const encryptedData = { ...data };

  for (const [key, value] of Object.entries(data)) {
    const shouldEncrypt = encryptAll || key.startsWith("_");
    if (typeof value === "object" && value !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (encryptedData as any)[key] = encryptJson(value, shouldEncrypt);
    } else if (shouldEncrypt && typeof value === "string") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (encryptedData as any)[key] = encryptValue(value);
    }
  }

  return encryptedData;
}

// Function to decrypt JSON data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decryptJson<T extends Record<string, any>>(
  data: T,
  decryptAll = false
): T {
  const decryptedData = { ...data };

  for (const [key, value] of Object.entries(data)) {
    const shouldDecrypt = decryptAll || key.startsWith("_");
    if (typeof value === "object" && value !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (decryptedData as any)[key] = decryptJson(value, shouldDecrypt);
    } else if (
      shouldDecrypt &&
      typeof value === "string" &&
      isEncryptedValue(value)
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (decryptedData as any)[key] = decryptValue(value);
      } catch (error) {
        console.warn(`Failed to decrypt value for key "${key}":`, error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (decryptedData as any)[key] = value; // Keep the original value if decryption fails
      }
    }
  }

  return decryptedData;
}

// Helper function to check if a value is encrypted
function isEncryptedValue(value: string): boolean {
  const parts = value.split(":");
  return parts.length >= 3 && parts[0].length === 32 && parts[1].length === 32;
}

function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error("MORPH_ENCRYPTION_KEY env variable is not set.");
  }
  // Hash the ENCRYPTION_KEY to ensure it's always 32 bytes
  return crypto.createHash("sha256").update(String(ENCRYPTION_KEY)).digest();
}

/**
 * Generates a unique ID with a given prefix and random string
 * @param prefix - The prefix to prepend to the ID (e.g. "whk")
 * @param length - The length of the random string portion (default: 50)
 * @returns A string in the format "{prefix}_{random}"
 */
export function generateId(prefix: string, length = 50): string {
  const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
  const randomString = randomBytes.toString("hex").slice(0, length);
  return `${prefix}_${randomString}`;
}
