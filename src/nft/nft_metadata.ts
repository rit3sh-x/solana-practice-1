import { createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

import wallet from "../../wallet.json";
import { image } from "../../output/nft/image.json";
import { logError, logSuccess, saveOutput } from "../utils/output";

const umi = createUmi(process.env.SOLANA_RPC_URL!);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);


umi.use(
    irysUploader({
        address: "https://devnet.irys.xyz/",
    })
);

umi.use(signerIdentity(signer));

(async () => {
    try {
        const metadata = {
            name: "Master Oogway",
            description: `A wise tribute to Master Oogway - "Yesterday is history, tomorrow is a mystery, but today is a gift. That is why it is called the present."`,
            symbol: "OOG",
            image,
            attributes: [{ trait_type: "Rarity", value: "Legendary" }],
            properties: {
                files: [
                    {
                        type: "image/jpeg",
                        uri: image,
                    },
                ],
                category: "image",
            },
        };

        const myUri = await umi.uploader.uploadJson(metadata);

        const savedTo = saveOutput("nft/metadata.json", { url: myUri });

        logSuccess(
            "NFT metadata uploaded",
            {
                name: metadata.name,
                symbol: metadata.symbol,
                imageUri: image,
                metadataUri: myUri,
            },
            savedTo
        );
    }
    catch (error) {
        logError("NFT metadata upload failed", error);
    }
})()
