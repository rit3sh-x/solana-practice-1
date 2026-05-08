import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    createSignerFromKeypair,
    signerIdentity,
    type Keypair,
    type KeypairSigner,
    type Umi,
} from "@metaplex-foundation/umi";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
    createKeyPairSignerFromBytes,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    sendAndConfirmTransactionFactory,
    type KeyPairSigner,
} from "@solana/kit";

import wallet from "@root/wallet.json";

const RPC_URL = process.env.SOLANA_RPC_URL!;
const WS_URL = process.env.SOLANA_WS_URL!;
const IRYS_URL = process.env.IRYS_URL ?? "https://devnet.irys.xyz/";
const WALLET_BYTES = new Uint8Array(wallet);

export type UmiPlugin = "mplCore" | "irys";

export interface UmiBundle {
    umi: Umi;
    keypair: Keypair;
    signer: KeypairSigner;
}

export function getUmi(plugins: UmiPlugin[] = []): UmiBundle {
    const umi = createUmi(RPC_URL);
    const keypair = umi.eddsa.createKeypairFromSecretKey(WALLET_BYTES);
    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(signerIdentity(signer));

    for (const plugin of plugins) {
        if (plugin === "mplCore") umi.use(mplCore());
        else if (plugin === "irys") umi.use(irysUploader({ address: IRYS_URL }));
    }

    return { umi, keypair, signer };
}

export interface KitBundle {
    rpc: ReturnType<typeof createSolanaRpc>;
    rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
    sendAndConfirm: ReturnType<typeof sendAndConfirmTransactionFactory>;
    getSigner: () => Promise<KeyPairSigner>;
}

export function getKitClient(): KitBundle {
    const rpc = createSolanaRpc(RPC_URL);
    const rpcSubscriptions = createSolanaRpcSubscriptions(WS_URL);
    const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
    const getSigner = () => createKeyPairSignerFromBytes(WALLET_BYTES);
    return { rpc, rpcSubscriptions, sendAndConfirm, getSigner };
}
