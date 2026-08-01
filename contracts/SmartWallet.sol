// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

interface IWalletShareFactory {
    function recordMembership(address member, bool allowed) external;
}

/*
A simplified Smart Wallet:
1. Only one owner.
2. Can receive funds.
3. Allows fund transfers.
4. Non-owners have transfer limits.
5. Owner can add authorized voters.
6. Authorized voters can vote to change ownership (requires 3 votes).
*/

contract ExampleTransferFund {

    uint counter;
    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

    function deposit() public payable {
        counter++;
     }

    receive() external payable { }
}

contract SmarContracttWallet is EIP712 {

    address payable public owner;

    /// Human label so a member can tell "Rent House" from "Ski Trip".
    string public name;

    /// Set when deployed through the factory; address(0) for a standalone
    /// deployment. Used to keep the "which wallets am I in?" index current.
    IWalletShareFactory public immutable factory;

    mapping(address => uint) public limits;
    mapping(address => bool) public AbletoSend;
    mapping(address => bool) public allowed;

    mapping(address => uint256) public userDeposits;

    address[] public allowedUsers;

    mapping(address => bool) authorizedVoters;

    event Deposit(address indexed sender, uint amount);
    event FundsTransferred(address indexed to, uint amount);
    event AccessSet(address indexed user, bool allowed);

    address payable nextOwner;
    uint VoterCount;
    uint constant votesNeeded = 3;
    mapping(address => mapping(address => bool)) hasVoterAlrVoted;

    /// Owner is passed in rather than taken from msg.sender: when the factory
    /// deploys this, msg.sender is the factory, and it must not own the wallet.
    constructor(address payable _owner, string memory _name, address _factory)
        EIP712("WalletShare", "1")
    {
        require(_owner != address(0), "Owner required");
        owner = _owner;
        name = _name;
        factory = IWalletShareFactory(_factory);
    }

    /// Invites are bearer tokens: the owner signs one off-chain (free, no
    /// transaction) and sends the link to anyone. Deliberately not bound to an
    /// invitee address — that would mean collecting addresses before inviting,
    /// which is the friction we're removing. Single-use and expiring instead.
    bytes32 private constant INVITE_TYPEHASH =
        keccak256("Invite(address wallet,bytes32 inviteId,uint256 expiry)");

    mapping(bytes32 => bool) public inviteUsed;

    event InviteAccepted(address indexed member, bytes32 indexed inviteId);

    function inviteDigest(bytes32 inviteId, uint256 expiry) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(INVITE_TYPEHASH, address(this), inviteId, expiry))
        );
    }

    function acceptInvite(bytes32 inviteId, uint256 expiry, bytes calldata signature) external {
        require(block.timestamp <= expiry, "Invite expired");
        require(!inviteUsed[inviteId], "Invite already used");
        // SignatureChecker, not ecrecover: an owner signing in with Google gets
        // a smart account, whose signatures are ERC-1271 rather than ECDSA.
        require(
            SignatureChecker.isValidSignatureNow(owner, inviteDigest(inviteId, expiry), signature),
            "Invalid invite"
        );

        inviteUsed[inviteId] = true;
        _grantAccess(msg.sender, true);
        emit InviteAccepted(msg.sender, inviteId);
    }

    /// Lets the owner kill an outstanding link before anyone redeems it.
    function revokeInvite(bytes32 inviteId) external {
        require(msg.sender == owner, "Only owner can revoke");
        inviteUsed[inviteId] = true;
    }

    address[] public listofVoters;

    function isOwner(address _addr) public view returns (bool) {
    return _addr == owner;
    }

    function assignVoter(address _voter) public {
        require(msg.sender == owner, "You are not authorized for this action");

        authorizedVoters[_voter] = true;

        listofVoters.push(_voter);
    }

    function getVoterList() public view returns (address[] memory) {
        return listofVoters;
    }

    function voteForNewOwner(address payable _newOwner) public {
        require(authorizedVoters[msg.sender], "You are not authorized for this action");

        require(hasVoterAlrVoted[_newOwner][msg.sender] == false, "You have already voted");

        if(nextOwner != _newOwner){
            nextOwner = _newOwner;
            VoterCount = 0;
        }

        VoterCount++;
        hasVoterAlrVoted[_newOwner][msg.sender] = true;

        if(VoterCount >= votesNeeded){
            owner = _newOwner;
            nextOwner = payable(address(0));
        }

    }

    // The limits are set for other parties by the owner through this function
    function setLimit(address _whoCanSend, uint _restriction) public {
        require(msg.sender == owner, "You are not authorized for this action");

        // set limit
        limits[_whoCanSend] = _restriction;

        // if(_restriction > 0){
        //     AbletoSend[_whoCanSend] = true;
        // }
        // else {
        //     AbletoSend[_whoCanSend] = false;
        // }
        
        
    }

    // Funds Transfering
    function transferFunds(address payable _to, uint amountToTransfer) public payable {
        //require(msg.sender == owner, "This action is restricted to the owner");

       // If it's not the owner, then limits apply
        if(msg.sender != owner) {
        // If a non-zero limit is set for this address, enforce it.
            // if (limits[msg.sender] != 0) {
            // require(limits[msg.sender] >= amountToTransfer, "Transfer Limit Exceeded");
            // limits[msg.sender] -= amountToTransfer;
            // }
            // Ensure the sender is allowed to transfer.

            // require(isAllowed(msg.sender), "You are not allowed to transfer funds");
            
            require(limits[msg.sender] >= amountToTransfer, "Transfer Limit Exceeded");
            // require(AbletoSend[msg.sender], "Transfer Amount Unacceptable");
            limits[msg.sender] -= amountToTransfer;
        }
        require(address(this).balance >= amountToTransfer, "Insufficient contract balance");
        _to.transfer(amountToTransfer);
        

        // The owner has no limit to transfer funds
        // (bool success, bytes memory returnData) =  _to.call{value: amountToTransfer}(_payload);
        // require(success, "Failed");
        // return returnData;

    }

    // Returns an array of addresses that have allowed access.
    function getAllowedUsers() public view returns (address[] memory) {
        uint count = 0;
        // First, count how many users have access.
        for (uint i = 0; i < allowedUsers.length; i++) {
            if (allowed[allowedUsers[i]]) {
                count++;
            }
        }
        // Allocate an array with the exact count.
        address[] memory result = new address[](count);
        uint j = 0;
        for (uint i = 0; i < allowedUsers.length; i++) {
            if (allowed[allowedUsers[i]]) {
                result[j] = allowedUsers[i];
                j++;
            }
        }
        return result;
    }

    // Function to receive ETH
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    // Explicit deposit function
    function deposit() public payable {
        require(msg.value > 0, "Deposit must be greater than 0");
        userDeposits[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // Set access restrictions; only the owner can do this.
    function setAccess(address user, bool _allowed) public {
        require(msg.sender == owner, "Only owner can set access");
        _grantAccess(user, _allowed);
    }

    function _grantAccess(address user, bool _allowed) internal {
        allowed[user] = _allowed;
        emit AccessSet(user, _allowed);

        // If granting access, add user to allowedUsers array if not already present.
        if (_allowed) {
            bool alreadyExists = false;
            for (uint i = 0; i < allowedUsers.length; i++) {
                if (allowedUsers[i] == user) {
                    alreadyExists = true;
                    break;
                }
            }
            if (!alreadyExists) {
                allowedUsers.push(user);
            }
        }

        // Keep the factory's membership index in step. Wrapped so a failure
        // here can never block someone joining their own wallet.
        if (address(factory) != address(0)) {
            try factory.recordMembership(user, _allowed) {} catch {}
        }
    }

    // Function to check if the caller is allowed to access the wallet.
    // It simply returns the value in the mapping. (Defaults to false if not set.)
    function isAllowed() public view returns (bool) {
        if (msg.sender == owner) {
            return true;
        }
        return allowed[msg.sender];
    }

    // Transfer funds from the contract; only the owner is allowed in this example.
    function exampletransferFunds(address payable to, uint amount) external {
        require(msg.sender == owner, "Only owner can transfer funds");
        require(address(this).balance >= amount, "Insufficient contract balance");
        to.transfer(amount);
        emit FundsTransferred(to, amount);
    }


}