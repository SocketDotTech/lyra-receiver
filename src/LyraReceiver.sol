// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";


interface ILyraDeposit {
    function initiateDeposit(address beneficiary, uint256 amountQuote) external;
}

interface UniswapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract LyraReceiver is Ownable {
    using SafeERC20 for IERC20;
    ILyraDeposit public lyraDepositAddress;
    address public depositTokenAddress;
    address public receiverContract;
    UniswapRouter public uniswapRouter;
    uint256 public transferCost;

    constructor(
        ILyraDeposit _lyraDepositAddress,
        address _depositTokenAddress,
        address _receiverContract,
        uint256 _transferCost,
        UniswapRouter _uniswapRouter
    ) Ownable() {
        lyraDepositAddress = _lyraDepositAddress;
        depositTokenAddress = _depositTokenAddress;
        transferCost = _transferCost;
        receiverContract = _receiverContract;
        uniswapRouter = _uniswapRouter;
    }

    function swapAndDeposit(
        address token,
        address userAddress,
        uint256 minAmountOut
    ) external {
        uint256 allowance = IERC20(token).allowance(
            receiverContract,
            address(this)
        );
        IERC20(token).approve(address(uniswapRouter), allowance);
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = depositTokenAddress;
        try
            uniswapRouter.swapExactTokensForTokens(
                allowance,
                minAmountOut,
                path,
                address(this),
                block.timestamp
            )
        returns (uint256[] memory amounts) {
            uint256 depositAmount = amounts[1];
            IERC20(depositTokenAddress).approve(
                address(lyraDepositAddress),
                depositAmount
            );
            lyraDepositAddress.initiateDeposit(userAddress, depositAmount);
        } catch {
            IERC20(token).transfer(userAddress, allowance);
        }
    }

    function deposit(address userAddress) external {
        uint256 allowance = IERC20(depositTokenAddress).allowance(
            receiverContract,
            address(this)
        );
        IERC20(depositTokenAddress).approve(
            address(lyraDepositAddress),
            allowance
        );
        try
            lyraDepositAddress.initiateDeposit(userAddress, allowance)
        {} catch {
            IERC20(depositTokenAddress).transfer(userAddress, allowance);
        }
    }

    function rescueTokens(address token, address to, uint256 amount) onlyOwner external  {
        IERC20(token).transfer(to, amount);
    }

    function rescueEth(address payable to, uint256 amount) onlyOwner external {
        to.transfer(amount);
    }
}
