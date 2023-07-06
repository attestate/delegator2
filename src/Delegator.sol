// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.13;

contract Delegator {
  //
  // Delegator 
  // ---------
  //
  // Delegator event log for Kiwi News. 
  //
  //
  // Protocol
  // -------------
  //
  // - By sending a transaction to call `etch`, a user can delegate posting
  // authority from their custody key (`address msg.sender`) to e.g. a wallet
  // stored within a Kiwi News Protocol application (`address to`).
  // - To "approve" of `address to`, the user sets `bool authorize` to `true`.
  // - To "revoke" `address to` of any future posting authority, a user sets
  // `bool authorize` to false.
  // - A user must not "delegate" posting authority to its own custody address.
  // - A user "etch" any permutation of states {`address to`, `bool authorize`}
  // repeatedly with the Kiwi News Protocol interpreting the latest write as
  // the user's intention.
  //
  struct Authorization {
    address to;
    bool authorize;
  }
  error ErrLoop();
  event Delegate(address to, bool authorize);
  function etch(bytes32 data) external {
    address to = address(uint160(uint256(data >> 96)));
    bool authorize = (uint256(data) & 1) == 1;
    if (msg.sender == to) revert ErrLoop();
    emit Delegate(to, authorize);
  }
}
