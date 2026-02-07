import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { getAddress, recoverMessageAddress, keccak256, encodePacked, Hex } from "viem";

/**
 * AEGIS SIGNATURE PROVIDER
 * 
 * This provider gives the agent the ability to VERIFY oracle signatures.
 * An autonomous agent should never blindly trust data; it must verify 
 * the cryptographic proof from the Chainlink DON.
 */

export const aegisVerificationProvider: Provider = {
    name: "aegis-security",
    get: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<any> => {
        const AEGIS_PUBLIC_KEY = runtime.getSetting("AEGIS_ORACLE_PUBLIC_KEY");

        if (!AEGIS_PUBLIC_KEY) {
            return "Aegis: Public Key not configured. Cryptographic verification unavailable.";
        }

        /**
         * Logic to reconstruct the hash and verify the signature 
         * (Mirroring the on-chain logic in AegisVault.sol)
         */
        const verifyResult = async (signedResult: any) => {
            try {
                const reconstructedHash = keccak256(
                    encodePacked(
                        ['address', 'address', 'uint256', 'uint256', 'uint256', 'string', 'uint8', 'bytes32'],
                        [
                            getAddress(signedResult.userAddress),
                            getAddress(signedResult.tokenAddress),
                            BigInt(signedResult.chainId),
                            BigInt(Math.round(Number(signedResult.askingPrice || "0") * 1e8)),
                            BigInt(signedResult.timestamp),
                            signedResult.decision,
                            signedResult.riskScore,
                            signedResult.salt
                        ]
                    )
                );

                const recoveredAddress = await recoverMessageAddress({
                    message: { raw: reconstructedHash },
                    signature: signedResult.signature
                });

                const isValid = getAddress(recoveredAddress) === getAddress(AEGIS_PUBLIC_KEY);

                return {
                    isValid,
                    reason: isValid ? "Authenticity Verified" : "SIGNATURE MISMATCH - TAMPERING DETECTED",
                    recoveredAddress
                };
            } catch (e: any) {
                return { isValid: false, reason: `Verification Error: ${e.message}` };
            }
        };

        return "Aegis Security Provider loaded and ready for cryptographic challenge.";
    }
};
