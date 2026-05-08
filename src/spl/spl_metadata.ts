import { publicKey } from "@metaplex-foundation/umi";
import { createMetadataAccountV3, CreateMetadataAccountV3InstructionAccounts, CreateMetadataAccountV3InstructionArgs, DataV2Args } from "@metaplex-foundation/mpl-token-metadata";
import { base58 } from "@metaplex-foundation/umi/serializers";

import { mintAddress } from "@root/output/spl/init.json";
import { explorerTx, logError, logSuccess, saveOutput } from "@/utils/output";
import { getUmi } from "@/utils/rpc";

const mint = publicKey(mintAddress);
const { umi, signer } = getUmi();


(async () => {
    try {
        const accounts: CreateMetadataAccountV3InstructionAccounts = {
            mint,
            mintAuthority: signer
        }

        const data: DataV2Args = {
            name: "Coin",
            symbol: "COIN",
            uri: process.env.SPL_METADATA_URI!,
            sellerFeeBasisPoints: 1,
            creators: null,
            collection: null,
            uses: null
        }

        const args: CreateMetadataAccountV3InstructionArgs = {
            data,
            isMutable: true,
            collectionDetails: null
        }
        const tx = createMetadataAccountV3(umi, {
            ...accounts,
            ...args
        })

        const result = await tx.sendAndConfirm(umi);
        const signature = base58.deserialize(result.signature)[0];

        const savedTo = saveOutput("spl/metadata.json", {
            mint: mintAddress,
            signature,
            slot: result.result.context.slot.toString(),
        });

        logSuccess(
            "SPL metadata attached",
            {
                mint: mintAddress,
                signature,
                tx: explorerTx(signature),
            },
            savedTo
        );
    }
    catch (error) {
        logError("SPL metadata attach failed", error);
    }
})()
