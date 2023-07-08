import { utils } from "ethers";

const EIP712_DOMAIN = {
  name: "kiwinews",
  version: "1.0.0",
  chainId: 1,
  // TODO: change
  verifyingContract: "0x0000000000000000000000000000000000000000",
  salt: "0xfe7a9d68e99b6942bb3a36178b251da8bd061c20ed1e795207ae97183b590e5b",
};

export async function validate(data, from, domain = EIP712_DOMAIN) {
  const to = data[2].slice(0, 42);
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
  const recoveredTo = utils.verifyTypedData(domain, types, message, signature);

  if (to.toLowerCase() !== recoveredTo.toLowerCase()) {
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
  const { compact } = utils.splitSignature(signature);
  const data0 = "0x" + compact.slice(2, 66);
  const data1 = "0x" + compact.slice(66);
  const flag = authorize ? "1" : "0";
  return [data0, data1, `${to}00000000000000000000000${flag}`];
}
