// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Replyguy.sol";

contract ReplyguyTest is Test {
  Replyguy public poster;
  uint256 public cost = 0.1 ether;
  event Comment(address indexed poster, bytes32 indexed url, bytes32 hash);
  receive() external payable {}
  function setUp() public {
    poster = new Replyguy(cost);
  }
  function testConfigure() public {
    uint256 nextCost = 1 ether;
    address nextOwner = address(0);
    poster.configure(nextCost, nextOwner);
    assertEq(nextCost, poster.cost());
    assertEq(nextOwner, poster.owner());
  }
  function testConfigureAsUnauthorized() public {
    uint256 nextCost = 1 ether;
    address nextOwner = address(0);
    vm.prank(address(1));
    vm.expectRevert(Replyguy.ErrNotOwner.selector);
    poster.configure(nextCost, nextOwner);
  }
  function testWithInsufficientValue() public {
    bytes32 url = 0x0000000000000000000000000000000000000000000000000000000000000123;
    bytes32 comment = 0x0000000000000000000000000000000000000000000000000000000000000666;
    uint256 value = 0.01 ether;
    assertTrue(value < cost);
    vm.expectRevert(Replyguy.ErrValueSize.selector);
    poster.comment{value: value}(url, comment);
  }
  function testPost() public {
    bytes32 url = 0x0000000000000000000000000000000000000000000000000000000000000123;
    bytes32 comment = 0x0000000000000000000000000000000000000000000000000000000000000666;
    vm.expectEmit(true, true, false, false);
    emit Comment(address(this), url, comment);
    poster.comment{value: cost}(url, comment);
  }
}
