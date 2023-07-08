// @format
import test from "ava";
import { Wallet } from "ethers";

import * as sdk from "../src/index.mjs";

test("revoke delegation", async (t) => {
  const to = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signerTo = new Wallet(privateKey);
  const from = "0x0000000000000000000000000000000000000001";
  const authorize = false;

  const data = await sdk.create(signerTo, from, to, authorize);
  t.is(data.length, 3);
  t.true(parseInt(data[2].slice(-1), 16) === 0);

  try {
    const result = await sdk.validate(data, from);
    t.is(result.from, from);
    t.is(result.to, to);
    t.false(result.authorize);
    t.truthy(result);
  } catch (err) {
    t.fail(err.message);
  }
});

test("generate delegation message", async (t) => {
  const to = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signerTo = new Wallet(privateKey);
  const from = "0x0000000000000000000000000000000000000001";
  const authorize = true;

  const data = await sdk.create(signerTo, from, to, authorize);
  t.is(data.length, 3);
  t.true(parseInt(data[2].slice(-1), 16) === 1);

  try {
    const result = await sdk.validate(data, from);
    t.is(result.from, from);
    t.is(result.to, to);
    t.true(result.authorize);
    t.truthy(result);
  } catch (err) {
    t.fail(err.message);
  }
});
