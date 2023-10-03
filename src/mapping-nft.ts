import { Address, BigInt } from "@graphprotocol/graph-ts";

import { SeaDropMint as SeaDropMintEvent } from '../generated/SeaDropEvent/SeaDropEvent'


import { NFT, FeeRecipient } from '../generated/schema'

import { IERC721a } from '../generated/SeaDropEvent/IERC721a'


export function handleSeaDropMint(event: SeaDropMintEvent): void {

    let nft = NFT.load(event.params.nftContract.toHexString())


    let volumn = event.params.unitMintPrice.times(event.params.quantityMinted)

    if (!nft) {
        nft = new NFT(event.params.nftContract.toHexString())
        nft.totalMintedQuantity = event.params.quantityMinted
        nft.totalMintedPrice = volumn
        nft.mintCount = event.params.quantityMinted


        let contract = IERC721a.bind(event.params.nftContract)

        let name = contract.try_name()
        if (!name.reverted) {
            nft.name = name.value
        }

        let symbol = contract.try_symbol()
        if (!symbol.reverted) {
            nft.symbol = symbol.value
        }

        let totalSupply = contract.try_totalSupply()
        if (!totalSupply.reverted) {
            nft.totalSupply = totalSupply.value
        }


    } else {
        nft.totalMintedQuantity = nft.totalMintedQuantity.plus(event.params.quantityMinted)
        nft.totalMintedPrice = nft.totalMintedPrice.plus(volumn)
        nft.mintCount = nft.mintCount.plus(event.params.quantityMinted)
    }



    if (event.params.feeBps.notEqual(BigInt.fromI32(0))) {

        let fee = volumn.times(event.params.feeBps).div(BigInt.fromI32(10000))

        let feeRecipient = FeeRecipient.load(event.params.feeRecipient.toHexString())

        if (!feeRecipient) {
            feeRecipient = new FeeRecipient(event.params.feeRecipient.toHexString())
            feeRecipient.totalFee = fee
        } else {
            feeRecipient.totalFee = feeRecipient.totalFee.plus(fee)
        }

        feeRecipient.save()

    }


    nft.save()






}

