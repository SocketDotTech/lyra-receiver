const ethers = require('ethers')
const LyraReceiverAbi = require('./LyraReceiverABI.json')
const axios = require('axios')
const SOCKET_API_KEY =
  process.env.SOCKET_API_KEY || '615deab3-3ead-4480-a59b-b0fc53d2d592'

const LYRA_DATA_CHAIN_WISE = {
  42161: {
    lyraWrapper: '0x1765b308001753901c7A676d0E1cCE5d03e18dd0',
    USDC_ADDRESS: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    gasLimit: 2000000,
  },
  10: {
    lyraWrapper: '0x6CF8D2BF45fE99E369Db145fAF6fb606A50B27f3',
    USDC_ADDRESS: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    gasLimit: 700000,
  },
}

const SUSD_ADDRESS_ETHEREUM = '0x57ab1ec28d129707052df4df418d58a2d46d5f51'
const SUSD_ADDRESS_OPTIMISM = '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9'
const getLyraAddress = (chainId) => {
  return LYRA_DATA_CHAIN_WISE[chainId].lyraWrapper
}

const getGasLimit = (chainId) => {
  return LYRA_DATA_CHAIN_WISE[chainId].gasLimit
}

const getUSDCAddress = (chainId) => {
  return LYRA_DATA_CHAIN_WISE[chainId].USDC_ADDRESS
}

const generateCallDataForSwapAndDeposit = async (
  token,
  userAddress,
  minAmountOut,
) => {
  const lyraReceiverInterface = new ethers.Interface(LyraReceiverAbi)
  const callData = lyraReceiverInterface.encodeFunctionData('swapAndDeposit', [
    token,
    userAddress,
    minAmountOut,
  ])
  return callData
}

const generateCallDataForDeposit = async (userAddress) => {
  const lyraReceiverInterface = new ethers.Interface(LyraReceiverAbi)
  const callData = lyraReceiverInterface.encodeFunctionData('deposit', [
    userAddress,
  ])
  return callData
}

const socketGetQuote = async (
  fromToken,
  toToken,
  amount,
  fromChainId,
  toChainId,
  recipient,
  sender,
  swapSlippage,
  destinationGasLimit,
  destinationPayload,
) => {
  try {
    const url = `https://api.socket.tech/v2/quote?fromTokenAddress=${fromToken}&fromChainId=${fromChainId}&toTokenAddress=${toToken}&toChainId=${toChainId}&fromAmount=${amount}&userAddress=${sender}&recipient=${recipient}&singleTxOnly=true&defaultSwapSlippage=${swapSlippage}&destinationPayload=${destinationPayload}&destinationGasLimit=${destinationGasLimit}`
    const response = await axios.get(url, {
      headers: {
        'api-key': SOCKET_API_KEY,
      },
    })

    if (response.data.success) {
      return response.data.result
    } else {
      throw new Error('No response from Socket API')
    }
  } catch (err) {
    throw new Error('Error in Socket API')
  }
}

const socketBuildTx = async (
  route,
  destinationCallData,
) => {
  try {
    const url = `https://api.socket.tech/v2/build-tx`
    const body = JSON.stringify({ route, destinationCallData  })
    const response = await axios.post(url, body, { headers: { 
      'api-key': SOCKET_API_KEY,
      'Content-Type': 'application/json'
    }})

    if (response.data.success) {
      return response.data.result
    } else {
      throw new Error('No response from Socket API')
    }
  } catch (err) {
    // console.log(err)
    throw new Error('Error in Socket API')
  }
}

module.exports = {
  getLyraAddress,
  getGasLimit,
  generateCallDataForSwapAndDeposit,
  generateCallDataForDeposit,
  SUSD_ADDRESS_ETHEREUM,
  socketGetQuote,
  getUSDCAddress,
  SUSD_ADDRESS_OPTIMISM,
  socketBuildTx
}
