import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromKeypair, generateSigner, publicKey, signerIdentity } from "@metaplex-foundation/umi";
import { create, mplCore } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

import wallet from "@root/wallet.json";
import { url as metadataUri } from "@root/output/nft/metadata.json";
import { explorerAddr, explorerTx, logError, logSuccess, saveOutput } from "@/utils/output";

const umi = createUmi(process.env.SOLANA_RPC_URL!);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));
umi.use(mplCore());

const ATTRIBUTES = [
    { key: "Rarity", value: "Legendary" },
    { key: "Origin", value: "Valley of Peace" },
    { key: "Element", value: "Spirit" },
];

function loadCollectionAddress(): string | null {
    const path = resolve(__dirname, "..", "..", "output", "nft", "collection.json");
    if (!existsSync(path)) return null;
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { collection?: string };
    return parsed.collection ?? null;
}

(async () => {
    try {
        const asset = generateSigner(umi);
        const collectionAddress = loadCollectionAddress();

        const builder = create(umi, {
            asset,
            ...(collectionAddress
                ? { collection: { publicKey: publicKey(collectionAddress) } }
                : {}),
            name: "Master Oogway",
            uri: metadataUri,
            plugins: [
                {
                    type: "Attributes",
                    attributeList: ATTRIBUTES,
                },
            ],
        });

        const tx = await builder.sendAndConfirm(umi);
        const signature = base58.deserialize(tx.signature)[0];

        const savedTo = saveOutput("nft/mint.json", {
            asset: asset.publicKey,
            collection: collectionAddress,
            metadataUri,
            attributes: ATTRIBUTES,
            signature,
        });

        logSuccess(
            collectionAddress ? "NFT minted (in collection)" : "NFT minted (standalone)",
            {
                asset: asset.publicKey,
                ...(collectionAddress && {collection: collectionAddress}),
                attributes: ATTRIBUTES.map((a) => `${a.key}=${a.value}`).join(", "),
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
