import pinataSDK, { PinataPinResponse } from "@pinata/sdk"
import path from "path"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

const pinataApiKey = process.env.PINATA_API_KEY as string
const pinataApiSecret = process.env.PINATA_API_SECRET as string
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret)

async function storeImages(imagesFilePath: string) {
    const fullImagesPath = path.resolve(imagesFilePath) // ./images/randomNft/
    const files = fs.readdirSync(fullImagesPath)

    let responsesArray: PinataPinResponse[] = []

    console.log("Uploading to Pinata...")
    for (const fileIndex in files) {
        console.log(`Processing ${fileIndex}`)

        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)

        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile)
            responsesArray.push(response)
        } catch (error) {
            console.log(error)
        }
    }
    return { responsesArray, files }
}

async function storeTokenURIMetadata(
    metadata: Record<string, unknown>
): Promise<PinataPinResponse | undefined> {
    try {
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (error) {
        console.log(error)
    }
}

export { storeImages, storeTokenURIMetadata }

/* 
async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath) // ./images/randomNft/
    const files = fs.readdirSync(fullImagesPath)

    //console.log(files)
    let responsesArray = []
    console.log("Uploading to Pinata...")
    for (fileIndex in files) {
        console.log(`Processing ${fileIndex}`)
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        try {
            const response = await pinata.pinFileToIPFS(
                readableStreamForFile
               
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
        
        )
        return response
    } catch (error) {
        console.log(error)
    }
}

module.exports = { storeImages, storeTokenURIMetadata }

*/
