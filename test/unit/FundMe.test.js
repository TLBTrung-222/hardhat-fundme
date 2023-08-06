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

        // Let's check with only one funder and see if the withdraw function work as expected
        it("withdraw Ether from contract with one funder", async function () {
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

            // Calculate gas cost for this transcation
            const { gasPrice, gasUsed } = transactionReceipt;
            const gasCost = gasPrice * gasUsed;

            const endingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );
            const endingDeployerBalance = await ethers.provider.getBalance(
                deployer
            );

            //* Assert
            // Need to compare if the contract's balance down to 0, and the owner's balance added contract's fund

            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                endingDeployerBalance,
                startingDeployerBalance + startingFundMeBalance - gasCost
            );
        });

        // Now let's check with multiple funder
        // Just like check with one funder, but now we need to check if the funders data structure
        // got reset properly or not
        it("withdraw Ether from contract with mutiple funders", async function () {
            //* Arrange
            // Loop through all account, connect to our contract and call fund function on each account
            const accounts = ethers.getSigners();
            for (let index = 0; index < accounts.length; index++) {
                const accountToConnect = accounts[index];
                // Connect this account to fund me contract
                const fundMeConnectedContract =
                    fundMe.connect(accountToConnect);
                await fundMeConnectedContract.fund({ value: sendValue });
            }

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

            // Calculate gas cost for this transcation
            const { gasPrice, gasUsed } = transactionReceipt;
            const gasCost = gasPrice * gasUsed;

            const endingFundMeBalance = await ethers.provider.getBalance(
                await fundMe.getAddress()
            );
            const endingDeployerBalance = await ethers.provider.getBalance(
                deployer
            );

            //* Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                endingDeployerBalance,
                startingDeployerBalance + startingFundMeBalance - gasCost
            );

            // Need to check for the funder reset

            // Array reset (the array resetted so if we access the first elemet, it's will be reverted)
            await expect(fundMe.funders(0)).to.be.reverted;

            // Mapping reset
            for (
                let index = 0;
                index < fundMe.addressToAmountFunded.length;
                index++
            ) {
                assert.equal(
                    await fundMe.addressToAmountFunded(accounts[i].address),
                    0
                );
            }
        });
    });
});
