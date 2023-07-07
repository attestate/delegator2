// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Delegator2.sol";

contract Delegator2Test is Test {
  Delegator2 public d;
  event Delegate(bytes32[3] data);
  function setUp() public {
    d = new Delegator2();
  }
  function testAuthorize() public {
    address to = 0xebB15487787cBF8Ae2ffe1a6Cca5a50E63003786;

    bytes32[3] memory data;
    data[0] = 0x0000000000000000000000000000000000000000f00df00df00df00df00df00d;
    data[1] = 0x0000000000000000000000000000000000000000beefbeefbeefbeefbeefbeef;
    data[2] = bytes32(abi.encodePacked(to)) | bytes32(uint(0x1));

    vm.expectEmit(true, true, true, true);
    emit Delegate(data);
    d.etch(data);
  }
  function testRevoke() public {
    address to = 0xebB15487787cBF8Ae2ffe1a6Cca5a50E63003786;

    bytes32[3] memory data;
    data[0] = 0x0000000000000000000000000000000000000000f00df00df00df00df00df00d;
    data[1] = 0x0000000000000000000000000000000000000000beefbeefbeefbeefbeefbeef;
    data[2] = bytes32(abi.encodePacked(to));

    vm.expectEmit(true, true, true, true);
    emit Delegate(data);
    d.etch(data);
  }
}
