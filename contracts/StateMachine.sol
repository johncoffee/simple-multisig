pragma solidity ^0.4.0;

contract Owned {
    address owner;

    modifier ownerOnly () {
        require(owner == msg.sender, "msg.sender was not owner");
        _;
    }

    function getOwner() public constant returns (address _owner) {
        return owner;
    }
}

contract StateMachine is Owned {
    uint state = 1;

    constructor(address _owner) public {
        owner = _owner;
    }

    function getState() public constant returns (uint _num) {
        return state;
    }

    function setState() public ownerOnly {
        state++;
    }
}
