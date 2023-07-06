// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Delegator.sol";

contract DelegatorTest is Test {
  bytes32 immutable LOCK = bytes32(uint(0x1));
  Delegator public d;
  event Delegate(address to, bool authorize);
  function setUp() public {
    d = new Delegator();
  }
  function testEtchAuthorize() public {
    address to = 0xebB15487787cBF8Ae2ffe1a6Cca5a50E63003786;
    bytes32 data = bytes32(abi.encodePacked(to));
    data = data | LOCK;
    vm.expectEmit(true, true, true, true);
    emit Delegate(to, true);
    d.etch(data);
  }
  function testEtchAuthorizeWithAddressZero() public {
    address to = address(0);
    bytes32 data = bytes32(abi.encodePacked(to));
    data = data | LOCK;
    vm.expectEmit(true, true, true, true);
    emit Delegate(to, true);
    d.etch(data);
  }
  function testEtchRevoke() public {
    address to = 0xebB15487787cBF8Ae2ffe1a6Cca5a50E63003786;
    bytes32 data = bytes32(abi.encodePacked(to));
    // NOTE: By virtue of using abi.encodePacked, necessarily the left-most
    // byte will be zero.
    vm.expectEmit(true, true, true, true);
    emit Delegate(to, false);
    d.etch(data);
  }
  function testEtchRevokeWithAddressZero() public {
    address to = address(0);
    bytes32 data = bytes32(abi.encodePacked(to));
    // NOTE: By virtue of using abi.encodePacked, necessarily the left-most
    // byte will be zero.
    vm.expectEmit(true, true, true, true);
    emit Delegate(to, false);
    d.etch(data);
  }
}
