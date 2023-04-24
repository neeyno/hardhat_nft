import { run } from "hardhat"
import { Artifact } from "hardhat/types"

// async function verify(contractAddress, args) {
export default async function verify(
    contractAdrr: string,
    args: any[],
    artifact: Artifact
): Promise<void> {
    console.log(`Verifying contract...`)

    try {
        await run("verify:verify", {
            address: contractAdrr,
            constructorArguments: args,
            contract: `${artifact.sourceName}:${artifact.contractName}`,
        })
    } catch (e: any) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
}
