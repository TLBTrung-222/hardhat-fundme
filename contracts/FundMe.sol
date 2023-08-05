// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceConverter.sol";

error FundMe__NotOwner();

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant minimumUSD = 10 * 1e18;

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;
    address public immutable i_owner;
    AggregatorV3Interface priceFeed;

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(priceFeed) >= minimumUSD,
            "Didn't send enough ETH"
        );
        address funder = msg.sender;
        funders.push(funder);
        addressToAmountFunded[funder] = msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funderAddress = funders[funderIndex];
            addressToAmountFunded[funderAddress] = 0;
        }
        funders = new address[](0);

        // withdraw the funds using call method
        (bool callSuccess /* bytes dataReturned*/, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Send failed");
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return priceFeed;
    }
}
