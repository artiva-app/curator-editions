// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {ISingleEditionMintableCreator} from "./interfaces/ISingleEditionMintableCreator.sol";
import {IPaymentSplitterFactory} from "./interfaces/IPaymentSplitterFactory.sol";
import {IPaymentSplitter} from "./interfaces/IPaymentSplitter.sol";
import {ISingleEditionMintable} from "./interfaces/ISingleEditionMintable.sol";

contract CuratorEditions {
    event CreatedEdition(address editionContractAddress, uint256 editionId);
    event PriceChanged(uint256 editionId, uint256 amount);
    event EditionSold(uint256 editionId, uint256 price, address owner);

    struct EditionData {
        string name;
        string symbol;
        string description;
        string animationUrl;
        bytes32 animationHash;
        string imageUrl;
        bytes32 imageHash;
        uint256 editionSize;
        uint256 royaltyBPS;
        uint256 salePrice;
        address owner;
    }

    struct SplitData {
        string title;
        address[] payees;
        uint256[] shares;
    }

    address public constant NATIVE_CURRENCY = 0x0000000000000000000000000000000000000000;
    address public singleEditionMintableCreatorAddress;
    address public paymentSplitterFactoryAddress;

    mapping(uint256 => address) public editionIdToSplitter;
    mapping(uint256 => uint256) public editionIdToSalePrice;
    
    constructor(address _singleEditionMintableCreatorAddress, address _paymentSplitterFactoryAddress) {
        singleEditionMintableCreatorAddress = _singleEditionMintableCreatorAddress;
        paymentSplitterFactoryAddress = _paymentSplitterFactoryAddress;
    }   

    function createCuratorEdition(
        EditionData memory _editionData,
        SplitData memory _splitData
    ) external returns (uint256) {
        ISingleEditionMintableCreator creator = ISingleEditionMintableCreator(singleEditionMintableCreatorAddress);
        uint editionId = creator.createEdition(_editionData.name, _editionData.symbol, _editionData.description, _editionData.animationUrl, _editionData.animationHash, _editionData.imageUrl, _editionData.imageHash, _editionData.editionSize, _editionData.royaltyBPS, 0);
        address splitter = IPaymentSplitterFactory(paymentSplitterFactoryAddress).deployPaymentSplitter(msg.sender, _splitData.title, _splitData.payees, _splitData.shares);

        ISingleEditionMintable edition = creator.getEditionAtId(editionId);
        edition.setApprovedMinter(address(this), true);
        edition.transferOwnership(_editionData.owner);
        editionIdToSplitter[editionId] = splitter;
        editionIdToSalePrice[editionId] = _editionData.salePrice;

        emit CreatedEdition(address(edition), editionId);
        return (editionId);
    }

    function purchase(uint256 _editionId) external payable returns (uint256) {
        address splitter = editionIdToSplitter[_editionId];
        uint256 salePrice = editionIdToSalePrice[_editionId];
        require(salePrice > 0, "NOT_FOR_SALE");
        require(msg.value == salePrice, "INVALID_PRICE");

        ISingleEditionMintable edition = ISingleEditionMintableCreator(singleEditionMintableCreatorAddress).getEditionAtId(_editionId);
        uint256 editionIndex = edition.mintEdition(msg.sender);
        emit EditionSold(_editionId, salePrice, msg.sender);
        
        (bool sent,) = payable(splitter).call{value: msg.value}("");
        require(sent, "SPLITTER_ERROR");

        return editionIndex;
    }

    function setSalePrice(uint256 _editionId, uint256 _salePrice) external {
        ISingleEditionMintableCreator creator = ISingleEditionMintableCreator(singleEditionMintableCreatorAddress);
        ISingleEditionMintable edition = creator.getEditionAtId(_editionId);
        require(msg.sender == edition.owner(), "FORBIDDEN");
        editionIdToSalePrice[_editionId] = _salePrice;
        emit PriceChanged(_editionId, _salePrice);
    }

    function withdraw(uint256 _editionId) public {
        IPaymentSplitter(editionIdToSplitter[_editionId]).release(NATIVE_CURRENCY, msg.sender);
    }

    function getBalance(uint256 _editionId) public view returns(uint256) {
        return IPaymentSplitter(editionIdToSplitter[_editionId]).getBalance(NATIVE_CURRENCY, msg.sender);
    } 

    function getEditionAddress(uint256 _editionId) public view returns(address) {
        ISingleEditionMintableCreator creator = ISingleEditionMintableCreator(singleEditionMintableCreatorAddress);
        return address(creator.getEditionAtId(_editionId));
    }
}