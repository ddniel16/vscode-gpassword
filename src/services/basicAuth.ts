import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export type HtpasswdFormat = "bcrypt" | "apr1" | "sha" | "sha256-crypt" | "sha512-crypt";

const APR1_MAGIC = "$apr1$";
const APR1_ALPHABET = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SHA_CRYPT_ALPHABET = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const DEFAULT_BCRYPT_COST = 12;
const MIN_BCRYPT_COST = 4;
const MAX_BCRYPT_COST = 17;
const DEFAULT_SHA_CRYPT_ROUNDS = 5000;
const MIN_SHA_CRYPT_ROUNDS = 1000;
const MAX_SHA_CRYPT_ROUNDS = 100000;

function md5(data: Buffer): Buffer {
  return crypto.createHash("md5").update(data).digest();
}

function shaDigest(algorithm: "sha256" | "sha512", parts: readonly Buffer[]): Buffer {
  const hash = crypto.createHash(algorithm);
  for (const part of parts) {
    hash.update(part);
  }
  return hash.digest();
}

function toApr1Base64(value: number, length: number): string {
  let encoded = "";
  for (let i = 0; i < length; i += 1) {
    encoded += APR1_ALPHABET[value & 0x3f];
    value >>>= 6;
  }
  return encoded;
}

function generateApr1Hash(password: string): string {
  const passwordBytes = Buffer.from(password, "utf8");
  const salt = [...crypto.randomBytes(8)].map((byte) => APR1_ALPHABET[byte & 0x3f]).join("");
  const saltBytes = Buffer.from(salt, "ascii");
  const initialParts: Buffer[] = [passwordBytes, Buffer.from(`${APR1_MAGIC}${salt}`, "ascii")];

  const alternate = md5(Buffer.concat([passwordBytes, saltBytes, passwordBytes]));
  for (let remaining = passwordBytes.length; remaining > 0; remaining -= 16) {
    initialParts.push(alternate.subarray(0, Math.min(16, remaining)));
  }

  for (let remaining = passwordBytes.length; remaining > 0; remaining >>>= 1) {
    initialParts.push(remaining & 1 ? Buffer.from([0]) : passwordBytes.subarray(0, 1));
  }

  let hash = md5(Buffer.concat(initialParts));
  for (let round = 0; round < 1000; round += 1) {
    const roundParts = [
      ...(round & 1 ? [passwordBytes] : [hash]),
      ...(round % 3 ? [saltBytes] : []),
      ...(round % 7 ? [passwordBytes] : []),
      ...(round & 1 ? [hash] : [passwordBytes]),
    ];
    hash = md5(Buffer.concat(roundParts));
  }

  const encoded = [
    toApr1Base64((hash[0] << 16) | (hash[6] << 8) | hash[12], 4),
    toApr1Base64((hash[1] << 16) | (hash[7] << 8) | hash[13], 4),
    toApr1Base64((hash[2] << 16) | (hash[8] << 8) | hash[14], 4),
    toApr1Base64((hash[3] << 16) | (hash[9] << 8) | hash[15], 4),
    toApr1Base64((hash[4] << 16) | (hash[10] << 8) | hash[5], 4),
    toApr1Base64(hash[11], 2),
  ].join("");

  return `${APR1_MAGIC}${salt}$${encoded}`;
}

function toShaCryptBase64(byte2: number, byte1: number, byte0: number, length: number): string {
  let value = (byte2 << 16) | (byte1 << 8) | byte0;
  let encoded = "";
  for (let i = 0; i < length; i += 1) {
    encoded += SHA_CRYPT_ALPHABET[value & 0x3f];
    value >>>= 6;
  }
  return encoded;
}

function encodeShaCryptHash(hash: Buffer, algorithm: "sha256" | "sha512"): string {
  if (algorithm === "sha256") {
    return [
      toShaCryptBase64(hash[0], hash[10], hash[20], 4),
      toShaCryptBase64(hash[21], hash[1], hash[11], 4),
      toShaCryptBase64(hash[12], hash[22], hash[2], 4),
      toShaCryptBase64(hash[3], hash[13], hash[23], 4),
      toShaCryptBase64(hash[24], hash[4], hash[14], 4),
      toShaCryptBase64(hash[15], hash[25], hash[5], 4),
      toShaCryptBase64(hash[6], hash[16], hash[26], 4),
      toShaCryptBase64(hash[27], hash[7], hash[17], 4),
      toShaCryptBase64(hash[18], hash[28], hash[8], 4),
      toShaCryptBase64(hash[9], hash[19], hash[29], 4),
      toShaCryptBase64(0, hash[31], hash[30], 3),
    ].join("");
  }

  return [
    toShaCryptBase64(hash[0], hash[21], hash[42], 4),
    toShaCryptBase64(hash[22], hash[43], hash[1], 4),
    toShaCryptBase64(hash[44], hash[2], hash[23], 4),
    toShaCryptBase64(hash[3], hash[24], hash[45], 4),
    toShaCryptBase64(hash[25], hash[46], hash[4], 4),
    toShaCryptBase64(hash[47], hash[5], hash[26], 4),
    toShaCryptBase64(hash[6], hash[27], hash[48], 4),
    toShaCryptBase64(hash[28], hash[49], hash[7], 4),
    toShaCryptBase64(hash[50], hash[8], hash[29], 4),
    toShaCryptBase64(hash[9], hash[30], hash[51], 4),
    toShaCryptBase64(hash[31], hash[52], hash[10], 4),
    toShaCryptBase64(hash[53], hash[11], hash[32], 4),
    toShaCryptBase64(hash[12], hash[33], hash[54], 4),
    toShaCryptBase64(hash[34], hash[55], hash[13], 4),
    toShaCryptBase64(hash[56], hash[14], hash[35], 4),
    toShaCryptBase64(hash[15], hash[36], hash[57], 4),
    toShaCryptBase64(hash[37], hash[58], hash[16], 4),
    toShaCryptBase64(hash[59], hash[17], hash[38], 4),
    toShaCryptBase64(hash[18], hash[39], hash[60], 4),
    toShaCryptBase64(hash[40], hash[61], hash[19], 4),
    toShaCryptBase64(hash[62], hash[20], hash[41], 4),
    toShaCryptBase64(0, 0, hash[63], 2),
  ].join("");
}

function repeatToLength(value: Buffer, length: number): Buffer {
  const repeated = Buffer.alloc(length);
  for (let i = 0; i < length; i += 1) {
    repeated[i] = value[i % value.length];
  }
  return repeated;
}

function generateShaCryptHash(password: string, algorithm: "sha256" | "sha512", rounds: number): string {
  const passwordBytes = Buffer.from(password, "utf8");
  const digestLength = algorithm === "sha256" ? 32 : 64;
  const salt = [...crypto.randomBytes(16)].map((byte) => SHA_CRYPT_ALPHABET[byte & 0x3f]).join("");
  const saltBytes = Buffer.from(salt, "ascii");

  const alternate = shaDigest(algorithm, [passwordBytes, saltBytes, passwordBytes]);
  const initialParts: Buffer[] = [passwordBytes, saltBytes];
  for (let remaining = passwordBytes.length; remaining > 0; remaining -= digestLength) {
    initialParts.push(alternate.subarray(0, Math.min(digestLength, remaining)));
  }
  for (let remaining = passwordBytes.length; remaining > 0; remaining >>>= 1) {
    initialParts.push(remaining & 1 ? alternate : passwordBytes);
  }

  let hash = shaDigest(algorithm, initialParts);
  const passwordHash = crypto.createHash(algorithm);
  for (let i = 0; i < passwordBytes.length; i += 1) {
    passwordHash.update(passwordBytes);
  }
  const passwordSequence = repeatToLength(passwordHash.digest(), passwordBytes.length);

  const saltParts: Buffer[] = [];
  for (let i = 0; i < 16 + hash[0]; i += 1) {
    saltParts.push(saltBytes);
  }
  const saltDigest = shaDigest(algorithm, saltParts);
  const saltSequence = repeatToLength(saltDigest, saltBytes.length);

  for (let round = 0; round < rounds; round += 1) {
    const roundParts = [
      ...(round & 1 ? [passwordSequence] : [hash]),
      ...(round % 3 ? [saltSequence] : []),
      ...(round % 7 ? [passwordSequence] : []),
      ...(round & 1 ? [hash] : [passwordSequence]),
    ];
    hash = shaDigest(algorithm, roundParts);
  }

  const id = algorithm === "sha256" ? "5" : "6";
  const roundsPrefix = rounds === DEFAULT_SHA_CRYPT_ROUNDS ? "" : `rounds=${rounds}$`;
  return `$${id}$${roundsPrefix}${salt}$${encodeShaCryptHash(hash, algorithm)}`;
}

export async function generateHtpasswdEntry(
  username: string,
  password: string,
  format: HtpasswdFormat,
  costOrRounds?: number
): Promise<string> {
  if (!username.trim() || /[:\r\n]/.test(username)) {
    throw new Error("Username must not be empty or contain colons or line breaks.");
  }
  if (!password) {
    throw new Error("Password must not be empty.");
  }

  let hash: string;
  switch (format) {
    case "bcrypt": {
      const cost = costOrRounds ?? DEFAULT_BCRYPT_COST;
      if (!Number.isInteger(cost) || cost < MIN_BCRYPT_COST || cost > MAX_BCRYPT_COST) {
        throw new Error(`Bcrypt cost must be an integer between ${MIN_BCRYPT_COST} and ${MAX_BCRYPT_COST}.`);
      }
      if (Buffer.byteLength(password, "utf8") > 72) {
        throw new Error("Bcrypt passwords must be 72 bytes or fewer.");
      }
      hash = (await bcrypt.hash(password, cost)).replace(/^\$2[ab]\$/, "$2y$");
      break;
    }
    case "apr1":
      hash = generateApr1Hash(password);
      break;
    case "sha":
      hash = `{SHA}${crypto.createHash("sha1").update(password, "utf8").digest("base64")}`;
      break;
    case "sha256-crypt":
    case "sha512-crypt": {
      const rounds = costOrRounds ?? DEFAULT_SHA_CRYPT_ROUNDS;
      if (!Number.isInteger(rounds) || rounds < MIN_SHA_CRYPT_ROUNDS || rounds > MAX_SHA_CRYPT_ROUNDS) {
        throw new Error(
          `SHA-crypt rounds must be an integer between ${MIN_SHA_CRYPT_ROUNDS} and ${MAX_SHA_CRYPT_ROUNDS}.`
        );
      }
      hash = generateShaCryptHash(password, format === "sha256-crypt" ? "sha256" : "sha512", rounds);
      break;
    }
    default:
      throw new Error("Unsupported htpasswd hash format.");
  }

  return `${username}:${hash}`;
}
