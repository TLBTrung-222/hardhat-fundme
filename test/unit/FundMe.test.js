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
            const startingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );
            const startingDeployerBalance = await ethers.provider.getBalance(
                deployer
            );

            //* Act
            // Let's perform the withdraw and retrieve the result
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);

            const endingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );
            const endingDeployerBalance = await ethers.provider.getBalance(
                deployer
            );

            //* Assert
            // Need to compare if the contract's balance down to 0, and the owner's balance added contract's fund

            assert.equal(endingFundMeBalance, 0);
            // assert.equal(
            //     endingDeployerBalance,
            //     startingDeployerBalance + startingFundMeBalance
            // );
        });
    });
});
