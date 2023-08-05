require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy-ethers");
require("hardhat-deploy");
require("dotenv").config();
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

module.exports = {
    defaultNetwork: "hardhat",
    solidity: "0.8.8",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY], // a list of account we give to hardhat
            chainId: 11155111,
            blockConfirmations: 3,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            // accounts already provided by hardhat. Thanks hardhat
            chainId: 31337, // the same chainID with hardhat network
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: false,
        outputFile: "gasReport.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer.
            // Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
    },
};
