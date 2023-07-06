// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Delegator.sol";

contract DelegatorTest is Test {
  bytes32 immutable LOCK = bytes32(uint(0x1));
  Delegator public d;
  event Delegate(address to, bool authorize);
  struct Authorization {
    address to;
    bool authorize;
  }
  function setUp() public {
    d = new Delegator();
  }
  function testEtch() public {
    address to = 0xebB15487787cBF8Ae2ffe1a6Cca5a50E63003786;
    bytes32 data = bytes32(abi.encodePacked(to));
    data = data | LOCK;
    vm.expectEmit(true, true, true, true);
    emit Delegate(to, true);
    uint256 gasBefore = gasleft();
    d.etch(data);
    uint256 gasAfter = gasleft();
    assertEq(gasBefore-gasAfter, 0);
  }
}
