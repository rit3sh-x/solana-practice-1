import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromKeypair, generateSigner, signerIdentity } from "@metaplex-foundation/umi";
import { create, createCollection, mplCore, ruleSet } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

import wallet from "@root/wallet.json";
import { url as metadataUri } from "@root/output/nft/metadata.json";
import { explorerAddr, explorerTx, logError, logSuccess, saveOutput } from "@/utils/output";

const umi = createUmi(process.env.SOLANA_RPC_URL!);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));
umi.use(mplCore());

const ROYALTY_BPS = 500;

const ATTRIBUTES = [
    { key: "Rarity", value: "Legendary" },
    { key: "Origin", value: "Valley of Peace" },
    { key: "Element", value: "Spirit" },
];

(async () => {
    try {
        const collection = generateSigner(umi);
        const asset = generateSigner(umi);

        const collectionTx = await createCollection(umi, {
            collection,
            name: "Oogway Collection",
            uri: metadataUri,
            plugins: [
                {
                    type: "Royalties",
                    basisPoints: ROYALTY_BPS,
                    creators: [{ address: keypair.publicKey, percentage: 100 }],
                    ruleSet: ruleSet("None"),
                },
            ],
        }).sendAndConfirm(umi);

        const collectionSig = base58.deserialize(collectionTx.signature)[0];

        const mintTx = await create(umi, {
            asset,
            collection: { publicKey: collection.publicKey },
            name: "Master Oogway",
            uri: metadataUri,
            plugins: [
                {
                    type: "Attributes",
                    attributeList: ATTRIBUTES,
                },
            ],
            // skipPreflight: RPC simulation bank may lag behind the just confirmed
            // collection tx, making the collection account look empty (0 bytes) and panicking.
        }).sendAndConfirm(umi, { send: { skipPreflight: true } });

        const mintSig = base58.deserialize(mintTx.signature)[0];

        const savedTo = saveOutput("nft/collection_with_mint.json", {
            collection: collection.publicKey,
            asset: asset.publicKey,
            metadataUri,
            royaltyBasisPoints: ROYALTY_BPS,
            attributes: ATTRIBUTES,
            collectionSignature: collectionSig,
            mintSignature: mintSig,
        });

        logSuccess(
            "NFT collection + asset created",
            {
                collection: collection.publicKey,
                asset: asset.publicKey,
                royaltyBps: ROYALTY_BPS.toString(),
                attributes: ATTRIBUTES.map((a) => `${a.key}=${a.value}`).join(", "),
                metadataUri,
                collectionTx: explorerTx(collectionSig),
                mintTx: explorerTx(mintSig),
                collectionExplorer: explorerAddr(collection.publicKey),
                assetExplorer: explorerAddr(asset.publicKey),
            },
            savedTo
        );
    }
    catch (error) {
        logError("NFT collection + mint failed", error);
    }
})()
