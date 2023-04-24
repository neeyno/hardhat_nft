import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"
import dotenv from "dotenv"

dotenv.config()

const MAINNET_RPC_URL = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`

const SEPOLIA_RPC_URL = process.env.ALCHEMY_SEPOLIA_URL
const GOERLI_RPC_URL = process.env.ALCHEMY_GOERLI_URL
const MUMBAI_RPC_URL = process.env.ALCHEMY_MUMBAI_URL
const BSCTEST_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545"

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x141a...3x57a"
// optional
//const MNEMONIC = process.env.MNEMONIC

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.18",
        settings: {
            optimizer: {
                enabled: true,
                runs: 999,
            },
        },
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            //blockGasLimit: 12450000,
            saveDeployments: true,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
            saveDeployments: true,
        },
        mainnet: {
            url: MAINNET_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            //   accounts: {
            //     mnemonic: MNEMONIC,
            //   },
            chainId: 1,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            chainId: 5,
            //blockConfirmations: 3,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            chainId: 11155111,
        },
        bsctest: {
            url: BSCTEST_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            chainId: 97,
        },
        polygonMumbai: {
            url: MUMBAI_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            chainId: 80001,
        },
        polygon: {
            url: POLYGONSCAN_API_KEY,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            saveDeployments: true,
            chainId: 137,
        },
    },
    etherscan: {
        // npx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            sepolia: ETHERSCAN_API_KEY !== undefined ? ETHERSCAN_API_KEY : "",
            goerli: ETHERSCAN_API_KEY !== undefined ? ETHERSCAN_API_KEY : "",
            mainnet: ETHERSCAN_API_KEY !== undefined ? ETHERSCAN_API_KEY : "",
            polygonMumbai: POLYGONSCAN_API_KEY !== undefined ? POLYGONSCAN_API_KEY : "",
        },
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "ETH",
        gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
        outputFile: "gas-report.txt",
        noColors: true,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
        },
        user: {
            default: 1,
        },
    },
    mocha: {
        timeout: 300000, // 300 seconds max for running tests
    },
}

export default config
