import { address, appendTransactionMessageInstructions, assertIsTransactionWithBlockhashLifetime, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, getSignatureFromTransaction, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/kit";
import { findAssociatedTokenPda, getCreateAssociatedTokenIdempotentInstructionAsync, getTransferCheckedInstruction, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";

import wallet from "../../wallet.json"
import { mintAddress } from "../../output/spl/init.json";
import { explorerAddr, explorerTx, logError, logSuccess, saveOutput } from "../utils/output";

const rpc = createSolanaRpc(process.env.SOLANA_RPC_URL!);

const rpcSubscriptions = createSolanaRpcSubscriptions(process.env.SOLANA_WS_URL!);

const TOKEN_DECIMALS = 6;
const AMOUNT = 1_000_000n;

const mint = address(mintAddress);

const to = address("FECajuKAyYCEp1woG9K42iJeKCAJjKUpxzXDx9FPpfWk");

(async () => {
    try {
        const signer = await createKeyPairSignerFromBytes(
            new Uint8Array(wallet)
        );
        const sendAndConfirm = sendAndConfirmTransactionFactory({
            rpc, rpcSubscriptions
        });

        const [fromAta] = await findAssociatedTokenPda({
            mint,
            owner: signer.address,
            tokenProgram: TOKEN_PROGRAM_ADDRESS
        })

        const [toAta] = await findAssociatedTokenPda({
            mint,
            owner: to,
            tokenProgram: TOKEN_PROGRAM_ADDRESS
        })

        const createAtaIx = await getCreateAssociatedTokenIdempotentInstructionAsync({
            payer: signer,
            mint,
            owner: to
        });

        const transferTx = getTransferCheckedInstruction({
            source: fromAta,
            mint,
            destination: toAta,
            authority: signer,
            amount: AMOUNT,
            decimals: TOKEN_DECIMALS
        });

        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

        const msg = createTransactionMessage({ version: 0 });

        const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);

        const msgWithLiftime = setTransactionMessageLifetimeUsingBlockhash(
            latestBlockhash,
            msgWithPayer
        )

        const txMessage = appendTransactionMessageInstructions(
            [createAtaIx, transferTx],
            msgWithLiftime
        )

        const signedTx = await signTransactionMessageWithSigners(txMessage);

        assertIsTransactionWithBlockhashLifetime(signedTx);

        const signature = getSignatureFromTransaction(signedTx);


        await sendAndConfirm(signedTx, { commitment: "confirmed" });

        const savedTo = saveOutput("spl/transfer.json", {
            mint: mintAddress,
            from: signer.address,
            to,
            fromAta,
            toAta,
            amountRaw: AMOUNT.toString(),
            decimals: TOKEN_DECIMALS,
            signature,
        });

        logSuccess(
            "SPL transfer confirmed",
            {
                from: signer.address,
                to,
                fromAta,
                toAta,
                amountRaw: AMOUNT.toString(),
                signature,
                tx: explorerTx(signature),
                recipient: explorerAddr(to),
            },
            savedTo
        );
    }
    catch (error) {
        logError("SPL transfer failed", error);
    }
})()
