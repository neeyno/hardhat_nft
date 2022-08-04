const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const pinataApiKey = process.env.PINATA_API_KEY
const pinataApiSecret = process.env.PINATA_API_SECRET
const pinata = pinataSDK(pinataApiKey, pinataApiSecret)

async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath) // ./images/randomNft/
    const files = fs.readdirSync(fullImagesPath)
    //console.log(files)
    let responsesArray = []
    console.log("Uploading to Pinata...")
    for (fileIndex in files) {
        console.log(`Processing ${fileIndex}`)
        const readableStreamForFile = fs.createReadStream(
            `${fullImagesPath}/${files[fileIndex]}`
        )
        try {
            const response = await pinata.pinFileToIPFS(
                readableStreamForFile
                /* options */
            )
            responsesArray.push(response)
        } catch (error) {
            console.log(error)
        }
    }
    return { responsesArray, files }
}

async function storeTokenURIMetadata(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(
            metadata
            /* options */
        )
        return response
    } catch (error) {
        console.log(error)
    }
}

module.exports = { storeImages, storeTokenURIMetadata }
