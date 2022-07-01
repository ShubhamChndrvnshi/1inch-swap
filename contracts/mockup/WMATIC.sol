// SPDX-License-Identifier: MIT
   
pragma solidity ^0.8.0;

contract WMATIC {
  function deposit() public payable {}
  function approve(address spender, uint amount) external {}
  function allowance(address owner, address spender) external view returns(uint) {}
  function balanceOf(address owner) external view returns(uint) {}
  function transfer(address recipient, uint256 amount) external returns (bool){}
}