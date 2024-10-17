import { getAddress } from "@ethersproject/address";
import { verifyTypedData } from "@ethersproject/wallet";
import { splitSignature } from "@ethersproject/bytes";

import log from "./logger.mjs";

const EIP712_DOMAIN = {
  name: "kiwinews",
  version: "1.0.0",
  chainId: 10,
  verifyingContract: "0x08b7ecfac2c5754abafb789c84f8fa37c9f088b0",
  salt: "0xfe7a9d68e99b6942bb3a36178b251da8bd061c20ed1e795207ae97183b590e5b",
};

export function eligible(allowlist, delegations, address) {
  address = getAddress(address);
  const allowed0 = allowlist.has(address);
  if (allowed0) return address;

  const from = delegations[address];
  if (!from) return false;

  const allowed1 = allowlist.has(from);
  if (allowed1) return from;

  return false;
}

// NOTE: The accounts object must be structured as follows:
//
// {
//   [address]: {
//     start: <decimal-unix-timestamp>,
//     end: <decimal-unix-timestamp>,
//     balance: <decimal-number-of-kiwi-passes-held>
//   },
//   ...
// }
//
// `start` is the timestamp of receiving the first Kiwi Pass NFT and end is the
// unix timestamp when no Kiwi Pass NFTs are held anymore.
//
// Additionally, this function can also validate the eligibly of an address for
// a given historical timestamp. In this case, `validationTime` is set to a
// date in the past.
export function eligibleAt(
  accounts,
  delegations,
  address,
  validationTime = new Date()
) {
  address = getAddress(address);
  const account0 = accounts[address];
  if (
    account0 &&
    account0.balance >= 0 &&
    (account0.end === undefined || account0.end > validationTime) &&
    account0.start < validationTime
  ) {
    return address;
  }

  const from = delegations[address];
  if (!from) return false;

  const account1 = accounts[from];
  if (
    account1 &&
    account1.balance >= 1 &&
    (account1.end === undefined || account1.end > validationTime) &&
    account1.start < validationTime
  ) {
    return from;
  }

  return false;
}

export function organize(payloads, domain = EIP712_DOMAIN) {
  const delegations = {};
  const revoked = new Set();
  const froms = new Set();
  const tos = new Set();

  for (const { data, receipt } of payloads) {
    let delegation;
    try {
      delegation = validate(data, receipt.from, domain);
    } catch (err) {
      log(`Invalid delegation: ${JSON.stringify(err.message)}`);
      continue;
    }

    const from = getAddress(delegation.from);
    const to = getAddress(delegation.to);
    const auth = delegation.authorize;

    if (froms.has(to)) {
      log(`"to" address is already a "from" address: ${to}`);
      continue;
    }

    if (tos.has(from)) {
      log(`"from" address is already a "to" address: ${from}`);
      continue;
    }

    if (from === to) {
      log(`"from" and "to" are equal: ${from}`);
      continue;
    }

    if (!auth && !delegations[to]) {
      log(
        `Delegation is a revocation and there is no existing delegation: ${to}`
      );
      continue;
    }

    if (!auth) {
      revoked.add(to);
      delete delegations[to];
      log(`Delegation is a revocation: ${to}`);
      continue;
    }

    if (delegations[to]) {
      log(`Existing delegation for the "to" address: ${to}`);
      continue;
    }

    if (revoked.has(to)) {
      log(`"to" address has been revoked: ${to}`);
      continue;
    }

    delegations[to] = from;
    froms.add(from);
    tos.add(to);
  }

  return delegations;
}

export function validate(data, from, domain = EIP712_DOMAIN) {
  from = getAddress(from);
  // NOTE: We're lower casing the address here before casting it to a checksum
  // address as `getAddress` throws on mixed case.
  // https://docs.ethers.org/v5/api/utils/address/#utils-getAddress
  const to = getAddress(data[2].slice(0, 42).toLowerCase());

  const authorize = parseInt(data[2].slice(-1), 16) === 1;
  const message = {
    from,
    authorize,
  };
  const types = {
    Authorization: [
      { name: "from", type: "address" },
      { name: "authorize", type: "bool" },
    ],
  };
  const signature = data[0] + data[1].slice(2);
  const recoveredTo = getAddress(
    verifyTypedData(domain, types, message, signature)
  );

  if (to !== recoveredTo) {
    throw new Error("Recovered address and claimed address aren't equal");
  }

  return {
    from,
    to,
    authorize,
  };
}

export async function create(
  signer,
  from,
  to,
  authorize,
  domain = EIP712_DOMAIN
) {
  from = getAddress(from);
  to = getAddress(to);
  const message = {
    from,
    authorize,
  };
  const types = {
    Authorization: [
      { name: "from", type: "address" },
      { name: "authorize", type: "bool" },
    ],
  };
  const signature = await signer._signTypedData(domain, types, message);
  const { compact } = splitSignature(signature);
  const data0 = "0x" + compact.slice(2, 66);
  const data1 = "0x" + compact.slice(66);
  const flag = authorize ? "1" : "0";
  return [data0, data1, `${to}00000000000000000000000${flag}`];
}
