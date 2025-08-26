// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Delegator3.sol";

contract Delegator3Test is Test {
  Delegator3 public d;
  event Delegate(bytes32[3] data, address sender);
  function setUp() public {
    d = new Delegator3();
  }
  function testAuthorize() public {
    address to = 0xebB15487787cBF8Ae2ffe1a6Cca5a50E63003786;

    bytes32[3] memory data;
    data[0] = 0x0000000000000000000000000000000000000000f00df00df00df00df00df00d;
    data[1] = 0x0000000000000000000000000000000000000000beefbeefbeefbeefbeefbeef;
    data[2] = bytes32(abi.encodePacked(to)) | bytes32(uint(0x1));

    vm.expectEmit(true, true, true, true);
    emit Delegate(data, address(this));
    d.etch(data);
  }
  function testRevoke() public {
    address to = 0xebB15487787cBF8Ae2ffe1a6Cca5a50E63003786;

    bytes32[3] memory data;
    data[0] = 0x0000000000000000000000000000000000000000f00df00df00df00df00df00d;
    data[1] = 0x0000000000000000000000000000000000000000beefbeefbeefbeefbeefbeef;
    data[2] = bytes32(abi.encodePacked(to));

    vm.expectEmit(true, true, true, true);
    emit Delegate(data, address(this));
    d.etch(data);
  }
  function testUnderpay() public {
    address collection = 0x66747bdC903d17C586fA09eE5D6b54CC85bBEA45;
    vm.mockCall(
        collection,
        abi.encodeWithSelector(IERC721Drop.adminMint.selector),
        abi.encode(1)
    );
    uint256 price = 2 ether;
    IERC721Drop.SaleDetails memory details = IERC721Drop.SaleDetails(
      false,
      false,
      price,
      0,
      0,
      0,
      0,
      bytes32(0),
      0,
      0,
      0);
    bytes32[3] memory data;
    vm.mockCall(
        collection,
        abi.encodeWithSelector(IERC721Drop.saleDetails.selector),
        abi.encode(details)
    );

    vm.expectRevert(Delegator3.ErrValue.selector);
    d.setup{value: price - 1 ether}(data);
  }
  function testSetup() public {
    address collection = 0x66747bdC903d17C586fA09eE5D6b54CC85bBEA45;
    vm.mockCall(
        collection,
        abi.encodeWithSelector(IERC721Drop.adminMint.selector),
        abi.encode(1)
    );
    uint256 price = 0.1 ether;
    IERC721Drop.SaleDetails memory details = IERC721Drop.SaleDetails(
      false,
      false,
      price,
      0,
      0,
      0,
      0,
      bytes32(0),
      0,
      0,
      0);
    vm.mockCall(
        collection,
        abi.encodeWithSelector(IERC721Drop.saleDetails.selector),
        abi.encode(details)
    );
    address delegator = 0x08b7ECFac2c5754ABafb789c84F8fa37c9f088B0;
    vm.mockCall(
        delegator,
        abi.encodeWithSelector(Delegator3.etch.selector),
        abi.encode(0)
    );
    bytes32[3] memory data;

    d.setup{value: price}(data);
  }
}
