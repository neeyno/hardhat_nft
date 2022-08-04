const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
    svgsJSON,
    encodedSvgs,
} = require("../../helper-hardhat-config")
// const SVGs = require("../../dynamicSVGs.json")
//const fs = require("fs")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("DynamicSVG NFT test", async function () {
          let dynamicNft, deployer, mockV3aggregator

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["mocks", "dynamicnft"])
              dynamicNft = await ethers.getContract("DynamicSvgNFT", deployer)
              mockV3aggregator = await ethers.getContract("MockV3Aggregator", deployer)
          })

          describe("Constructor", function () {
              it("sets the aggregator address", async () => {
                  const priceFeedAddress = await dynamicNft.getPriceFeedAddress()
                  assert.equal(priceFeedAddress, mockV3aggregator.address)
              })

              it("initializes with token counter 0", async () => {
                  const tokenCounter = await dynamicNft.getTokenCounter()
                  assert.equal("0", tokenCounter.toString())
              })

              it("sets the low and high Image URIs", async () => {
                  const [lowSVG, highSVG] = await dynamicNft.getImageURIs()
                  assert.equal(svgsJSON[0].image, lowSVG)
                  assert.equal(svgsJSON[1].image, highSVG)
              })
          })

          describe("Minting SVG NFTs", function () {
              const highValue = ethers.utils.parseEther("1") // 1 dollar per ether
              beforeEach(async function () {
                  const tx = await dynamicNft.mintNft(highValue)
                  await tx.wait(1)
              })

              it("increments token counter by 1", async () => {
                  const tokenCounter = await dynamicNft.getTokenCounter()
                  assert.equal("1", tokenCounter.toString())
              })

              it("sets high value according to tokenId", async () => {
                  const tokenCounter = await dynamicNft.getTokenCounter()
                  const actualHighValue = await dynamicNft.getHighValueByTokenId(
                      tokenCounter.toString()
                  )
                  assert.equal(highValue, actualHighValue.toString())
              })

              it("emits event when nft was minted", async () => {
                  //const [nftOwner] = await ethers.getSigners()
                  await expect(dynamicNft.mintNft(highValue))
                      .to.emit(dynamicNft, "NFTCreated")
                      .withArgs(2, highValue)
              })

              it("checks that minted nft belongs to minter", async () => {
                  const actualNftOwner = await dynamicNft.ownerOf("1")
                  assert.equal(deployer, actualNftOwner)
              })
          })

          describe("Dynamic token URI", function () {
              it("sets Low image URI if price below high value", async () => {
                  // price < s_tokenIdToHighValue[tokenId]
                  const highValue = ethers.utils.parseEther("2001") // 2001 dollar per ether
                  const tx = await dynamicNft.mintNft(highValue)
                  await tx.wait(1)
                  const tokenCounter = await dynamicNft.getTokenCounter()
                  const actualImageUri = await dynamicNft.tokenURI(tokenCounter)
                  assert.equal(encodedSvgs[0], actualImageUri.toString())
              })

              it("sets High image URI if price equal to high value", async () => {
                  //price >= s_tokenIdToHighValue[tokenId]
                  const highValue = ethers.utils.parseEther("2000") // 2000 dollar per ether
                  const tx = await dynamicNft.mintNft(highValue)
                  await tx.wait(1)
                  const tokenCounter = await dynamicNft.getTokenCounter()
                  const actualImageUri = await dynamicNft.tokenURI(tokenCounter)
                  assert.equal(encodedSvgs[1], actualImageUri.toString())
              })

              it("sets High image URI if price above of high value", async () => {
                  //price >= s_tokenIdToHighValue[tokenId]
                  const highValue = ethers.utils.parseEther("1000") // 1000 dollar per ether
                  const tx = await dynamicNft.mintNft(highValue)
                  await tx.wait(1)
                  const tokenCounter = await dynamicNft.getTokenCounter()
                  const actualImageUri = await dynamicNft.tokenURI(tokenCounter)
                  assert.equal(encodedSvgs[1], actualImageUri)
              })
          })
      })
