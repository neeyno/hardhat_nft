const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig, FUND_AMOUNT } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenURIMetadata } = require("../utils/uploadToPinata")

module.exports = async function ({ getNamedAccounts }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // basic nft
    // const basicNft = await ethers.getContract("BasicNFT", deployer)
    // const basicMintTx = await basicNft.mintNFT()
    // await basicMintTx.wait(1)
    // console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`)
    // console.log("------------------------------------------")

    // random ipfs nft
    const randomNft = await ethers.getContract("RandomIpfsNFT", deployer)
    const mintFee = await randomNft.getMintFee()

    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 600000) // 10 min
        randomNft.once("NftMinted", async () => {
            resolve()
        })
        const randomMintTx = await randomNft.requestNFT({ value: mintFee.toString() })
        const randomMintTxReceipt = await randomMintTx.wait(1)
        if (developmentChains.includes(network.name)) {
            const requestId = randomMintTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2mock.fulfillRandomWords(requestId, randomNft.address)
        }
    })
    console.log(`RandomIPFS NFT index 0 has tokenURI: ${await randomNft.tokenURI(0)}`)
    console.log("------------------------------------------")

    // dynamic svg nft
    const dynamicNft = await ethers.getContract("DynamicSvgNFT", deployer)
    const highValue = ethers.utils.parseEther("1618") // 1618 dollar per ether
    const dynamicMintTx = await dynamicNft.mintNft(highValue.toString())
    await dynamicMintTx.wait(1)
    //const mockV3aggregator = await ethers.getContract("MockV3Aggregator", deployer)
    console.log(`DynamicSvg NFT index 1 has tokenURI: ${await dynamicNft.tokenURI(1)}`)
    console.log("------------------------------------------")
}

module.exports.tags = ["all", "mint"]
