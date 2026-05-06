import { createSignerFromKeypair, publicKey, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createMetadataAccountV3, CreateMetadataAccountV3InstructionAccounts, CreateMetadataAccountV3InstructionArgs, DataV2Args } from "@metaplex-foundation/mpl-token-metadata";
import { base58 } from "@metaplex-foundation/umi/serializers";

import wallet from "../../wallet.json";
import { mintAddress } from "../../output/spl/init.json";
import { explorerTx, logError, logSuccess, saveOutput } from "../utils/output";

const mint = publicKey(mintAddress);

const umi = createUmi(process.env.SOLANA_RPC_URL!);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));


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
