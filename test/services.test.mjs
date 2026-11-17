import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";
import * as base64 from "../src/services/base64.ts";
import * as url from "../src/services/url.ts";
import {
  analyzeJWT,
  decodeJWT,
  inspectTemporalClaims,
  JwtError,
  validateJWT,
  verifyJWTSignature,
} from "../src/services/jwt.ts";
import { PasswordsGenerator } from "../src/services/passwords.ts";
import { generateStrapiTokens, generateWordPressSalts, generateWPSalt } from "../src/services/salts.ts";
import { EntropyCalculator } from "../src/services/entropy.ts";

test("Base64 y URL conservan texto Unicode", () => {
  const text = "contraseña ñ & / ?";
  assert.equal(base64.decode(base64.encode(text)), text);
  assert.equal(url.decode(url.encode(text)), text);
  assert.throws(() => url.decode("%ZZ"), URIError);
});

test("Base64URL admite padding opcional y rechaza entradas inválidas", () => {
  const text = "💩";
  const encoded = base64.encode(text, "base64url");
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.equal(base64.decode(encoded, "base64url"), text);

  const padded = base64.encode(text, "base64url", true);
  assert.ok(padded.endsWith("="));
  assert.equal(base64.decode(padded, "base64url"), text);
  assert.throws(() => base64.decode("a*", "base64url"), /Invalid Base64URL/);
  assert.throws(() => base64.decode("/w=="), /valid UTF-8/);
});

test("URL distingue componente, URL completa y datos de formulario", () => {
  const fullUrl = "https://example.com/a b?q=x y#tag";
  const encodedFullUrl = "https://example.com/a%20b?q=x%20y#tag";
  assert.equal(url.encode(fullUrl, "uri"), encodedFullUrl);
  assert.equal(url.decode(encodedFullUrl, "uri"), fullUrl);
  assert.equal(url.encode("a b+c&ñ", "form"), "a+b%2Bc%26%C3%B1");
  assert.equal(url.decode("a+b%2Bc%26%C3%B1", "form"), "a b+c&ñ");
  assert.throws(() => url.decode("%ZZ", "form"), URIError);
});

function encodeJwtSegment(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function createJwt(header, payload, secret = "secreto") {
  const encodedHeader = encodeJwtSegment(header);
  const encodedPayload = encodeJwtSegment(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

test("JWT decodifica Base64URL estrictamente y rechaza segmentos inválidos", () => {
  const signature = Buffer.from("signature").toString("base64url");
  const token = `${encodeJwtSegment({ alg: "HS256" })}.${encodeJwtSegment({ sub: "usuario" })}.${signature}`;
  assert.deepEqual(validateJWT(token), { valid: true });
  assert.deepEqual(decodeJWT(token), {
    header: { alg: "HS256" },
    payload: { sub: "usuario" },
    signature,
  });
  assert.equal(validateJWT("uno.dos").valid, false);
  assert.equal(validateJWT("uno.dos.+").valid, false);
  assert.equal(validateJWT("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0./").valid, false);
  assert.throws(() => decodeJWT("a.eyJzdWIiOiJ1c2VyIn0."), JwtError);
  assert.throws(
    () => decodeJWT(`${encodeJwtSegment({ alg: "HS256" })}.${Buffer.from("{").toString("base64url")}.`),
    /payload is not valid JSON/
  );
  assert.deepEqual(decodeJWT(`${encodeJwtSegment({ alg: "none" })}.${encodeJwtSegment({ sub: "usuario" })}.`).payload, {
    sub: "usuario",
  });
});

test("JWT analiza exp y nbf en segundos y distingue claims inválidos", () => {
  const temporal = inspectTemporalClaims({ exp: 100, nbf: 200 }, 100);
  assert.deepEqual(temporal, {
    exp: { status: "expired", value: 100 },
    nbf: { status: "not-yet-valid", value: 200 },
    withinValidityWindow: false,
  });

  const atNotBefore = inspectTemporalClaims({ exp: 300, nbf: 200 }, 200);
  assert.equal(atNotBefore.exp.status, "valid");
  assert.equal(atNotBefore.nbf.status, "valid");
  assert.equal(atNotBefore.withinValidityWindow, true);

  const absent = inspectTemporalClaims({}, 100);
  assert.equal(absent.exp.status, "missing");
  assert.equal(absent.nbf.status, "missing");
  assert.equal(absent.withinValidityWindow, true);

  const invalid = inspectTemporalClaims({ exp: "100", nbf: null }, 100);
  assert.equal(invalid.exp.status, "invalid");
  assert.equal(invalid.nbf.status, "invalid");
  assert.equal(invalid.withinValidityWindow, false);

  assert.equal(analyzeJWT(createJwt({ alg: "HS256" }, { exp: 200 }), 100).temporal.exp.status, "valid");
});

test("JWT verifica firmas HS256 y rechaza algoritmos o firmas inválidas", () => {
  const token = createJwt({ alg: "HS256" }, { sub: "usuario" });
  assert.deepEqual(verifyJWTSignature(token, "secreto"), { valid: true, algorithm: "HS256" });
  assert.deepEqual(verifyJWTSignature(token, "clave-incorrecta"), {
    valid: false,
    algorithm: "HS256",
    reason: "invalid-signature",
  });

  const unsupported = createJwt({ alg: "HS512" }, { sub: "usuario" });
  assert.deepEqual(verifyJWTSignature(unsupported, "secreto"), {
    valid: false,
    algorithm: "HS512",
    reason: "unsupported-algorithm",
  });

  const [header, payload] = token.split(".");
  assert.deepEqual(verifyJWTSignature(`${header}.${payload}.AQ`, "secreto"), {
    valid: false,
    algorithm: "HS256",
    reason: "invalid-signature",
  });
  assert.throws(() => verifyJWTSignature(token, ""), /Enter the HS256 secret/);
});

test("las contraseñas contienen las categorías seleccionadas", () => {
  const generator = new PasswordsGenerator();
  const password = generator.generatePassword({
    length: 20,
    uppercase: true,
    numbers: true,
    symbols: true,
    customChars: "€",
    excludeAmbiguous: false,
  });
  assert.equal(password.length, 20);
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[^\p{L}\p{N}€]/u);
  assert.ok(password.includes("€"));
  const passwordWithoutAmbiguousCharacters = generator.generatePassword({
    length: 64,
    uppercase: true,
    numbers: true,
    symbols: true,
    customChars: "€0",
    excludeAmbiguous: true,
  });
  assert.doesNotMatch(passwordWithoutAmbiguousCharacters, /[0O1lI|]/);
  assert.ok(passwordWithoutAmbiguousCharacters.includes("€"));
  assert.throws(
    () =>
      generator.generatePassword({
        length: 20,
        uppercase: false,
        numbers: false,
        symbols: false,
        customChars: "0O1lI|",
        excludeAmbiguous: true,
      }),
    /No characters remain/
  );
  assert.throws(
    () =>
      generator.generatePassword({
        length: 3,
        uppercase: false,
        numbers: false,
        symbols: false,
        customChars: "",
        excludeAmbiguous: false,
      }),
    /longitud mínima/
  );
});

test("los salts de WordPress y tokens de Strapi mantienen su formato", () => {
  const salt = generateWPSalt();
  assert.equal(salt.length, 64);
  assert.match(salt, /^[\x21-\x7e]+$/);
  assert.doesNotMatch(salt, /['"`\\]/);

  for (const format of ["env", "yaml"]) {
    const wpLines = generateWordPressSalts(format).split("\n");
    const strapiLines = generateStrapiTokens(format).split("\n");
    assert.equal(wpLines.length, 8);
    assert.equal(strapiLines.length, 6);
    const separator = format === "env" ? "=" : ": ";
    assert.ok(wpLines.every((line) => line.includes(separator)));
    assert.ok(strapiLines.every((line) => line.includes(separator)));
    const appKeys = strapiLines[0].slice(strapiLines[0].indexOf(separator) + separator.length).split(",");
    assert.equal(appKeys.length, 4);
    assert.ok(appKeys.every((key) => Buffer.from(key, "base64").length === 16));
  }
});

test("la entropía distingue contraseñas vacías de las no vacías", () => {
  const calculator = new EntropyCalculator();
  const empty = calculator.calculateDetailedEntropy("", {});
  const password = calculator.calculateDetailedEntropy("aA1!", { uppercase: true, numbers: true, symbols: true });
  const withoutAmbiguousCharacters = calculator.calculateDetailedEntropy("aA1!", {
    uppercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: true,
  });
  assert.equal(empty.theoreticalBits, 0);
  assert.equal(empty.shannonBits, 0);
  assert.ok(password.theoreticalBits > 0);
  assert.ok(password.shannonBits > 0);
  assert.ok(withoutAmbiguousCharacters.theoreticalBits < password.theoreticalBits);
});
