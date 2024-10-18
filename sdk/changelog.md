# changelog

## 0.5.1

- For the legacy eligibility calculation, there was a mistake where the
  inputted accounts object resulted in a bounded possession history, when the
  user was still holding the token in fact

## 0.5.0

- Implement precise `eligibleAt` function. A detailed explanation can be found
  [here](https://github.com/attestate/crawler-call-block-logs/blob/main/changelog.md#050).
  - The `address` and `validationTime` of `eligibleAt` have been moved into an
    object called `params`. `params` also includes a property `tokenId`.
  - The legacy `eligibleAt` functionality is still exposed by omitting
    `tokenId` from `params`.

## 0.4.0

- Reintroduce original `function eligible` from 0.2.0 and prior releases.
- Rename the `function eligible` functionality from version 0.3.0 to `function
  eligibleAt`.

## 0.3.0

- Switch from allowlist concept (a JavaScript Set of allowed addresses) to an
  accounts object. The accounts object defines when a token was minted, the
  holder's token balance and a timestamp of when the holder's balance reached
  zero tokens. This is a breaking change for the `function eligible`.
- Introduce a parameter `validationTime` that simulates the point in time an
  account claim is validated against. For example, this allows a developer to
  check whether a user is eligible to post a message at a certain time.

## 0.2.0

- Change the input type of "allowlist" from `string[]` to `Set` to improve
  validation performance.

## 0.1.2

- Added docs for `function organize`
- Added `function eligible` to SDK

## 0.1.1

- Import @ethersproject subpackages to shrink footprint

## 0.1.0

- Cast all addresses to check-summed addresses and stop lower casing

## 0.0.1

- Initial release
