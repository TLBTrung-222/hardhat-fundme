const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("FundMe", function () {
    let fundMe, deployer;
    let mockV3Aggregator;
    const sendValue = ethers.parseEther("1"); // equal to "1e18" or "1000000000000000000"

    // need to deploy our contract (using hardhat deploy) before interacting
    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer; //get the "from" account
        await deployments.fixture(["all"]); // run the scripts to deploy our contract

        fundMe = await ethers.getContract("FundMe", deployer); // get the contract object to interact
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        );
    });

    describe("constructor", function () {
        it("set the aggregator address correctly", async function () {
            const response = await fundMe.priceFeed;
            assert.equal(response, mockV3Aggregator.address);
        });
    });

    describe("fund", function () {
        it("fail if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.reverted;
        });

        it("updated the amount funded mapping", async function () {
            await fundMe.fund({ value: sendValue });
            const response = await fundMe.addressToAmountFunded(deployer);
            assert.equal(response, sendValue);
        });
        it("add funder to funders array", async function () {
            await fundMe.fund({ value: sendValue });
            const funder = await fundMe.funders(0);
            assert.equal(funder, deployer);
        });
    });

    describe("withdraw", function () {
        // the contract need to have some ether before withdrawing
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue });
        });

        it("withdraw Ether from contract to owner", async function () {
            //* Arrange
            // First, we need to retrieve the balance of the owner (deployer) and the contract
            const startingFundMeBalance = await fundMe.deployer.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            //* Act
            // Let's perform the withdraw and retrieve the result
            await fundMe.withdraw();

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            //* Assert
            // Need to compare if the contract's balance down to 0, and the owner's balance added contract's fund

            assert(endingFundMeBalance, 0);
            assert(
                endingDeployerBalance,
                startingDeployerBalance + startingFundMeBalance
            );
        });
    });
});
