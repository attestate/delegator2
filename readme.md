# replyguy

> a man who comments on social media threads with uninteresting, annoying,
> over-familiar, or just downright patronizing replies.

**This software:** A smart contract to post content-addressed comments to a URL.

## what is "replyguy?"

As to monetize my blog, https://proofofprogress.com, I'm considering adding a
social feature that allows readers to share their opinion under my posts for a
small bribe. See, on Hacker News, I've have had hundreds of annoying,
over-familiar or downright patronizing replies about my articles, so I thought:
Why not monetize this sad facet of my life! "replyguy" is that code. Here's how
it works!

## how does "replyguy" work?

As a man, occassionally posting uninteresting, annoying, over-familiar or
downright patronizing replies myself, I just hate being censored for that. So
"replyguy" prevents it. 

By submitting a hash of the post's URL and a hash of the reply itself,
"replyguy" ensures that all comments and their relation to a post's URL remain
permanently stored on Ethereum. "replyguy," from a replyguy for replyguys.

replyguys using "replyguy" hash-digest the blog post's URL and their
patronizing comment to then call `function comment(bytes32 url, bytes32 text)
external payable`. The catch is that this function costs! So replyguying isn't
free anymore.

Here's some pseudocode on how that would work:

```
const url = keccak256("https://proofinprogress.com/posts/2021-02-22/ethereum-isnt-fun-anymore.html");
const text = keccak256("Wow man, this is really a weak take! You're such a dumbass");
Replyguy.comment{value: 0.01 ether}(url, text);
```

As you can see, the post's URL and the patronizing comment are hashed using
keccak256 and then the contract's `function comment` is called, but `0.01
ether` is sent along too. This amount, by the way, is configurable so that true
replyguy price discovery is enabled.

## "but... but this is stupid!"

OK everybody is entitled to their opinion.

## "can I fork this?"

Yes, lemme license this as GPL-3.
