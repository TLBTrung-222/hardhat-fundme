const { network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainID = network.config.chainId;

    let ethUsdpriceFeedAddress;

    // If we on local network, retrieve price feed address from the deployed mock contract
    if (chainID == 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdpriceFeedAddress = ethUsdAggregator.address;
    }
    // If we on testnet, just need to retrieve price feed address from helper file (already configured)
    else {
        ethUsdpriceFeedAddress = networkConfig[chainID]["ethUsdPriceFeed"];
    }

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdpriceFeedAddress], // put price feed address
        log: true,
        // wait for block confirmation defined at config file (or 1 if not defined yet)
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    log("FundMe contract deployed!");
    log("-----------------------------------------------------------------");

    //* If we are on testnet, we will verify this contract
    if (chainID != 31337 && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, [ethUsdpriceFeedAddress]);
    }
};

module.exports.tags = ["all", "fundme"];
