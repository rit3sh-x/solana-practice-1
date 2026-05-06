import { address, appendTransactionMessageInstructions, assertIsTransactionWithBlockhashLifetime, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, getSignatureFromTransaction, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/kit";
import { findAssociatedTokenPda, getMintToInstruction, TOKEN_PROGRAM_ADDRESS, getCreateAssociatedTokenIdempotentInstructionAsync } from "@solana-program/token";

import wallet from "../../wallet.json";
import { mintAddress } from "../../output/spl/init.json";
import { explorerAddr, explorerTx, logError, logSuccess, saveOutput } from "../utils/output";

const rpc = createSolanaRpc(process.env.SOLANA_RPC_URL!);

const rpcSubscriptions = createSolanaRpcSubscriptions(process.env.SOLANA_WS_URL!);

const TOKEN_DECIMALS = 6;
const ONE_TOKEN = 10n ** BigInt(TOKEN_DECIMALS);
const AMOUNT = 10n * ONE_TOKEN;

const mint = address(mintAddress);

(async () => {
    try {
        const signer = await createKeyPairSignerFromBytes(
            new Uint8Array(wallet)
        );

        const [ata] = await findAssociatedTokenPda({
            mint,
            owner: signer.address,
            tokenProgram: TOKEN_PROGRAM_ADDRESS
        })

        const createAtaIx = await getCreateAssociatedTokenIdempotentInstructionAsync({
            payer: signer,
            mint,
            owner: signer.address
        });

        const mintToIx = getMintToInstruction({
            mint,
            token: ata,
            mintAuthority: signer,
            amount: AMOUNT
        });

        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

        const msg = createTransactionMessage({ version: 0 });

        const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);

        const msgWithLiftime = setTransactionMessageLifetimeUsingBlockhash(
            latestBlockhash,
            msgWithPayer
        )

        const txMessage = appendTransactionMessageInstructions(
            [createAtaIx, mintToIx],
            msgWithLiftime
        )

        const signedTx = await signTransactionMessageWithSigners(txMessage);

        assertIsTransactionWithBlockhashLifetime(signedTx);

        const signature = getSignatureFromTransaction(signedTx);

        const sendAndConfirm = sendAndConfirmTransactionFactory({
            rpc, rpcSubscriptions
        });

        await sendAndConfirm(signedTx, { commitment: "confirmed" });

        const savedTo = saveOutput("spl/mint.json", {
            mint: mintAddress,
            ata,
            owner: signer.address,
            amountRaw: AMOUNT.toString(),
            decimals: TOKEN_DECIMALS,
            mintTxn: signature,
        });

        logSuccess(
            "SPL tokens minted",
            {
                mint: mintAddress,
                ata,
                amount: `${(AMOUNT / ONE_TOKEN).toString()} (raw: ${AMOUNT.toString()})`,
                signature,
                ataExplorer: explorerAddr(ata),
                tx: explorerTx(signature),
            },
            savedTo
        );
    }
    catch (error) {
        logError("SPL mint-to failed", error);
    }

})()
