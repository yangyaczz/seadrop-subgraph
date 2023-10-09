import { Address, BigInt } from "@graphprotocol/graph-ts";

import { SeaDropMint as SeaDropMintEvent } from '../generated/SeaDropEvent/SeaDropEvent'

import { NFT, FeeRecipient, DailyStat, NFTMintedEvent } from '../generated/schema'

import { IERC721a } from '../generated/SeaDropEvent/IERC721a'


export function handleSeaDropMint(event: SeaDropMintEvent): void {

    // NFT entity
    let nft = NFT.load(event.params.nftContract.toHexString())

    if (!nft) {
        nft = new NFT(event.params.nftContract.toHexString())
        nft.totalMintedQuantity = BigInt.fromI32(0)
        nft.totalMintedValue = BigInt.fromI32(0)
        nft.mintCount = BigInt.fromI32(0)

        let contract = IERC721a.bind(event.params.nftContract)

        let name = contract.try_name()
        if (!name.reverted) {
            nft.name = name.value
        }

        let symbol = contract.try_symbol()
        if (!symbol.reverted) {
            nft.symbol = symbol.value
        }
    }

    let volumn = event.params.unitMintPrice.times(event.params.quantityMinted)

    nft.totalMintedQuantity = nft.totalMintedQuantity.plus(event.params.quantityMinted)
    nft.totalMintedValue = nft.totalMintedValue.plus(volumn)
    nft.mintCount = nft.mintCount.plus(BigInt.fromI32(1))

    nft.save()


    // FeeRecipient entity
    if (event.params.feeBps.notEqual(BigInt.fromI32(0))) {

        let feeRecipient = FeeRecipient.load(event.params.feeRecipient.toHexString())

        if (!feeRecipient) {
            feeRecipient = new FeeRecipient(event.params.feeRecipient.toHexString())
            feeRecipient.totalFee = BigInt.fromI32(0)
        }

        let fee = volumn.times(event.params.feeBps).div(BigInt.fromI32(10000))
        feeRecipient.totalFee = feeRecipient.totalFee.plus(fee)

        feeRecipient.save()
    }

    // daily stats
    const dayString = new Date(event.block.timestamp.toI64() * 1000).toISOString().slice(0, 10).replaceAll("-", "")
    let dailyStat = DailyStat.load(dayString)
    if (!dailyStat) {
        dailyStat = new DailyStat(dayString)
        dailyStat.dailyMintedQuantity = BigInt.fromI32(0)
        dailyStat.dailyMintedValue = BigInt.fromI32(0)
    }

    dailyStat.dailyMintedQuantity = dailyStat.dailyMintedQuantity.plus(event.params.quantityMinted)
    dailyStat.dailyMintedValue = dailyStat.dailyMintedValue.plus(volumn)
    dailyStat.save()


    // NFT Minted Event
    let nftMintedEvent = new NFTMintedEvent(event.params.nftContract.toHexString() + '-' + event.logIndex.toString())
    nftMintedEvent.nft = nft.id
    nftMintedEvent.minter = event.params.minter.toHexString()
    nftMintedEvent.quantity = event.params.quantityMinted
    nftMintedEvent.data = new Date(event.block.timestamp.toI64() * 1000).toISOString().slice(0, 19).replaceAll("-", "")
    nftMintedEvent.save()



    // daily nft stats
    // let dailyNFTStat = DailyNFTStat.load(event.params.nftContract.toHexString())
    // let ts = new Date(event.block.timestamp.toI64() * 1000).toISOString().slice(0, 19).replaceAll("-", "")
    // if (!dailyNFTStat) {
    //     dailyNFTStat = new DailyNFTStat(event.params.nftContract.toHexString())
    //     dailyNFTStat.date = [ts + "-" + event.params.minter.toHexString() + "-" + event.params.quantityMinted.toString()]
    // } else {
    //     let dmq = dailyNFTStat.date
    //     dmq.push(ts + "-" + event.params.minter.toHexString() + "-" + event.params.quantityMinted.toString())
    //     dailyNFTStat.date = dmq
    // }
    // dailyNFTStat.save()
}

