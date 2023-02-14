const ethers = require('ethers')
const {
  SUSD_ADDRESS_ETHEREUM,
  getUSDCAddress,
  SUSD_ADDRESS_OPTIMISM,
  generateCallDataForDeposit,
  generateCallDataForSwapAndDeposit,
  getGasLimit,
  socketGetQuote,
  socketBuildTx,
  getLyraAddress,
} = require('./utils')

const depositToLyraFromDifferentChain = async (
  fromChainId,
  toChainId,
  amount,
  fromTokenAddress,
  recipientAddress,
  minDepositAmount,
  sender,
  swapSlippage = 0.5,
) => {
  try {
    let destinationToken = getUSDCAddress(toChainId)
    let destinationPayload
    let destinationGasLimit = getGasLimit(toChainId)

    if (
      fromChainId === 1 &&
      toChainId === 10 &&
      fromTokenAddress === SUSD_ADDRESS_ETHEREUM
    ) {
      destinationToken = SUSD_ADDRESS_OPTIMISM
      destinationPayload = await generateCallDataForDeposit(recipientAddress)
    } else if (toChainId === 42161) {
      destinationPayload = await generateCallDataForDeposit(recipientAddress)
    } else {
      destinationPayload = await generateCallDataForSwapAndDeposit(
        destinationToken,
        recipientAddress,
        minDepositAmount,
      )
    }

    const quote = await socketGetQuote(
      fromTokenAddress,
      destinationToken,
      amount,
      fromChainId,
      toChainId,
      getLyraAddress(toChainId),
      sender,
      swapSlippage,
      destinationGasLimit,
      destinationPayload,
    )
    if (quote.routes.length === 0) throw new Error('No routes found')
    const route = quote.routes[0]
    const destinationCallData = quote.destinationCallData

    const buildTx = await socketBuildTx(route, destinationCallData)
    return buildTx
  } catch (err) {
    console.log(err, 'Error in depositToLyraFromDifferentChain')
  }
}

const depositToLyraFromSameChain = async (
  fromTokenAddress,
  chainId,
  recipientAddress,
  destinationMinAmount,
) => {
  try {
    const toAddress = getLyraAddress(chainId)
    if (
      (chainId === 10 &&
        fromTokenAddress.toLowerCase() === SUSD_ADDRESS_OPTIMISM) ||
      (chainId === 42161 &&
        fromTokenAddress.toLowerCase() === getUSDCAddress(42161))
    ) {
      const destinationPayload = await generateCallDataForDeposit(
        recipientAddress,
      )
      const tx = {
        to: toAddress,
        data: destinationPayload,
        chainId,
      }
      return {
        tx,
        approvalData: {
          allowanceTarget: toAddress,
        },
      }
    } else {
      const destinationPayload = await generateCallDataForSwapAndDeposit(
        fromTokenAddress,
        recipientAddress,
        destinationMinAmount,
      )
      const tx = {
        to: toAddress,
        data: destinationPayload,
        chainId,
      }
      return {
        tx,
        approvalData: {
          allowanceTarget: toAddress,
        },
      }
    }
  } catch (err) {
    console.log(err, 'Error in depositToLyraFromSameChain')
  }
}

const main = async () => { 
    console.log(
        await depositToLyraFromDifferentChain(
          137,
          42161,
          2000000,
          '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
          '0x32a80b98e33c3A0E57D635C56707208D29f970a2',
          1900000,
          '0x32a80b98e33c3A0E57D635C56707208D29f970a2',
          0.5,
        ),
        'depositToLyraFromDifferentChain',
      )
      
      console.log(
       await depositToLyraFromSameChain(
          '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
          42161,
          '0x32a80b98e33c3A0E57D635C56707208D29f970a2',
          1900000,
        ),
        'depositToLyraFromSameChain',
      )
      

}

main()