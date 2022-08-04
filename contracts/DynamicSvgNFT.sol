// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

pragma solidity ^0.8.7;

contract DynamicSvgNFT is ERC721 {
    uint256 private s_tokenCounter;
    string private i_lowImageURI;
    string private i_highImageURI;
    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";
    AggregatorV3Interface private immutable i_priceFeed;
    mapping(uint256 => int256) private s_tokenIdToHighValue;

    event NFTCreated(uint256 indexed tokenId, int256 highValue);

    constructor(
        address priceFeedAddress,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Dynamic SVG NFT", "DSN") {
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
        s_tokenCounter = 0;
        i_lowImageURI = svgToImageUri(lowSvg);
        i_highImageURI = svgToImageUri(highSvg);
    }

    function svgToImageUri(string memory svg) public pure returns (string memory) {
        string memory base64SvgEncoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(base64EncodedSvgPrefix, base64SvgEncoded));
    }

    function mintNft(int256 highValue) public {
        s_tokenCounter = s_tokenCounter + 1;
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        emit NFTCreated(s_tokenCounter, highValue);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI Query for nonexistent token");

        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = i_lowImageURI;
        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_highImageURI;
        }
        // ETH/USD rate in 18 digit
        //return uint256(price * 1e10);

        // data:image/svg+xml;base64,
        // data:application/json;base64,
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(),
                                '", "description": "An NFT that changes based on the Chainlink Feed", ',
                                '"attributes": [{"trait_type": "randomness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getPriceFeedAddress() public view returns (AggregatorV3Interface) {
        return i_priceFeed;
    }

    function getImageURIs() public view returns (string memory, string memory) {
        return (i_lowImageURI, i_highImageURI);
    }

    function getHighValueByTokenId(uint256 tokenId) public view returns (int256) {
        return s_tokenIdToHighValue[tokenId];
    }
}
