import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import { generateHtpasswdEntry } from "../src/services/basicAuth.ts";

test("genera una entrada bcrypt compatible con htpasswd", async () => {
  const entry = await generateHtpasswdEntry("usuario", "contraseña segura", "bcrypt");
  assert.match(entry, /^usuario:\$2y\$12\$/);
  assert.equal(
    await bcrypt.compare("contraseña segura", entry.slice("usuario:".length).replace(/^\$2y\$/, "$2b$")),
    true
  );
});

test("genera hashes APR1, SHA-1 y SHA-crypt con los prefijos de htpasswd", async () => {
  const apr1 = await generateHtpasswdEntry("usuario", "password", "apr1");
  const sha = await generateHtpasswdEntry("usuario", "password", "sha");
  const sha256Crypt = await generateHtpasswdEntry("usuario", "password", "sha256-crypt");
  const sha512Crypt = await generateHtpasswdEntry("usuario", "password", "sha512-crypt");
  assert.match(apr1, /^usuario:\$apr1\$[./0-9A-Za-z]{8}\$[./0-9A-Za-z]{22}$/);
  assert.equal(sha, "usuario:{SHA}W6ph5Mm5Pz8GgiULbPgzG37mj9g=");
  assert.match(sha256Crypt, /^usuario:\$5\$[./0-9A-Za-z]{16}\$[./0-9A-Za-z]{43}$/);
  assert.match(sha512Crypt, /^usuario:\$6\$[./0-9A-Za-z]{16}\$[./0-9A-Za-z]{86}$/);
});

test("genera SHA-crypt compatible con los vectores conocidos", async (t) => {
  t.mock.method(crypto, "randomBytes", () => Buffer.alloc(16));
  assert.equal(
    await generateHtpasswdEntry("usuario", "password", "sha256-crypt"),
    "usuario:$5$................$ufjJmjJ7v8PTSypXqaHnmmRTqMkw.1iQVcShKYyhVP8"
  );
  assert.equal(
    await generateHtpasswdEntry("usuario", "password", "sha512-crypt"),
    "usuario:$6$................$S6u9FY.itGit4YAC5kvYKovmVnrSPVCFprziEQyrMOtIIqqxWvvmDKUUYIW2xfUCmCH5slvKRM3oZtePbnip50"
  );
});

test("aplica el coste y las rondas configurados", async (t) => {
  const bcryptEntry = await generateHtpasswdEntry("usuario", "password", "bcrypt", 10);
  assert.match(bcryptEntry, /^usuario:\$2y\$10\$/);

  t.mock.method(crypto, "randomBytes", () => Buffer.alloc(16));
  assert.equal(
    await generateHtpasswdEntry("usuario", "password", "sha256-crypt", 10000),
    "usuario:$5$rounds=10000$................$oIrGiQ9ysmU1zW1XSU1EzfKQauGT3sFvjuc14g1i.Q."
  );
  assert.equal(
    await generateHtpasswdEntry("usuario", "password", "sha512-crypt", 10000),
    "usuario:$6$rounds=10000$................$Q9AgQpv8P/H3m04X98klZ8HRhdONI3knYDpvvOtHhTn7iWivnlVFnfPPQIJtGakg8QqfY6/J/M7Ui1aXygQfz/"
  );
});

test("rechaza valores que romperían el formato del archivo htpasswd", async () => {
  await assert.rejects(generateHtpasswdEntry("usuario:otro", "password", "bcrypt"), /Username/);
  await assert.rejects(generateHtpasswdEntry("usuario\notro", "password", "sha"), /Username/);
  await assert.rejects(generateHtpasswdEntry("usuario", "", "apr1"), /Password/);
  await assert.rejects(generateHtpasswdEntry("usuario", "x".repeat(73), "bcrypt"), /72 bytes/);
  await assert.rejects(generateHtpasswdEntry("usuario", "password", "bcrypt", 3), /between 4 and 17/);
  await assert.rejects(generateHtpasswdEntry("usuario", "password", "bcrypt", 18), /between 4 and 17/);
  await assert.rejects(generateHtpasswdEntry("usuario", "password", "sha256-crypt", 999), /between 1000 and 100000/);
  await assert.rejects(generateHtpasswdEntry("usuario", "password", "sha512-crypt", 100001), /between 1000 and 100000/);
});
