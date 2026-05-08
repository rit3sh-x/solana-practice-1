import { createGenericFile } from "@metaplex-foundation/umi";
import { readFile } from "fs/promises";
import { resolve } from "path";

import { logError, logSuccess, saveOutput } from "@/utils/output";
import { getUmi } from "@/utils/rpc";

const { umi } = getUmi(["irys"]);

const IMAGE_PATH = process.env.NFT_IMAGE_PATH ?? "./image.jpg";
const CONTENT_TYPE = process.env.NFT_IMAGE_CONTENT_TYPE ?? "image/jpeg";

(async () => {
    try {
        const absImage = resolve(IMAGE_PATH);
        const image = await readFile(absImage);

        const file = createGenericFile(image, "image.jpg", {
            contentType: CONTENT_TYPE,
        });

        const [myUri] = await umi.uploader.upload([file]);

        const savedTo = saveOutput("nft/image.json", { image: myUri });

        logSuccess(
            "NFT image uploaded",
            {
                source: absImage,
                bytes: image.byteLength.toString(),
                uri: myUri,
            },
            savedTo
        );
    }
    catch (error) {
        logError("NFT image upload failed", error);
    }
})()
