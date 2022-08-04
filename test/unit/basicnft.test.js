const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic nft test", async function () {
          let basicnft, deployer
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = await getNamedAccounts().deployer
              await deployments.fixture(["basicnft"])
              basicnft = await ethers.getContract("BasicNFT", deployer)
          })

          describe("Contructor", function () {
              it("sets token name correctly", async () => {
                  const actualName = await basicnft.name()
                  assert.equal("Dogie", actualName)
              })

              it("sets token symbol correctly", async () => {
                  const actualSymbol = await basicnft.symbol()
                  assert.equal("DOG", actualSymbol)
              })

              it("initializes with token counter 0", async () => {
                  const tokenCounter = await basicnft.getTokenCounter()
                  assert.equal("0", tokenCounter.toString())
              })
          })

          describe("Minting nft", function () {
              it("increments token counter by 1", async () => {
                  const tx = await basicnft.mintNFT()
                  const txReceipt = await tx.wait(1)
                  const tokenCounter = await basicnft.getTokenCounter()
                  assert.equal("1", tokenCounter.toString())
              })

              it("mints an NFT", async () => {
                  const tx = await basicnft.mintNFT()
                  await tx.wait(1)
                  const tokenURI = await basicnft.tokenURI(0)
                  assert.equal(tokenURI, await basicnft.TOKEN_URI())
              })
          })
      })
