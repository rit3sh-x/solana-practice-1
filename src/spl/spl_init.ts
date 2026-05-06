import { appendTransactionMessageInstructions, assertIsTransactionWithBlockhashLifetime, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, generateKeyPairSigner, getSignatureFromTransaction, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/kit";
import { getInitializeMintInstruction, getMintSize, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { getCreateAccountInstruction } from "@solana-program/system";

import wallet from "../../wallet.json";
import { explorerAddr, explorerTx, logError, logSuccess, saveOutput } from "../utils/output";


const rpc = createSolanaRpc(process.env.SOLANA_RPC_URL!);

const rpcSubscriptions = createSolanaRpcSubscriptions(process.env.SOLANA_WS_URL!);

(async () => {
    try {
        const signer = await createKeyPairSignerFromBytes(
            new Uint8Array(wallet)
        );

        const mint = await generateKeyPairSigner();

        const space = BigInt(getMintSize());

        const rent = await rpc.getMinimumBalanceForRentExemption(space).send();

        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

        const sendAndConfirm = sendAndConfirmTransactionFactory({
            rpc, rpcSubscriptions
        });

        const msg = createTransactionMessage({ version: 0 });

        const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);

        const msgWithLiftime = setTransactionMessageLifetimeUsingBlockhash(
            latestBlockhash,
            msgWithPayer
        )

        const txMessage = appendTransactionMessageInstructions(
            [
                getCreateAccountInstruction({
                    payer: signer,
                    newAccount: mint,
                    lamports: rent,
                    space,
                    programAddress: TOKEN_PROGRAM_ADDRESS
                }),

                getInitializeMintInstruction({
                    mint: mint.address,
                    decimals: 6,
                    mintAuthority: signer.address
                }),
            ],
            msgWithLiftime
        )

        const signedTx = await signTransactionMessageWithSigners(txMessage);

        assertIsTransactionWithBlockhashLifetime(signedTx);

        const signature = getSignatureFromTransaction(signedTx);

        await sendAndConfirm(signedTx, { commitment: "confirmed" });

        const savedTo = saveOutput("spl/init.json", {
            mintAddress: mint.address,
            transactionSignature: signature,
        });

        logSuccess(
            "SPL mint created",
            {
                mint: mint.address,
                signature,
                explorer: explorerAddr(mint.address),
                tx: explorerTx(signature),
            },
            savedTo
        );
    }
    catch (error) {
        logError("SPL mint creation failed", error);
    }
})();
