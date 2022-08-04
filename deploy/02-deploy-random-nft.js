const { network } = require("hardhat")
const { developmentChains, networkConfig, FUND_AMOUNT } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenURIMetadata } = require("../utils/uploadToPinata")

const imagesLocation = "./images/randomNft"

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Boringness",
            value: 100,
        },
    ],
}

let tokenURIs = [
    "ipfs://QmdhBcooiGJ3PVG1eH7FAXH6sbwWbTatYFR5xRrC5nAdJi",
    "ipfs://Qmd7mYEzVqpaFBwb1WYkw1ViAGmKvvKk5v7kdiaJZwekKW",
    "ipfs://QmXcpktmQNbefo3c77N5aPWpZMmhUrHnbQG4EwfRPqkp8p",
]

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // get the ipfs hashes of images
    // 1. own IPFS node, 2. Pinata, 3. nft.storage

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenURIs = await handleTokenURIs()
    }

    log("------------------------------------------")
    log(network.name)
    let vrfCoordinatorV2mock, vrfCoordinatorV2address, subscriptionId

    if (developmentChains.includes(network.name)) {
        // const vrfCoordinatorV2mock = await deployments.get(
        //     "VRFCoordinatorV2Mock"
        // )
        vrfCoordinatorV2mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2address = vrfCoordinatorV2mock.address
        //Create a subscription using the mock
        const txResponse = await vrfCoordinatorV2mock.createSubscription()
        const txReceipt = await txResponse.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    // await storeImages(imagesLocation)

    const randomNftArgs = [
        vrfCoordinatorV2address,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["callbackGasLimit"],
        tokenURIs,
        networkConfig[chainId]["mintFee"],
    ]

    const randomNft = await deploy("RandomIpfsNFT", {
        contract: "RandomIpfsNFT",
        from: deployer,
        args: randomNftArgs,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (developmentChains.includes(network.name)) {
        await vrfCoordinatorV2mock.addConsumer(subscriptionId.toNumber(), randomNft.address)
    }

    log("------------------------------------------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomNft.address, randomNftArgs)
    }
}

async function handleTokenURIs() {
    const tokenUris = []
    // store the image in ipfs
    // store the metadata in ipfs
    const { responsesArray: imageUploadResponses, files } = await storeImages(imagesLocation)

    for (imageUploadResponseId in imageUploadResponses) {
        // create metadata
        // upload metadata
        let tokenURIMetadata = { ...metadataTemplate }
        tokenURIMetadata.name = files[imageUploadResponseId].replace(".png", "")
        tokenURIMetadata.description = `Some random graphic content ${tokenURIMetadata.name}`
        tokenURIMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseId].IpfsHash}`
        console.log(`Uploading ${tokenURIMetadata.name}...`)

        // store JSON to Pinata/IPFS
        const metadataUploadResponse = await storeTokenURIMetadata(tokenURIMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs uploaded!")
    console.log(tokenUris)
    return tokenUris
}

module.exports.tags = ["all", "randomnft", "main"]
