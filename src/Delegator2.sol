 // SPDX-License-Identifier: AGPL-3.0
 // github.com/attestate/delegator2
 pragma solidity ^0.8.13;

 contract Delegator2 {
   /*
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
               string name     = "kiwinews";
               string version  = "1.0.0";
               uint256 chainId = 1;
               address target  = 0x...(this contract's address)
               bytes32 salt    =
                0xfe7a9d68e99b6942bb3a36178b251da8bd061c20ed1e795207ae97183b590e5b;
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
           "from" property on the event log's transaction receipt.
     1. We consider a key revocation by `address from` of `address to` valid if:
       1.1 we can "ecrecover" `address to` (the first 20 bytes of `data[2]`)
           from `data[0]` and `data[1]` (also an EIP-2098 "Compact Signature")
           using the above-mentioned procedure; AND
       1.2 if the last bit (`bool authorize`) of `data[2]` is "0"; AND
       1.3 if the `address from` of the `Authorization` message appears as the
           "from" property on the event log's transaction receipt.
     

     Rationale
     ---------

     - In a prior iteration (Delegator.sol) we allowed anyone to "etch" a
       delegation to `address to` without requiring an ecrecover-able signature
       that yields `to`'s address. We've found, however, that this opens a
       vector for anyone to impersonate or front-run delegations. Hence by
       directing a signed delegation to `address from`, this makes stealing the
       payload useless for front-runners and verifiably authentic.
     - In an even earlier version of the Kiwi News Protocol we had considered
       storing delegations on our set reconciliation network. However, it would
       have allowed a malicious node operator to back-date a delegation message
       or its revocation - which could have interfered with the network's
       reconciliation algorithm.


     Limitations
     -----------

     - If an indexer observes multiple valid delegations from to one `address
       to` to multiple different `address from`, then they must consider the
       latest delegation the user's intention.
     - Similarly, multiple occurrences between one distinct `address to` and an
       `address from`, an indexer must consider the latest delegation the user's
       intention.


     Considerations
     --------------

     - Indexers are recommended to ignore valid delegations where the `address
       from`, `address to` and the transaction receipt's "from" property are the
       same address.
     - The transaction running the eth-call and its payload are not replayable on
       other chains as the chain ID is part of the EIP-712 domain separator. They
       are neither replayable on the same chain as both the verifying contract's
       address and its version are part of the separator too.


    */
   event Delegate(bytes32[3] data);
   function etch(bytes32[3] calldata data) external {
     emit Delegate(data);
   }
 }
