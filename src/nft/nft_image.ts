import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";
import { resolve } from "path";

import wallet from "../../wallet.json";
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
