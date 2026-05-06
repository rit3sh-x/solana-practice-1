import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromKeypair, generateSigner, signerIdentity } from "@metaplex-foundation/umi";
import { create, mplCore } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

import wallet from "../../wallet.json";
import { url as metadataUri } from "../../output/nft/metadata.json";
import { explorerAddr, explorerTx, logError, logSuccess, saveOutput } from "../utils/output";

const umi = createUmi(process.env.SOLANA_RPC_URL!);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));

umi.use(mplCore());

(async () => {
    try {
        const asset = generateSigner(umi);

        const tx = await create(umi, {
            asset,
            name: "Master Oogway",
            uri: metadataUri,
        }).sendAndConfirm(umi);

        const signature = base58.deserialize(tx.signature)[0];

        const savedTo = saveOutput("nft/mint.json", {
            asset: asset.publicKey,
            metadataUri,
            signature,
        });

        logSuccess(
            "NFT minted",
            {
                asset: asset.publicKey,
                metadataUri,
                signature,
                tx: explorerTx(signature),
                explorer: explorerAddr(asset.publicKey),
            },
            savedTo
        );
    }
    catch (error) {
        logError("NFT mint failed", error);
    }
})()
