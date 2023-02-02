// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";


interface ILyraDeposit {
    function initiateDeposit(address beneficiary, uint256 amountQuote) external;
}

interface UniswapRouterV3 {
    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);

    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

}

contract LyraReceiver is Ownable {
    using SafeERC20 for IERC20;
    ILyraDeposit public lyraDepositAddress;
    address public depositTokenAddress;
    address public receiverContract;
    UniswapRouterV3 public uniswapRouter;

    constructor(
        ILyraDeposit _lyraDepositAddress,
        address _depositTokenAddress,
        address _receiverContract,
        UniswapRouterV3 _uniswapRouter
    ) Ownable() {
        lyraDepositAddress = _lyraDepositAddress;
        depositTokenAddress = _depositTokenAddress;
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

        try
            uniswapRouter.exactInputSingle(
                UniswapRouterV3.ExactInputSingleParams(
                    token,
                    depositTokenAddress,
                    3000,
                    address(this),
                    block.timestamp,
                    allowance,
                    minAmountOut,
                    0
                )
            )
        returns (uint256 amountOut) {
            IERC20(depositTokenAddress).approve(
                address(lyraDepositAddress),
                amountOut
            );
            lyraDepositAddress.initiateDeposit(userAddress, amountOut);
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
