import assert from "node:assert/strict";
import { test } from "node:test";
import * as base64 from "../src/services/base64.ts";
import * as url from "../src/services/url.ts";
import { decodeJWT, validateJWT } from "../src/services/jwt.ts";
import { PasswordsGenerator } from "../src/services/passwords.ts";
import { generateStrapiTokens, generateWordPressSalts, generateWPSalt } from "../src/services/salts.ts";
import { EntropyCalculator } from "../src/services/entropy.ts";

test("Base64 y URL conservan texto Unicode", () => {
  const text = "contraseña ñ & / ?";
  assert.equal(base64.decode(base64.encode(text)), text);
  assert.equal(url.decode(url.encode(text)), text);
  assert.throws(() => url.decode("%ZZ"), URIError);
});

test("JWT decodifica sus componentes y rechaza formatos inválidos", () => {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "HS256" })}.${encode({ sub: "usuario" })}.signature`;
  assert.deepEqual(validateJWT(token), { valid: true });
  assert.deepEqual(decodeJWT(token), {
    header: { alg: "HS256" },
    payload: { sub: "usuario" },
    signature: "signature",
  });
  assert.equal(validateJWT("uno.dos").valid, false);
  assert.equal(validateJWT("uno.dos.+").valid, false);
  assert.throws(() => decodeJWT("invalid.invalid.signature"), SyntaxError);
});

test("las contraseñas contienen las categorías seleccionadas", () => {
  const generator = new PasswordsGenerator();
  const password = generator.generatePassword({
    length: 20,
    uppercase: true,
    numbers: true,
    symbols: true,
    customChars: "€",
  });
  assert.equal(password.length, 20);
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[^\p{L}\p{N}€]/u);
  assert.ok(password.includes("€"));
  assert.throws(
    () => generator.generatePassword({ length: 3, uppercase: false, numbers: false, symbols: false, customChars: "" }),
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
  assert.equal(empty.theoreticalBits, 0);
  assert.equal(empty.shannonBits, 0);
  assert.ok(password.theoreticalBits > 0);
  assert.ok(password.shannonBits > 0);
});
