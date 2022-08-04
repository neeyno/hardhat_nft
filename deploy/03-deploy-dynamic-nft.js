const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { log, deploy } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("------------------------------------------")
    log(network.name)

    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") // get the most recent deployment
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const lowSvg = await fs.readFileSync("./images/dynamicNft/dynamic-nft-1.svg", {
        encoding: "utf-8",
    })
    const highSvg = await fs.readFileSync("./images/dynamicNft/dynamic-nft-2.svg", {
        encoding: "utf-8",
    })

    const argsDynamicNft = [ethUsdPriceFeedAddress, lowSvg, highSvg]
    const dynamicNft = await deploy("DynamicSvgNFT", {
        contract: "DynamicSvgNFT",
        from: deployer,
        log: true,
        args: argsDynamicNft,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("------------------------------------------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(dynamicNft.address, argsDynamicNft)
    }
}

module.exports.tags = ["all", "dynamicnft", "main"]
