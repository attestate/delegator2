Name:         Delegator2
Description:  Key authority event log for Kiwi News Protocol
Requires:     EIP-712, EIP-2098


Instructions
------------

Any caller may call `etch` such that:

  1. `data[0]` and `data[1]` are respectively the first and the second
      part of an EIP-2098 "Compact Signature."
  2. `data[2]` is a `bytes32` segmented into:

    0x4E774b8530d6f3A21C449A6f0D9A1229aB2b8C47000000000000000000000001
      ^                                      ^^                     ^^
      |                                      ||                     ||
      .--------------------------------------..---------------------.|
      (a bytes20-long `address to`)             (empty)              |
                                                                     |
                                                (the `bool authorize`)

    2.1 `address to` is the entity the transaction's sender (`address
        from`) is delegating authority or revoking it.
    2.2 If `bool authorize` is `true` it means `address from` is
        delegating their authority to `address to`.
    2.3 If `bool authorize` is `false` it means `address from` is revoking
        their authority from `address to`.
  3. The signature in `data[0]` and `data[1]` must be signed according to
     EIP-712.
    3.1 The message is conceptually generated using the following struct:

        struct Authorization {
          address from;
          bool authorize;
        }

    3.2 And an EIP-712 domain separator using the following types and
        values:

        struct EIP712Domain {
          string name               = "kiwinews";
          string version            = "1.0.0";
          uint256 chainId           = <chainId>;
          address verifyingContract = 0x418910fef46896eb0bfe38f656e2f7df3eca7198;
          bytes32 salt              = 0xfe7a9d68e99b6942bb3a36178b251da8bd061c20ed1e795207ae97183b590e5b;
        }

    3.3 The message is then signed by `address to` and tucked into a
        transaction signed by `address from` and sent to the network.


Interpretation:
---------------

0. We consider a key delegation from `address from` to `address to` valid
   if:
  0.1 we can "ecrecover" `address to` (the first 20 bytes of `data[2]`)
      from `data[0]` and `data[1]` (an EIP-2098 "Compact Signature") using
      the above-mentioned procedure; AND
  0.2 if the last bit (`bool authorize`) of `data[2]` is "1"; AND
  0.3 if the `address from` of the `Authorization` message appears as the
      "sender" parameter on the event log.
1. We consider a key revocation by `address from` of `address to` valid if:
  1.1 we can "ecrecover" `address to` (the first 20 bytes of `data[2]`)
      from `data[0]` and `data[1]` (also an EIP-2098 "Compact Signature")
      using the above-mentioned procedure; AND
  1.2 if the last bit (`bool authorize`) of `data[2]` is "0"; AND
  1.3 if the `address from` of the `Authorization` message appears as the
      "sender" parameter on the event log.


Organize
--------

We receive all delegations in an ordered list, validate each according to the
above-outlined rules and then organize the them according to the following
rules:

  - Each `address from` can delegate to multiple `address to`.
  - Each `address to` can only be delegated to by one `address from`.
  - `address to` and `address from` are never the same.
  - An `address to` cannot become an `address from` and vice versa.
  - The first delegation from an `address from` to an `address to` is
    considered the user's true intent.
  - A revocation is only valid if there has been a prior delegation.
  - A delegation after a revocation does not make a key usable again.

This organization produces an object mapping of each `address to` to the
`address from` of the latest valid delegation. If a delegation is invalid, it
is ignored. 

If an `address from` tries to delegate to an `address to` that has already been
delegated to, we ignore the new delegation. 

If an `address from` revokes its delegation to an `address to`, we remove the
existing delegation. 

If an `address from` tries to delegate to an `address to` after revoking its
delegation to that address, the function ignores the new delegation. This
ensures that a delegation after a revocation does not make a key usable again.

If an `address from` tries to delegate to an `address to` that has already been
used as an `address from`, or if an `address to` tries to become an `address
from`, the function ignores the new delegation. This ensures that an `address
to` cannot become an `address from` and vice versa, maintaining the integrity
of the delegation process.


Rationale
---------

Following is an explaination on why we authorize both:

1. The `address from` to forward privileges to `address to` by signing a
transaction containing the `address to` in calldata; and

2. the `address to` to accept `address from`'s privileges by signing an EIP-712
message including `address from`.

For (1), we require `address from` to sign `address to` as to authorize
`address to` with the Kiwi News node. It confirms that `address from` allows
adding `address to`.

Similarly, for (2), we require `address to` to sign an EIP-712 payload
including `address from` as to authorize for all future messages in the Kiwi
News Protocol that if we ecrecover `address to` from a message's signature,
then we are certain about which `address from` it must be credited to. 

This primarily has to do with how the Kiwi News Protocol constructs messages
where we only sign the payload of `href`, `title` and `timestamp` with `address
to` but not to which "identity" to credit the contribution to. As including the
`address to` as a byte payload in a tranaction's call data (unauthorized by
`address to` through a signature), would allow an impersonator to frontrun the
`etch` transaction and furthermore impersonate the original user's transaction.
The frontrunner could manage to register a user's `address to` with then all
future signed messages of `address to`-signed messages being credited to the
frontrunner and not the original user (assuming the user would notice at
first).

Farcaster actually prevents this case by requiring each protocol message to
include essentially the "fid" or or "fid owner address." That is because in
this case they force `address to` to make a claim on which `address from` they
represent which can then be cross-validated with the claim from `address
from`'s onchain claim.

It is, hence, necessary to sign in both directions, however, it would be
possible to just sign from `address from` to `address to` is the protocol
messages then included a signed claim of `address to` to which `address from`
they represent.

Finally, there are two further points of rationale:

- In an even earlier version of the Kiwi News Protocol we had considered
  storing delegations on our set reconciliation network. However, it would
  have allowed a malicious node operator to back-date a delegation message
  or its revocation - which could have interfered with the network's
  reconciliation algorithm.
- In a prior interation of the organization procedure we considered always
  using the latest delegations and revocations as the user's intent. However,
  this increased complexity at the Kiwi News Protocol node level, as then e.g.
  an `address to`, priorly assigned to an `address from_1` could suddenly
  switch to `address from_2`. As those addresses may be represented by ENS
  names, it would be confusing to users if a post suddenly changed author.


Considerations
--------------

- Indexers are recommended to ignore valid delegations where the `address
  from`, `address to` and the event's "sender" parameter are the
  same address to avoid cycles.
- The transaction running the eth-call and its payload are not replayable on
  other chains as the chain ID is part of the EIP-712 domain separator. They
  are neither replayable on the same chain as both the verifying contract's
  address and its version are part of the separator too.
- Using CREATE2, the system may be run on multiple chains in parallel. However,
  a total ordering of all transactions from those systems must exist. Hence, if
  say one such contract is run on ETH mainnet and another one on an L2, a total
  order may be producable by virtue of the L2 using L1 storage. This seems to
  hold as well for two L2s considering that their state access on L2 is
  happening in atomic transactions over which we can create a total order.
- Other applications that require a similar system may use the delegator2
  contract but with a different EIP-712 domain separator. Kiwi News Protocol
  would simply consider those payloads invalid, which can be OK if it doesn't
  waste too much compute spent on undirected validation.


Deployment
----------

- CREATE2 is used to deploy delegator2 to a deterministic address independent
  of chainId.
- `DEPLOYER`: 0x0000000000ffe8b47b3e2130213b802212439497
- `SALT`: 0x0000000000000000000000000000000000000000f00df00df00df00df00df00d
- `INITCODE`: 0x608060405234801561001057600080fd5b5060e18061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80630baa83f814602d575b600080fd5b603c60383660046076565b603e565b005b7f9fcbf2ac7d9825115ae81812d10efa7fce04fcc9ca46f1d416aba53cdea8483e81604051606b9190609c565b60405180910390a150565b600060608284031215608757600080fd5b82606083011115609657600080fd5b50919050565b6060818101908383379291505056fea2646970667358221220a023699f314fe81dbaaa4e917b161d13bc252584f8e3602dca37be52f9e8b5a364736f6c63430008110033
- `ADDRESS`: 0x418910fef46896eb0bfe38f656e2f7df3eca7198
- Deployed to:
  - Optimism


SDK.js
------

  (in the ./sdk folder)

  Installation
  ------------

  Install via npm. Consider that ethers is a peer dependency.

    npm install @attestate/delegator2 ethers@^5.7.0


  Note:

    If you're concerned about bundle size, consider installing the respective
    `@ethersproject` sub packages as defined in `./sdk/package.json`'s
    'dependencies'.


  Usage
  -----

  You can import the create, validate and other functions from the package like
  so:

    import { create, validate } from '@attestate/delegator2';


  validate(data, from)
  --------------------

  This function validates the data from the event `Delegate(bytes32[3], address)` and
  checks if the from address matches the "sender" parameter from the event log.

  Parameters

    - `bytes32[3] data`: The `data` from the `Delegate(bytes32[3], address)` event.
    - `address from`: The "sender" parameter from the event log.

  Returns

    - An object containing the following properties:
      - `address from`: The address which delegates authority.
      - `address to`: The address to which authority is being delegated.
      - `bool authorize`: A boolean value indicating whether the operation is a
        delegation (`true`) or a revocation (`false`).


  create(signer, from, to, authorize)
  -----------------------------------

  This function creates a delegation or revocation message.

  Parameters

    - `Wallet signer`: An ethers.js signer instance. This is used to sign the
      EIP-712 typed data.
    - `address from`: The address of the transaction sender.
    - `address to`: The address to which authority is being delegated.
    - `bool authorize`: A boolean value indicating whether the operation is a
      delegation (true) or a revocation (false).

  Returns

    - An array of three bytes32 strings, each prefixed with 0x. These strings
      represent the following (more details? See description of protocol
      above):
      - The first part of the signed message.
      - The second part of the signed message.
      - The address to which authority is being delegated or revoked, followed
        by a flag indicating the operation (1 for delegation, 0 for
        revocation).


  organize(payloads, domain = EIP712_DOMAIN)
  ------------------------------------------

  This function organizes a list of payloads into a delegations object.

  Parameters

    - `Object[] payloads`: An array of objects, each containing data from the
      `Delegate(bytes32[3], address)` event and a sender address from the event.
    - `string domain`: The EIP-712 domain. Defaults to the internal
      EIP712_DOMAIN.

  Returns

    - `Object`: An object mapping 'to' addresses to 'from' addresses. The
      'from' address must always be part of the allowlist. Both 'to' and 'from'
      are Ethereum addresses. All included addresses are checksummed.

  Notes

    - Applies the "Organize" rules of the protocol as outlined above.
    - The function logs messages for each skipped payload and the reason for
      skipping.


  eligible(allowlist, delegations, address)
  -----------------------------------------

  This function checks if an Ethereum address is CURRENTLY eligible based on
  the allowlist and delegations.

  Parameters

    - `Set allowlist`: A list of Ethereum addresses that have minted the Kiwi
      News NFT. Addresses must be check-summed.
    - `Object delegations`: An object mapping 'to' addresses to 'from'
      addresses. The 'from' address must always be part of the allowlist. Both
      'to' and 'from' are Ethereum addresses. This object is expected to be the
      result of the 'organize' function and all included addresses must be
      checksummed.
    - `string address`: The Ethereum address to check for eligibility. Must be
      check-summed.

  Returns

    - (string|false): Returns the eligible address if found in the allowlist or
      delegations, otherwise returns false.


  eligibleAt(accounts, delegations, params = {address, validationTime, tokenId})
  ------------------------------------------------------------------------------

  This function checks if an Ethereum address is (or has been) eligible based
  on the accounts and delegations.

  Parameters

    - `Object accounts`: An object consisting of holder information. Every key
      is an Ethereum address that leads to an object with the properties. Below
      is how we expect the accounts object to look like:

      {
        [address]: {
          tokens: {
           [tokenId] : [{
             start: <decimal-unix-timestamp>,
             end: <decimal-unix-timestamp>,
           },
           //...
           ],
           //...
          },
          balance: <decimal-number-of-kiwi-passes-held>
        },
        ...
      }

    - `Object delegations`: An object mapping 'to' addresses to 'from'
      addresses. The 'from' address must always be part of the allowlist. Both
      'to' and 'from' are Ethereum addresses. This object is expected to be the
      result of the 'organize' function and all included addresses must be
      checksummed.
    - `Object pararms`:
      - `string address`: The Ethereum address to check for eligibility. Must be
      check-summed.
      - `Date validationTime`: The date at which the eligibility check should be
      made at.
      - `string tokenId` (optional): The tokenId with which a user makes their
      claim for eligibility. Please note: After v0.4.0, we made the `eligibleAt`
      function more precise at evaluating token ownership claims. Omitting the
      `string tokenId` will evaluate eligibility based on the imprecise v0.4.0
      logic, whereas submitting the tokenId will precisely evaluate the claim


  Returns

    - (string|false): Returns the eligible address if found in the allowlist or
      delegations, otherwise returns false.


License
-------

Contract licensed as SPDX-License-Identifier: AGPL-3.0
SDK licensed as SPDX-License-Identifier: GPL-3.0-only
