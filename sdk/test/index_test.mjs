// @format
import test from "ava";
import { Wallet } from "ethers";

import * as sdk from "../src/index.mjs";

// TODO: Add a test that makes sure that invalid signatures are simply ignored
// by organize function
test("call organize with a payload where to==from", async (t) => {
  const to = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signerTo = new Wallet(privateKey);
  const from = to;
  const authorize = true;

  const data = await sdk.create(signerTo, from, to, authorize);

  const eventLog = {
    data,
    receipt: { from: to },
  };

  let result;
  try {
    result = sdk.organize([eventLog]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, {});
});

test("call organize with multiple delegations from the same 'from' address to different 'to' addresses", async (t) => {
  const address0 = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey0 =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signer0 = new Wallet(privateKey0);

  const address1 = "0x82e6F643A7613458E18fa1E80624d0C33ed753Cc";
  const privateKey1 =
    "0xc9c0da9974ac1278e4896f2590ad6766f07dd1ce1d19f14d71302da37b490434";
  const signer1 = new Wallet(privateKey1);

  const from = "0x0000000000000000000000000000000000000001";
  const to0 = address0;
  const data0 = await sdk.create(signer0, from, to0, true);
  const log0 = {
    data: data0,
    receipt: { from: from },
  };

  const to1 = address1;
  const data1 = await sdk.create(signer1, from, to1, true);
  const log1 = {
    data: data1,
    receipt: { from: from },
  };

  let result;
  try {
    result = sdk.organize([log0, log1]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, {
    [to0.toLowerCase()]: from.toLowerCase(),
    [to1.toLowerCase()]: from.toLowerCase(),
  });
});

test("call organize with a successful delegation followed by a revocation, followed by a re-delegation attempt", async (t) => {
  const to = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signer = new Wallet(privateKey);
  const from = "0x0000000000000000000000000000000000000001";

  const data1 = await sdk.create(signer, from, to, true);
  const log1 = {
    data: data1,
    receipt: { from: from },
  };

  const data2 = await sdk.create(signer, from, to, false);
  const log2 = {
    data: data2,
    receipt: { from: from },
  };

  const data3 = await sdk.create(signer, from, to, true);
  const log3 = {
    data: data3,
    receipt: { from: from },
  };

  let result;
  try {
    result = sdk.organize([log1, log2, log3]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, {});
});

test("call organize with two delegations for the same 'to' address", async (t) => {
  const to = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signer = new Wallet(privateKey);
  const from1 = "0x0000000000000000000000000000000000000001";
  const from2 = "0x0000000000000000000000000000000000000002";

  const data1 = await sdk.create(signer, from1, to, true);
  const log1 = {
    data: data1,
    receipt: { from: from1 },
  };

  const data2 = await sdk.create(signer, from2, to, true);
  const log2 = {
    data: data2,
    receipt: { from: from2 },
  };

  let result;
  try {
    result = sdk.organize([log1, log2]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, { [to.toLowerCase()]: from1.toLowerCase() });
});

test("call organize with a successful delegation followed by a revocation", async (t) => {
  const to = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signerTo = new Wallet(privateKey);
  const from = "0x0000000000000000000000000000000000000001";

  const data1 = await sdk.create(signerTo, from, to, true);
  const log1 = {
    data: data1,
    receipt: { from: from },
  };

  const data2 = await sdk.create(signerTo, from, to, false);
  const log2 = {
    data: data2,
    receipt: { from: from },
  };

  let result;
  try {
    result = sdk.organize([log1, log2]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, {});
});

test("call organize with a revocation payload but no existing delegation", async (t) => {
  const to = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signerTo = new Wallet(privateKey);
  const from = "0x0000000000000000000000000000000000000001";
  const authorize = false;

  const data = await sdk.create(signerTo, from, to, authorize);

  const eventLog = {
    data,
    receipt: { from: from },
  };

  let result;
  try {
    result = sdk.organize([eventLog]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, {});
});

test("call organize with a payload where 'from' address is already a 'to' address", async (t) => {
  const address1 = "0x82e6F643A7613458E18fa1E80624d0C33ed753Cc";
  const privateKey1 =
    "0xc9c0da9974ac1278e4896f2590ad6766f07dd1ce1d19f14d71302da37b490434";
  const signer1 = new Wallet(privateKey1);

  const address2 = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey2 =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signer2 = new Wallet(privateKey2);

  const authorize = true;

  const from1 = address2;
  const to1 = address1;
  const data1 = await sdk.create(signer1, from1, to1, authorize);
  const eventLog1 = {
    data: data1,
    receipt: { from: from1 },
  };

  const from2 = address1;
  const to2 = address2;
  const data2 = await sdk.create(signer2, from2, to2, authorize);
  const eventLog2 = {
    data: data2,
    receipt: { from: from2 },
  };

  let result;
  try {
    result = sdk.organize([eventLog1, eventLog2]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, { [to1.toLowerCase()]: from1.toLowerCase() });
});

test("call organize with a payload where 'to' address is already a 'from' address", async (t) => {
  const address1 = "0x82e6F643A7613458E18fa1E80624d0C33ed753Cc";
  const privateKey1 =
    "0xc9c0da9974ac1278e4896f2590ad6766f07dd1ce1d19f14d71302da37b490434";
  const signer1 = new Wallet(privateKey1);

  const address2 = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey2 =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signer2 = new Wallet(privateKey2);

  const authorize = true;

  const from1 = address1;
  const to1 = address2;
  const data1 = await sdk.create(signer2, from1, to1, authorize);
  const eventLog1 = {
    data: data1,
    receipt: { from: from1 },
  };

  const from2 = address2;
  const to2 = address1;
  const data2 = await sdk.create(signer1, from2, to2, authorize);
  const eventLog2 = {
    data: data2,
    receipt: { from: from2 },
  };

  let result;
  try {
    result = sdk.organize([eventLog1, eventLog2]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, { [to1.toLowerCase()]: from1.toLowerCase() });
});

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
    const result = sdk.validate(data, from);
    t.is(result.from, from.toLowerCase());
    t.is(result.to, to.toLowerCase());
    t.false(result.authorize);
    t.truthy(result);
  } catch (err) {
    t.fail(err.message);
  }
});

test("attempt delegation but claim wrong 'to' address", async (t) => {
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signerTo = new Wallet(privateKey);
  const from = "0x0000000000000000000000000000000000000001";
  const authorize = true;

  const fakeTo = "0x0000000000000000000000000000000000000000";
  const data = await sdk.create(signerTo, from, fakeTo, authorize);
  t.is(data.length, 3);
  t.true(parseInt(data[2].slice(-1), 16) === 1);

  t.throws(() => sdk.validate(data, from));
});

test("attempt delegation but claim wrong 'authorize' flag", async (t) => {
  const to = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signerTo = new Wallet(privateKey);
  const from = "0x0000000000000000000000000000000000000001";
  const authorize = true;

  let [data0, data1, data2] = await sdk.create(signerTo, from, to, authorize);
  data2 = data2.slice(0, -1) + "0";
  t.false(parseInt(data2.slice(-1), 16) === 1);

  t.throws(() => sdk.validate([data0, data1, data2], from));
});

test("attempt delegation but claim wrong 'from' flag", async (t) => {
  const to = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signerTo = new Wallet(privateKey);
  const from = "0x0000000000000000000000000000000000000001";
  const authorize = true;

  let data = await sdk.create(signerTo, from, to, authorize);

  const fakeFrom = "0x0000000000000000000000000000000000000000";
  t.throws(() => sdk.validate([data0, data1, data2], fakeFrom));
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
    const result = sdk.validate(data, from);
    t.is(result.from, from.toLowerCase());
    t.is(result.to, to.toLowerCase());
    t.true(result.authorize);
    t.truthy(result);
  } catch (err) {
    t.fail(err.message);
  }
});
