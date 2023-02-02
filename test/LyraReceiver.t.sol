// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/LyraReceiver.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract LyraReceiverTesting is Test {
    LyraReceiver lyraReceiver;

    function setUp() public {
        // set blockNumber to 71879983
        uint256 fork = vm.createFork("https://mainnet.optimism.io", 71879983);
        vm.selectFork(fork);
        lyraReceiver = new LyraReceiver();
    }

    function testSwapAndDesposit() public {
        vm.startPrank(0x86791C7b7Ea5F77b1612eCc300dD44ba3A1C9083);

        uint256 amount = 1200000;
        
        address tokenAddress = 0x7F5c764cBc14f9669B88837ca1490cCa17c31607;
        IERC20(tokenAddress).approve(address(lyraReceiver), amount);
        lyraReceiver.swapAndDeposit(tokenAddress, 0x86791C7b7Ea5F77b1612eCc300dD44ba3A1C9083, 0);
        vm.stopPrank();
    }



}
