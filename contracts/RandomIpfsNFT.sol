// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

pragma solidity ^0.8.7;

error RandomIpfsNFT__RangeOutOfBounds();
error RandomIpfsNFT__NotEnoughETH();
error RandomIpfsNFT__TransferFailed();

contract RandomIpfsNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    //Type declaration
    enum Types {
        type_one,
        type_two,
        type_three
    }

    //Chainlink VRF variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callBackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF helpers
    mapping(uint256 => address) public s_requestIdToSender;

    // Nft variables
    uint256 private s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_tokenUris; // = ["a", "b", "c"]
    uint256 internal immutable i_mintFee;

    //Events
    event NftRequested(uint256 indexed requestId, address indexed sender);
    event NftMinted(Types imageType, address minter);

    constructor(
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callBackGasLimit,
        string[3] memory tokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinator) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callBackGasLimit = callBackGasLimit;
        i_mintFee = mintFee;
        s_tokenUris = tokenUris;
    }

    function requestNFT() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNFT__NotEnoughETH();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, //key hash
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callBackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        address nftOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        s_tokenCounter = s_tokenCounter + 1;
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        Types imageType = getImageTypeFromModdedRNG(moddedRng);
        _safeMint(nftOwner, newTokenId);
        _setTokenURI(newTokenId, s_tokenUris[uint256(imageType)]);
        emit NftMinted(imageType, nftOwner);
    }

    // modifier OnlyOwner() {
    //     if (msg.sender != i_owner) {
    //         revert RandomIpfsNFT__OnlyOwner();
    //     }
    //     _;
    // }

    function withdraw() public payable onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNFT__TransferFailed();
        }
    }

    // function tokenURI(
    //     uint256 /* tokenId */
    // ) public view override returns (string memory) {
    //     //require exists(tokenId)
    //     //return TOKEN_URI;
    // }

    function getImageTypeFromModdedRNG(uint256 moddedRng)
        public
        pure
        returns (Types)
    {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint256 i; i < chanceArray.length; i++) {
            if (
                moddedRng >= cumulativeSum &&
                moddedRng < cumulativeSum + chanceArray[i]
            ) {
                return Types(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIpfsNFT__RangeOutOfBounds();
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getNftTokenUri(uint256 index) public view returns (string memory) {
        return s_tokenUris[index];
    }
}
