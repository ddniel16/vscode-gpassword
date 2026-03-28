import crypto from "node:crypto";

const WP_HASH_KEYS = [
  "AUTH_KEY",
  "AUTH_SALT",
  "LOGGED_IN_KEY",
  "LOGGED_IN_SALT",
  "NONCE_KEY",
  "NONCE_SALT",
  "SECURE_AUTH_KEY",
  "SECURE_AUTH_SALT",
];

const EXCLUDE_CHARS = ["'", '"', "\\", "`"];

export function generateWPSalt(): string {
  let salt = "";

  while (salt.length < 64) {
    const charCode = crypto.randomInt(33, 127);
    const char = String.fromCharCode(charCode);
    if (!EXCLUDE_CHARS.includes(char)) {
      salt += char;
    }
  }

  return salt;
}

export function generateWordPressSalts(format: "env" | "yaml"): string {
  if (format === "env") {
    return WP_HASH_KEYS.map((key) => `${key}='${generateWPSalt()}'`).join("\n");
  }
  return WP_HASH_KEYS.map((key) => `${key}: "${generateWPSalt()}"`).join("\n");
}

export function generateStrapiTokens(format: "env" | "yaml"): string {
  const tokens = {
    APP_KEYS: [
      crypto.randomBytes(16).toString("base64"),
      crypto.randomBytes(16).toString("base64"),
      crypto.randomBytes(16).toString("base64"),
      crypto.randomBytes(16).toString("base64"),
    ].join(","),
    API_TOKEN_SALT: crypto.randomBytes(16).toString("base64"),
    TRANSFER_TOKEN_SALT: crypto.randomBytes(16).toString("base64"),
    ADMIN_JWT_SECRET: crypto.randomBytes(16).toString("base64"),
    JWT_SECRET: crypto.randomBytes(16).toString("base64"),
    REFRESH_SECRET: crypto.randomBytes(16).toString("base64"),
  };

  const separator = format === "env" ? "=" : ": ";

  return Object.entries(tokens)
    .map(([key, value]) => `${key}${separator}${value}`)
    .join("\n");
}
