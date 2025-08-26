// @format
import test from "ava";
import { getAddress } from "@ethersproject/address";
import { Wallet } from "@ethersproject/wallet";

import * as sdk from "../src/index.mjs";

test("should return true when validationTime is within a period with no end time", (t) => {
  const address = "0x0000000000000000000000000000000000000001";
  const tokenId = 5;
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        [tokenId]: [
          {
            start: 123,
          },
        ],
      },
    },
  };
  const delegations = {};
  const validationTime = 124;

  t.true(
    sdk._eligibleAt(accounts, delegations, { address, tokenId, validationTime })
  );
});

test("should return true when address is resolved via delegations and period matches", (t) => {
  const delegatedAddress = "0x0000000000000000000000000000000000000002";
  const originalAddress = "0x0000000000000000000000000000000000000001";
  const tokenId = 5;
  const accounts = {
    [originalAddress]: {
      balance: 1,
      tokens: {
        [tokenId]: [
          {
            start: 123,
            end: 124,
          },
        ],
      },
    },
  };
  const delegations = {
    [delegatedAddress]: originalAddress,
  };
  const validationTime = 123;

  t.true(
    sdk._eligibleAt(accounts, delegations, {
      address: delegatedAddress,
      tokenId,
      validationTime,
    })
  );
});

test("should return false when validationTime doesn't match the period of another tokenId", (t) => {
  const address = "0x0000000000000000000000000000000000000001";
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        5: [
          {
            start: 123,
            end: 124,
          },
        ],
        6: [
          {
            start: 125,
            end: 126,
          },
        ],
      },
    },
  };
  const delegations = {};
  const validationTime = 123;
  const tokenId = 6;

  t.false(
    sdk._eligibleAt(accounts, delegations, { address, tokenId, validationTime })
  );
});

test("should return true for accounts if validation time is within the inclusive range of token period", (t) => {
  const address = "0x0000000000000000000000000000000000000001";
  const tokenId = 5;
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        [tokenId]: [
          {
            start: 123,
            end: 124,
          },
        ],
      },
    },
  };
  const delegations = {};
  const validationTime = 123;

  t.true(
    sdk._eligibleAt(accounts, delegations, { address, tokenId, validationTime })
  );
});

test("should return false for accounts if tokenId is not owned by the account", (t) => {
  const address = "0x0000000000000000000000000000000000000001";
  const tokenId = 6;
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        5: [
          {
            start: 123,
            end: 124,
          },
        ],
      },
    },
  };
  const delegations = {};
  const validationTime = 123;

  t.false(
    sdk._eligibleAt(accounts, delegations, { address, tokenId, validationTime })
  );
});

test("extractLegacyObject handles ongoing token possession correctly", (t) => {
  const accounts = {
    "0x0000000000000000000000000000000000000001": {
      balance: 1,
      tokens: {
        28: [{ start: 1694686439 }],
        "mainnet-tokenId-1682092739": [{ start: 1682092739, end: 1694676249 }],
      },
    },
  };
  const address = "0x0000000000000000000000000000000000000001";

  const expected = {
    balance: 1,
    start: 1682092739,
  };

  const result = sdk.extractLegacyObject(accounts, address);

  t.deepEqual(result, expected);
});

test("throws if address not found in accounts", (t) => {
  const accounts = {};
  const address = "0x0000000000000000000000000000000000000001";

  const error = t.throws(() => {
    sdk.extractLegacyObject(accounts, address);
  });

  t.is(error.message, "Address not found in accounts");
});

test("returns undefined for highest end if only start is present", (t) => {
  const accounts = {
    "0x0000000000000000000000000000000000000001": {
      tokens: {
        1: [{ start: 1 }],
      },
      balance: 1,
    },
  };
  const address = "0x0000000000000000000000000000000000000001";

  const result = sdk.extractLegacyObject(accounts, address);

  t.deepEqual(result, { balance: 1, start: 1 });
  t.is(result.end, undefined, "end should explicitly be undefined");
});

test("correctly extracts period from tokens with overlapping periods", (t) => {
  const accounts = {
    "0x0000000000000000000000000000000000000001": {
      tokens: {
        1: [
          { start: 1, end: 2 },
          { start: 2, end: 3 },
        ],
      },
      balance: 1,
    },
  };
  const address = "0x0000000000000000000000000000000000000001";

  const result = sdk.extractLegacyObject(accounts, address);

  t.deepEqual(result, { balance: 1, start: 1, end: 3 });
});

test("correctly extracts period from multiple tokens with non-overlapping periods", (t) => {
  const accounts = {
    "0x0000000000000000000000000000000000000001": {
      tokens: {
        1: [{ start: 1, end: 2 }],
        2: [{ start: 4, end: 5 }],
      },
      balance: 2,
    },
  };
  const address = "0x0000000000000000000000000000000000000001";

  const result = sdk.extractLegacyObject(accounts, address);

  t.deepEqual(result, { balance: 2, start: 1, end: 5 });
});

test("correctly handles tokens with identical start and end times", (t) => {
  const accounts = {
    "0x0000000000000000000000000000000000000001": {
      tokens: {
        1: [{ start: 1, end: 1 }],
        2: [{ start: 2, end: 2 }],
      },
      balance: 2,
    },
  };
  const address = "0x0000000000000000000000000000000000000001";

  const result = sdk.extractLegacyObject(accounts, address);

  t.deepEqual(result, { balance: 2, start: 1, end: 2 });
});

test("should return valid delegation's from", (t) => {
  const address = "0x0000000000000000000000000000000000000001";
  const to = "0x0000000000000000000000000000000000001337";
  const allowlist = new Set([address]);
  const delegations = {
    [to]: address,
  };

  t.is(address, sdk.eligible(allowlist, delegations, to));
});

test("is not in allowlist and not in delegations", (t) => {
  const allowlist = new Set();
  const address = "0x0000000000000000000000000000000000000001";
  const delegations = {
    "0x0000000000000000000000000000000000001337":
      "0x0000000000000000000000000000000000000666",
  };

  t.false(sdk.eligible(allowlist, delegations, address));
});

test("is delegated to address but from isn't in allowlist", (t) => {
  const allowlist = new Set();
  const address = "0x0000000000000000000000000000000000001337";
  const delegations = {
    [address]: "0x0000000000000000000000000000000000000666",
  };

  t.false(sdk.eligible(allowlist, delegations, address));
});

test("eligible should return the address (case-independent) if it is in the allowlist", (t) => {
  const list = ["0x0f6A79A579658E401E0B81c6dde1F2cd51d97176"];
  const allowlist = new Set(list);
  const delegations = {};

  const result = sdk.eligible(allowlist, delegations, list[0].toLowerCase());

  t.is(result, list[0]);
});

test("eligible returns false if address isn't check-summed properly", (t) => {
  const list = ["0x0f6A79A579658E401E0B81c6dde1F2cd51d97176".toLowerCase()];
  const allowlist = new Set(list);
  const delegations = {};

  const result = sdk.eligible(allowlist, delegations, list[0]);

  t.false(result);
});

test("should return false for accounts if validation time is after account termination", (t) => {
  const address = "0x0000000000000000000000000000000000000001";
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        5: [
          {
            start: 123,
            end: 124,
          },
        ],
      },
    },
  };
  const delegations = {};

  const validationTime = 124;
  t.false(sdk.eligibleAt(accounts, delegations, { address, validationTime }));
});

test("should return false for accounts if validation time is before account creation", (t) => {
  const address = "0x0000000000000000000000000000000000000001";
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        5: [
          {
            start: 123,
          },
        ],
      },
    },
  };
  const delegations = {};

  const validationTime = 122;
  t.false(sdk.eligibleAt(accounts, delegations, { address, validationTime }));
});

test("should return false for delegation if validation time is after account termination", (t) => {
  const address = "0x0000000000000000000000000000000000000001";
  const to = "0x0000000000000000000000000000000000001337";
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        5: [
          {
            start: 123,
            end: 124,
          },
        ],
      },
    },
  };
  const delegations = {
    [to]: address,
  };

  const validationTime = 124;
  t.false(
    sdk.eligibleAt(accounts, delegations, { address: to, validationTime })
  );
});

test("should return false for delegation if validation time is before account creation", (t) => {
  const address = "0x0000000000000000000000000000000000000001";
  const to = "0x0000000000000000000000000000000000001337";
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        5: [
          {
            start: 123,
          },
        ],
      },
    },
  };
  const delegations = {
    [to]: address,
  };

  const validationTime = 122;
  t.false(
    sdk.eligibleAt(accounts, delegations, { address: to, validationTime })
  );
});

test("should return valid delegation's from for eligibleAt", (t) => {
  const address = "0x0000000000000000000000000000000000000001";
  const to = "0x0000000000000000000000000000000000001337";
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        5: [
          {
            start: 123,
          },
        ],
      },
    },
  };
  const delegations = {
    [to]: address,
  };

  t.is(address, sdk.eligibleAt(accounts, delegations, { address: to }));
});

test("is not in accounts and not in delegations", (t) => {
  const accounts = {};
  const address = "0x0000000000000000000000000000000000000001";
  const delegations = {
    "0x0000000000000000000000000000000000001337":
      "0x0000000000000000000000000000000000000666",
  };

  t.false(sdk.eligibleAt(accounts, delegations, { address }));
});

test("is delegated to address but from isn't in accounts", (t) => {
  const accounts = {};
  const address = "0x0000000000000000000000000000000000001337";
  const delegations = {
    [address]: "0x0000000000000000000000000000000000000666",
  };

  t.false(sdk.eligibleAt(accounts, delegations, { address }));
});

test("eligibleAt should return the address (case-independent) if it is in the accounts", (t) => {
  const address = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        5: [
          {
            start: 123,
          },
        ],
      },
    },
  };
  const delegations = {};

  const result = sdk.eligibleAt(accounts, delegations, {
    address: address.toLowerCase(),
  });

  t.is(result, address);
});

test("eligibleAt returns false if address isn't check-summed properly", (t) => {
  const address = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176".toLowerCase();
  const accounts = {
    [address]: {
      balance: 1,
      tokens: {
        5: [
          {
            start: 123,
          },
        ],
      },
    },
  };
  const delegations = {};

  const result = sdk.eligibleAt(accounts, delegations, { address });

  t.false(result);
});

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
    sender: to,
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
    sender: from,
  };

  const to1 = address1;
  const data1 = await sdk.create(signer1, from, to1, true);
  const log1 = {
    data: data1,
    sender: from,
  };

  let result;
  try {
    result = sdk.organize([log0, log1]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, {
    [getAddress(to0)]: getAddress(from),
    [getAddress(to1)]: getAddress(from),
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
    sender: from,
  };

  const data2 = await sdk.create(signer, from, to, false);
  const log2 = {
    data: data2,
    sender: from,
  };

  const data3 = await sdk.create(signer, from, to, true);
  const log3 = {
    data: data3,
    sender: from,
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
    sender: from1,
  };

  const data2 = await sdk.create(signer, from2, to, true);
  const log2 = {
    data: data2,
    sender: from2,
  };

  let result;
  try {
    result = sdk.organize([log1, log2]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, { [getAddress(to)]: getAddress(from1) });
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
    sender: from,
  };

  const data2 = await sdk.create(signerTo, from, to, false);
  const log2 = {
    data: data2,
    sender: from,
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
    sender: from,
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
    sender: from1,
  };

  const from2 = address1;
  const to2 = address2;
  const data2 = await sdk.create(signer2, from2, to2, authorize);
  const eventLog2 = {
    data: data2,
    sender: from2,
  };

  let result;
  try {
    result = sdk.organize([eventLog1, eventLog2]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, { [getAddress(to1)]: getAddress(from1) });
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
    sender: from1,
  };

  const from2 = address2;
  const to2 = address1;
  const data2 = await sdk.create(signer1, from2, to2, authorize);
  const eventLog2 = {
    data: data2,
    sender: from2,
  };

  let result;
  try {
    result = sdk.organize([eventLog1, eventLog2]);
  } catch (err) {
    t.fail(err.message);
  }
  t.deepEqual(result, { [getAddress(to1)]: getAddress(from1) });
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
    t.is(result.from, getAddress(from));
    t.is(result.to, getAddress(to));
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
    t.is(result.from, getAddress(from));
    t.is(result.to, getAddress(to));
    t.true(result.authorize);
    t.truthy(result);
  } catch (err) {
    t.fail(err.message);
  }
});

test("enter empty signature", async (t) => {
  const to = "0x0f6A79A579658E401E0B81c6dde1F2cd51d97176";
  const privateKey =
    "0xad54bdeade5537fb0a553190159783e45d02d316a992db05cbed606d3ca36b39";
  const signerTo = new Wallet(privateKey);
  const from = "0x0000000000000000000000000000000000000001";
  const authorize = true;

  const data = await sdk.create(signerTo, from, to, authorize);
  data[0] =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  data[1] =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  t.is(data.length, 3);
  t.true(parseInt(data[2].slice(-1), 16) === 1);

  const result = sdk.organize([{ data, sender: from }]);
  t.deepEqual(result, {});
});
