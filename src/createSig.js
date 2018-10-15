const lightwallet = require('eth-lightwallet')
const solsha3 = require('solidity-sha3').default
const leftPad = require('left-pad')
const BigNumber = require('bignumber.js')

function createSig (ks, signingAddr, keyFromPw, multisigContractAddr, nonce, destinationAddr, value, data) {
  nonce = new BigNumber(nonce) // typeguard
  value = new BigNumber(value) // typeguard
  console.assert(multisigContractAddr.substr(0,2) === "0x", "multisigAddr should be in hex format",multisigContractAddr)
  console.assert(destinationAddr.substr(0,2) === "0x", "destinationAddr should be in hex format",destinationAddr)

  let input = '0x19' + '00'
    + multisigContractAddr.slice(2)
    + destinationAddr.slice(2)
    + leftPad(value.toString('16'), '64', '0')
    + data.slice(2)
    + leftPad(nonce.toString('16'), '64', '0')

  let hash = solsha3(input)

  let sig = lightwallet.signing
    .signMsgHash(ks, keyFromPw, hash,
      signingAddr)
  let sigV = sig.v
  let sigR = '0x' + sig.r.toString('hex')
  let sigS = '0x' + sig.s.toString('hex')

  return {sigV: sigV, sigR: sigR, sigS: sigS}
}

module.exports = createSig
