# Curator NFT Editions

### What are these contracts?
`CuratorEditions`
   Creates a curator edition backed by the zora editions contracts. Allows for payment splitting using PaymentSplitter.sol as the split implementation.

### How do I create a new contract?

### Directly on the blockchain:
1. Find/Deploy the `CuratorEditions` contract
2. Call `createCuratorEdition` on the `CuratorEditions`


### Where is the factory contract deployed:

Rinkeby: 0x60D26f8065D43D4B6B8BB8f03aefe73A220461e3

### How do I create a new edition?

call `createCuratorEdition` with the given arguments to create a new editions contract:

- EditionData
    - Name: Token Name Symbol (shows in etherscan)
    - Symbol: Symbol of the Token (shows in etherscan)
    - Description: Description of the Token (shows in the NFT description)
    - Animation URL: IPFS/Arweave URL of the animation (video, webpage, audio, etc)
    - Animation Hash: sha-256 hash of the animation, 0x0 if no animation url provided
    - Image URL: IPFS/Arweave URL of the image (image/, gifs are good for previewing images)
    - Image Hash: sha-256 hash of the image, 0x0 if no image url provided
    - Edition Size: Number of this edition, if set to 0 edition is not capped/limited
    - Price: The default price for the edition
    - BPS Royalty: 500 = 5%, 1000 = 10%, so on and so forth, set to 0 for no on-chain royalty (not supported by all marketplaces)
    - Owner: The owner of the edition contract

- SplitData
    - Title: Title of the editions split
    - Payees: List of addresses the will recieve a payout from the edition sale
    - Shares: List of shares the corrosponding address will receive on sale

### How do I sell/distribute editions?

Now that you have a edition, there are multiple options for lazy-minting and sales:

1. To sell editions for ETH you can call `setSalePrice` or set a default price on `createCuratorEdition`

### Deploying:
(Replace network with desired network)

`hardhat deploy --network rinkeby`

### Verifying:

`hardhat sourcify --network rinkeby && hardhat etherscan-verify --network rinkeby`
