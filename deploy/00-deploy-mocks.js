const { network } = require("hardhat")
const {
    developmentChains,
    networkConfig,
    BASE_FEE,
    GAS_LINK_PRICE,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("------------------------------------------")
    log(network.name)
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        // deploying vfrCoordinatorV2
        await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_LINK_PRICE], // constructor(uint96 _baseFee, uint96 _gasPriceLink)
        })

        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        })
        log("Mocks deployed!")
    }
}

module.exports.tags = ["all", "mocks"]
