// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

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

contract SmarContracttWallet {

    address payable public owner;

    mapping(address => uint) public limits;
    mapping(address => bool) public AbletoSend;

    mapping(address => bool) authorizedVoters;
    mapping(address => bool) public accessAllowed;

    event Deposit(address indexed sender, uint amount);

    address payable nextOwner;
    uint VoterCount;
    uint constant votesNeeded = 3;
    mapping(address => mapping(address => bool)) hasVoterAlrVoted;

    constructor() {
        owner = payable(msg.sender);
    }

    address[] public listofVoters;

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

        // this makes sure the same voter doesn't vote twice for the specific newOwner
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

        if(_restriction > 0){
            AbletoSend[_whoCanSend] = true;
        }
        else {
            AbletoSend[_whoCanSend] = false;
        }
        
        
    }

    // Funds Transfering
    function transferFunds(address payable _to, uint amountToTransfer) public payable {
        //require(msg.sender == owner, "This action is restricted to the owner");

       // If it's not the owner, then limits apply
        if(msg.sender != owner){

            // checks for limits
            require(limits[msg.sender] >= amountToTransfer, "Transfer Limit Exceeded");

            //ensures no one's transfering unneccessary 0 currency repeatdly
            require(AbletoSend[msg.sender], "Transfer Amount Unacceptable");

            limits[msg.sender] -= amountToTransfer;

        }

        // The owner has no limit to transfer funds
        // (bool success, bytes memory returnData) =  _to.call{value: amountToTransfer}(_payload);
        // require(success, "Failed");
        // return returnData;

        _to.transfer(amountToTransfer);
    }

    function deposit() public payable {
        require(msg.value > 0, "Deposit must be greater than 0");
        emit Deposit(msg.sender, msg.value);
    }

    function setAccess(address user, bool allowed) public {
    require(msg.sender == owner, "Only owner can set access restrictions");
    accessAllowed[user] = allowed;
    }

    receive() external payable { }


}