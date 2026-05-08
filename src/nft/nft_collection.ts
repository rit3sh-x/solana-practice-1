import { generateSigner } from "@metaplex-foundation/umi";
import { createCollection, ruleSet } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

import { url as metadataUri } from "@root/output/nft/metadata.json";
import { explorerAddr, explorerTx, logError, logSuccess, saveOutput } from "@/utils/output";
import { getUmi } from "@/utils/rpc";

const { umi, keypair } = getUmi(["mplCore"]);

const ROYALTY_BPS = 500;

(async () => {
    try {
        const collection = generateSigner(umi);

        const tx = await createCollection(umi, {
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

        const signature = base58.deserialize(tx.signature)[0];

        const savedTo = saveOutput("nft/collection.json", {
            collection: collection.publicKey,
            metadataUri,
            royaltyBasisPoints: ROYALTY_BPS,
            signature,
        });

        logSuccess(
            "NFT collection created",
            {
                collection: collection.publicKey,
                royaltyBps: ROYALTY_BPS.toString(),
                metadataUri,
                signature,
                tx: explorerTx(signature),
                explorer: explorerAddr(collection.publicKey),
            },
            savedTo
        );
    }
    catch (error) {
        logError("NFT collection creation failed", error);
    }
})()
