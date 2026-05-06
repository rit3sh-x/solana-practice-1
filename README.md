# solana-scripts

Scripts for creating SPL tokens and NFTs on Solana devnet.

---

## Setup

### 1. Install dependencies

```bash
pnpm install
pnpm rebuild bigint-buffer
```

If pnpm prompts about ignored build scripts, run:

```bash
pnpm approve-builds
```

and select `bigint-buffer`.

### 2. Add your wallet

Place your devnet wallet keypair at the project root as `wallet.json`. It should be a JSON array of numbers:

```
solana-scripts/
└── wallet.json   ← here   [174, 23, ...]
```

Fund it with devnet SOL:

```bash
solana airdrop 2 <PUBKEY> --url devnet
```

### 3. Add your image (NFT only)

Place an image at the project root as `image.jpg` (or set `NFT_IMAGE_PATH`):

```
solana-scripts/
└── image.jpg
```

### 4. Configure environment

Create a `.env` file at the project root:

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
SOLANA_CLUSTER=devnet
SPL_METADATA_URI=https://example.com/your-spl-metadata.json
# optional
NFT_IMAGE_PATH=./image.jpg
NFT_IMAGE_CONTENT_TYPE=image/jpeg
```

`SPL_METADATA_URI` is consumed by `spl:metadata`. Upload your token metadata JSON anywhere (Irys, Arweave, IPFS, plain HTTPS) and paste the URI here.