import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

const ROOT = resolve(__dirname, "..", "..");
const CLUSTER = process.env.SOLANA_CLUSTER ?? "devnet";

export function saveOutput(relPath: string, data: unknown): string {
    const absPath = resolve(ROOT, "output", relPath);
    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, JSON.stringify(data, null, 2));
    return absPath;
}

export function explorerTx(sig: string): string {
    return `https://explorer.solana.com/tx/${sig}?cluster=${CLUSTER}`;
}

export function explorerAddr(addr: string): string {
    return `https://explorer.solana.com/address/${addr}?cluster=${CLUSTER}`;
}

export function logSuccess(label: string, fields: Record<string, string>, savedTo?: string): void {
    const bar = "─".repeat(60);
    console.log(`\n[OK] ${label}`);
    console.log(bar);
    const keyWidth = Math.max(...Object.keys(fields).map((k) => k.length));
    for (const [k, v] of Object.entries(fields)) {
        console.log(`  ${k.padEnd(keyWidth)}  ${v}`);
    }
    if (savedTo) {
        console.log(`  ${"saved".padEnd(keyWidth)}  ${savedTo}`);
    }
    console.log(bar + "\n");
}

export function logError(label: string, err: unknown): void {
    console.error(`\n[ERR] ${label}`);
    console.error(err instanceof Error ? err.stack ?? err.message : err);
    process.exitCode = 1;
}
