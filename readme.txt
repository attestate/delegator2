# Delegator

readme: see src/Delegator.sol
addresses:
  - eth:0x598139e4fa2cf7597226efce853f6e382c95a941#code

## CREATE2

Factory: 0x0000000000ffe8b47b3e2130213b802212439497
Salt: 0x0000000000000000000000000000000000000000f00df00df00df00df00df00d
Init code: 0x608060405234801561001057600080fd5b5060ff8061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063fcd1ba6414602d575b600080fd5b603c603836600460b1565b603e565b005b606081901c60018083161433829003606957604051632dbbf50f60e01b815260040160405180910390fd5b604080516001600160a01b038416815282151560208201527f476e135b58bb76d596395ad8ab8aced2704a709b7354a2fec97a64d905e3536a910160405180910390a1505050565b60006020828403121560c257600080fd5b503591905056fea26469706673582212206160446ef1f0dbc84cc7abc8062e63b176525d8433f146d9666797cd1dde4c1c64736f6c63430008110033

NOTE: 

The factory allows bypassing the "containsCaller" check by setting the first 20
bytes of the salt to zeros.

```
/**
 * @dev Modifier to ensure that the first 20 bytes of a submitted salt match
 * those of the calling account. This provides protection against the salt
 * being stolen by frontrunners or other attackers. The protection can also be
 * bypassed if desired by setting each of the first 20 bytes to zero.
 * @param salt bytes32 The salt value to check against the calling address.
 */
modifier containsCaller(bytes32 salt) {
  // prevent contract submissions from being stolen from tx.pool by requiring
  // that the first 20 bytes of the submitted salt match msg.sender.
  require(
    (address(bytes20(salt)) == msg.sender) ||
    (bytes20(salt) == bytes20(0)),
    "Invalid salt - first 20 bytes of the salt must match calling address."
  );
  _;
}
```

## License

SPDX-License-Identifier: AGPL-3.0
