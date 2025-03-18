// @flow
import { MinerPoolCreditStat } from '../types'
import { COINS_PER_BLOCK } from '@/constants/constants'

export const ellipsizeString = (input: string, length: number) => {
  const inputLength = input.length
  const halfway = length / 2
  const firstHalf = input.slice(0, halfway)
  const secondHalf = input.slice(inputLength - halfway, inputLength)
  const output = `${firstHalf}...${secondHalf}`
  return output
}

export const getTimeMeasurement = (inMinutes: number): string => {
  switch (true) {
    case inMinutes < 1:
      return 'seconds'

    case inMinutes < 60:
      return 'minutes'

    case inMinutes < 1440:
      return 'hours'

    case inMinutes <= 84960:
      return 'days'

    default:
      return ''
  }
}

export const getTimeWithMeasurement = (inMinutes: number): { measurement: string, value: number } => {
  const measurement = getTimeMeasurement(inMinutes)

  const measurements = {
    seconds (minutes) {
      const val = Math.round(minutes * 60)
      return val
    },
    minutes (minutes) {
      return minutes
    },
    hours (minutes) {
      return minutes / 60
    },
    days (minutes) {
      return minutes / 24 / 60
    }
  }
  const strategy = measurements[measurement]

  if (!strategy) {
    console.error(`No strategy for particular measurement: ${measurement}`)
    return { measurement: '', value: Infinity }
  }
  return {
    measurement,
    value: strategy(inMinutes)
  }
}
export const getTimeInMinutes = (params: { measurement: string, value: number }): number => {
  const { measurement, value } = params
  const measurementStrategies = {
    seconds (v) {
      const val = Math.round(v / 60 * 100) / 100
      return val
    },
    minutes (v) {
      return v
    },
    hours (v) {
      return v * 60
    },
    days (v) {
      return v * 24 * 60
    }
  }
  const strategy = measurementStrategies[measurement]

  if (!strategy) {
    console.error(`No strategy for particular measurement: ${measurement}`)
    return Infinity
  }
  return strategy(value)
}

export function secondsToHms (d: number) {
  d = Number(d)
  const h = Math.floor(d / 3600)
  const m = Math.floor(d % 3600 / 60)
  const s = Math.floor(d % 3600 % 60)
  let sDisplay = ''
  const hDisplay = h > 0 ? h + 'h ' : ''
  const mDisplay = m > 0 ? m + 'm ' : ''
  if (h === 0) {
    sDisplay = s > 0 ? s + 's ' : ''
  }

  return hDisplay + mDisplay + sDisplay
}

export const nanoMWCToMWC = (nanoMWC: number) => {
  return nanoMWC / 1000000000
}

export const MWCToNanoMWC = (nanoMWC: number) => {
  return nanoMWC * 1000000000
}

export const getMinerBlockRewardData = (height: number, networkData: Array<any>, mwcPoolData: Array<any>, minerShareData: Object, selectedRigWorker?: string): Object | null => {
  const compiledShareData = {}
  let cumulativeMinerC31Shares = 0
  networkData.forEach(block => {
    if ((block.height > height) || (block.height <= height - 240)) return
    const blockData = minerShareData[`block_${block.height}`]
    let minerShareBlockData
    if (blockData) {
      minerShareBlockData = selectedRigWorker ? blockData[selectedRigWorker] : blockData
    }
    let c31Shares = 0
    if (minerShareBlockData) {
      c31Shares = minerShareBlockData.c31ValidShares ? minerShareBlockData.c31ValidShares : 0
      cumulativeMinerC31Shares += c31Shares
    }
    compiledShareData[`block_${block.height}`] = {
      height: block.height,
      secondary_scaling: block.secondary_scaling,
      minerC31: c31Shares
    }
  })
  let cumulativePoolC31Shares = 0
  mwcPoolData.forEach(block => {
    if (compiledShareData[`block_${block.height}`]) {
      if (block.share_counts) {
        compiledShareData[`block_${block.height}`].poolC31 = block.share_counts.C31 ? block.share_counts.C31.valid : 0
        if (block.share_counts.C31) cumulativePoolC31Shares += block.share_counts.C31.valid
      }
    }
  })
  for (const key in compiledShareData) {
    const blockHeight = parseInt(key.replace('block_', ''))
    if (blockHeight > height || blockHeight <= height - 240) delete compiledShareData[key]
  }
  const calculatedBlockRewardData = calculateBlockReward(compiledShareData)
  if (!calculateBlockReward) return null
  const output = {
    ...calculatedBlockRewardData,
    cumulativeMinerC31Shares,
    cumulativePoolC31Shares
  }
  return output
}

export const calculateBlockReward = (compiledBlockShareData: {[string]: Object}): { poolCredit: number, userCredit: number, userReward: number} | null => {
  let aggregatedPoolCredit = 0
  let aggregatedUserCredit = 0
  const compiledShareDataKeys = Object.keys(compiledBlockShareData)
  if (compiledShareDataKeys.length !== 240) {
    return null
  }
  compiledShareDataKeys.forEach(key => {
    if (!compiledBlockShareData[key]) console.log('compiledShareData issue on: ', key)
    const blockShareCredits = calculateCreditFromStat(compiledBlockShareData[key])
    aggregatedPoolCredit += blockShareCredits.pool
    aggregatedUserCredit += blockShareCredits.miner
  })

  if (aggregatedPoolCredit === 0) return null
  const portion = aggregatedUserCredit / aggregatedPoolCredit
  const userReward = COINS_PER_BLOCK * portion
  return {
    userReward,
    poolCredit: aggregatedPoolCredit,
    userCredit: aggregatedUserCredit
  }
}

export const calculateCreditFromStat = (block: MinerPoolCreditStat): { miner: number, pool: number} => {
  if (!block) return { miner: 0, pool: 0 } // this needs fixing
  const weight = Math.pow(2, (1 + 31 - 24)) * 31

  const minerC31Credit = block.minerC31 ? block.minerC31 * weight : 0
  const poolC31Credit = block.poolC31 ? block.poolC31 * weight : 0

  const miner = minerC31Credit
  const pool = poolC31Credit
  if (isNaN(miner) || isNaN(pool)) {
    console.log('missing data')
  }
  return {
    miner,
    pool
  }
}

export const calculateDailyEarningFromGps = (networkData: Array<Object>, minerData: Array<Object>, latestHeight: number, selectedRigWorker?: string): number => {
  const minerTotalGps = { c31: 0 }
  let networkTotalC31Gps = 0

  if (minerData.length === 0) return 0
  const algos = [31]
  if (selectedRigWorker) {
    algos.forEach(algo => {
      if (minerData[`c${algo}`]) {
        minerData[`c${algo}`].forEach(block => {
          if (block.height > latestHeight - 5 || block.height < latestHeight - 245) return
          minerTotalGps[`c${algo}`] += block[selectedRigWorker] ? block[selectedRigWorker] : 0
        })
      }
    })
  } else {
    minerData.forEach(block => {
      if (block.height > latestHeight - 5 || block.height < latestHeight - 245) return
      block.gps.forEach(algo => {
        if (algo.edge_bits === 31) {
          minerTotalGps.c31 += algo.gps
        }
      })
    })
  }
  networkData.forEach(block => {
    if (block.height > latestHeight - 5 || block.height < latestHeight - 245) return
    block.gps.forEach(algo => {
      if (algo.edge_bits === 31) {
        networkTotalC31Gps += algo.gps
      }
    })
  })

  const minerAverageC31 = minerTotalGps.c31 / 240
  const networkAverageC31 = networkTotalC31Gps / 240
  const weight = Math.pow(2, (1 + 31 - 24)) * 31

  const minerC31Credit = minerAverageC31 ? minerAverageC31 * weight : 0
  const networkC31Credit = networkAverageC31 ? networkAverageC31 * weight : 0
  const minerAggregateCredit = minerC31Credit
  const networkAggregateCredit = networkC31Credit

  const result = (minerAggregateCredit / networkAggregateCredit) * COINS_PER_BLOCK * 60 * 24
  if (!selectedRigWorker) {
  }
  return result
}

export const basicAuth = (token: string) => {
  const auth = 'Basic ' + token
  // const auth = 'Basic ' + Buffer.from(token + ':' + 'random').toString('base64')
  return auth
}

export const basicAuthLegacy = (token: string) => {
  // const auth = 'Basic ' + token
  const auth = 'Basic ' + Buffer.from(token + ':' + 'random').toString('base64')
  return auth
}

export const getRandomColor = () => {
  const red = 50 + Math.floor(Math.random() * 205)
  const green = 50 + Math.floor(Math.random() * 205)
  const blue = 50 + Math.floor(Math.random() * 205)
  const output = `rgb(${red}, ${green}, ${blue})`
  return output
}

export const randomColors = [
  'rgb(113, 180, 181)',
  'rgb(251, 141, 226)',
  'rgb(185, 212, 126)',
  'rgb(50, 103, 219)',
  'rgb(239, 113, 50)',
  'rgb(196, 152, 209)',
  'rgb(68, 99, 71)',
  'rgb(216, 221, 165)',
  'rgb(112, 178, 74)',
  'rgb(63, 95, 250)',
  'rgb(242, 123, 201)',
  'rgb(141, 69, 192)',
  'rgb(200, 158, 96)',
  'rgb(152, 117, 245)',
  'rgb(146, 250, 162)',
  'rgb(166, 186, 176)',
  'rgb(195, 126, 219)',
  'rgb(67, 132, 110)',
  'rgb(193, 216, 235)',
  'rgb(131, 113, 116)',
  'rgb(87, 226, 64)',
  'rgb(50, 98, 152)',
  'rgb(64, 218, 254)',
  'rgb(221, 192, 56)',
  'rgb(186, 52, 170)',
  'rgb(155, 54, 171)',
  'rgb(248, 68, 253)',
  'rgb(182, 246, 160)',
  'rgb(77, 226, 158)',
  'rgb(136, 177, 60)',
  'rgb(94, 77, 239)',
  'rgb(247, 207, 105)',
  'rgb(80, 248, 154)',
  'rgb(80, 206, 243)',
  'rgb(198, 189, 64)',
  'rgb(222, 250, 96)',
  'rgb(94, 222, 76)',
  'rgb(236, 96, 148)',
  'rgb(69, 178, 153)',
  'rgb(109, 154, 61)',
  'rgb(177, 231, 176)',
  'rgb(235, 114, 190)',
  'rgb(105, 57, 145)',
  'rgb(178, 123, 151)',
  'rgb(175, 223, 98)',
  'rgb(159, 108, 97)',
  'rgb(55, 218, 174)',
  'rgb(146, 63, 205)',
  'rgb(55, 154, 237)',
  'rgb(86, 215, 170)',
  'rgb(201, 113, 128)',
  'rgb(134, 84, 235)',
  'rgb(248, 146, 154)',
  'rgb(223, 180, 119)',
  'rgb(73, 50, 144)',
  'rgb(101, 90, 50)',
  'rgb(188, 66, 58)',
  'rgb(77, 57, 182)',
  'rgb(57, 167, 141)',
  'rgb(67, 106, 211)',
  'rgb(197, 95, 154)',
  'rgb(171, 119, 183)',
  'rgb(111, 149, 93)',
  'rgb(96, 141, 68)',
  'rgb(218, 78, 86)',
  'rgb(189, 77, 167)',
  'rgb(82, 248, 106)',
  'rgb(221, 100, 178)',
  'rgb(174, 64, 110)',
  'rgb(226, 75, 177)',
  'rgb(121, 72, 71)'
]
