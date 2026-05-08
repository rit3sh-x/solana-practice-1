import { image } from "@root/output/nft/image.json";
import { logError, logSuccess, saveOutput } from "@/utils/output";
import { getUmi } from "@/utils/rpc";

const { umi } = getUmi(["irys"]);

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
