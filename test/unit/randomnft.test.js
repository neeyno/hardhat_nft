const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIPFS NFT test", function () {
          let randomNft, deployer, vrfCoordinatorV2mock, mintFee
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["mocks", "randomnft"])
              randomNft = await ethers.getContract("RandomIpfsNFT", deployer)
              vrfCoordinatorV2mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              mintFee = await randomNft.getMintFee()
          })

          describe("Constructor", function () {
              it("sets mint fee to 0.01 ETH", async () => {
                  const expectedMintFee = networkConfig[chainId].mintFee
                  //const mintFee = await randomNft.getMintFee()
                  assert.equal(expectedMintFee, mintFee.toString())
              })

              it("initializes with token counter 0", async () => {
                  const tokenCounter = await randomNft.getTokenCounter()
                  assert.equal("0", tokenCounter.toString())
              })

              it("sets token URIs correctly", async () => {
                  const expectedTokenURIs = [
                      "ipfs://QmdhBcooiGJ3PVG1eH7FAXH6sbwWbTatYFR5xRrC5nAdJi",
                      "ipfs://Qmd7mYEzVqpaFBwb1WYkw1ViAGmKvvKk5v7kdiaJZwekKW",
                      "ipfs://QmXcpktmQNbefo3c77N5aPWpZMmhUrHnbQG4EwfRPqkp8p",
                  ]
                  const tokenURIs0 = await randomNft.getNftTokenUri(0)
                  assert.equal(expectedTokenURIs[0], tokenURIs0)
              })
          })

          describe("Minting IPFS NFTs", function () {
              describe("requestNFT", function () {
                  it("reverts if not enough ETH sent", async () => {
                      await expect(randomNft.requestNFT()).to.be.revertedWith(
                          "RandomIpfsNFT__NotEnoughETH()"
                      )
                  })

                  it("emits event on requesting randomness", async function () {
                      await expect(randomNft.requestNFT({ value: mintFee })).to.emit(
                          randomNft,
                          "NftRequested"
                      )
                  })

                  it("should call random request", async function () {
                      const txResponse = await randomNft.requestNFT({
                          value: mintFee,
                      })
                      const txReceipt = await txResponse.wait(1)
                      const requestId = txReceipt.events[1].args.requestId
                      assert.isAbove(requestId.toNumber(), 0, "requestId > 0")
                  })
              })

              describe("fulfillRandomWords", function () {
                  let txRandomNft, txReceiptRandomNft
                  beforeEach(async function () {
                      txRandomNft = await randomNft.requestNFT({
                          value: mintFee,
                      })
                      txReceiptRandomNft = await txRandomNft.wait(1)
                  })

                  it("increments token counter by 1", async () => {
                      await vrfCoordinatorV2mock.fulfillRandomWords(
                          txReceiptRandomNft.events[1].args.requestId,
                          randomNft.address
                      )
                      const tokenCounterAfter = await randomNft.getTokenCounter()
                      assert.equal("1", tokenCounterAfter.toString())
                  })

                  it("emits event when nft was minted", async () => {
                      const [nftOwner] = await ethers.getSigners()
                      await expect(
                          vrfCoordinatorV2mock.fulfillRandomWords(
                              txReceiptRandomNft.events[1].args.requestId,
                              randomNft.address
                          )
                      )
                          .to.emit(randomNft, "NftMinted")
                          .withArgs(2, nftOwner.address)
                  })
              })
          })

          describe("Withdraw", function () {
              it("withdraws funds", async function () {
                  const [, user] = await ethers.getSigners()
                  const tx1 = await randomNft.connect(user).requestNFT({
                      value: mintFee,
                  })
                  const tx1Receipt = await tx1.wait(1)
                  const contractBalanceBefore = await ethers.provider.getBalance(randomNft.address)
                  const ownerBalanceBefore = await ethers.provider.getBalance(deployer)
                  const tx2 = await randomNft.withdraw()
                  const tx2Receipt = await tx2.wait(1)
                  const { gasUsed, effectiveGasPrice } = tx2Receipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const ownerBalanceAfter = await ethers.provider.getBalance(deployer)
                  const contractBalanceAfter = await ethers.provider.getBalance(randomNft.address)

                  // assert
                  assert.equal(
                      contractBalanceBefore.add(ownerBalanceBefore).toString(),
                      ownerBalanceAfter.add(gasCost).toString()
                  )
                  assert.equal(contractBalanceAfter, 0)
              })

              it("only Owner able to call withdraw", async function () {
                  const [, attacker] = await ethers.getSigners()
                  await expect(randomNft.connect(attacker).withdraw()).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                  )
              })
          })
      })

// it("", async () => {})
