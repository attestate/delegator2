 // SPDX-License-Identifier: AGPL-3.0
 // github.com/attestate/delegator2
 pragma solidity ^0.8.13;

address constant collectionLocation = 0x66747bdC903d17C586fA09eE5D6b54CC85bBEA45;
interface IERC721Drop {
  struct SaleDetails {
    bool publicSaleActive;
    bool presaleActive;
    uint256 publicSalePrice;
    uint64 publicSaleStart;
    uint64 publicSaleEnd;
    uint64 presaleStart;
    uint64 presaleEnd;
    bytes32 presaleMerkleRoot;
    uint256 maxSalePurchasePerAddress;
    uint256 totalMinted;
    uint256 maxSupply;
  }
  function adminMint(address recipient, uint256 quantity) external returns (uint256);
  function saleDetails() external view returns (SaleDetails memory);
}
address constant kiwiTreasury = 0xee324c588ceF1BF1c1360883E4318834af66366d;

contract Delegator3 {
  event Delegate(bytes32[3] data, address sender);
  error ErrValue();
  function getPrice() view internal returns (uint256 price) {
    IERC721Drop collection = IERC721Drop(collectionLocation);
    return collection.saleDetails().publicSalePrice;
  }
   function setup(
    bytes32[3] calldata data
  ) external payable {
    uint256 price = getPrice();
    if (msg.value < price) revert ErrValue();

    IERC721Drop collection = IERC721Drop(collectionLocation);

    uint256 quantity = 1;
    collection.adminMint(msg.sender, quantity);
    emit Delegate(data, msg.sender);

    kiwiTreasury.call{value: price}("");

  }
  function etch(bytes32[3] calldata data) external {
    emit Delegate(data, msg.sender);
  }
}
