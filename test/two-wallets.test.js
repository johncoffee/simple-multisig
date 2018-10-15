const SimpleMultiSig = artifacts.require('./SimpleMultiSig.sol')
const StateMachine = artifacts.require('./StateMachine.sol')
const lightwallet = require('eth-lightwallet')
// const solsha3 = require('solidity-sha3').default
// const leftPad = require('left-pad')
// const BigNumber = require('bignumber.js')

const createSig = require("../src/createSig")

function retrieveAddress1 () {
  return new Promise(resolve => {
    const password = '123'
    const seedPhrase = 'pretty harsh depart gloom whip quit stable turtle question supreme rather problem'
    lightwallet.keystore.createVault({
      hdPathString: "m/44'/60'/0'/0",
      seedPhrase, password,
    }, (err, ks) => {
      ks.keyFromPassword(password, function (err, keyFromPw) {
        ks.generateNewAddress(keyFromPw, 5)
        const acct = ks.getAddresses()
        resolve(acct)
      })
    })
  })
}

function retrieveAddress2 () {
  return new Promise(resolve => {
    const password = '234'
    const seedPhrase = 'appear sponsor reveal either forget easily genre buzz print giggle erupt leopard'
    lightwallet.keystore.createVault({
      hdPathString: "m/44'/60'/0'/0",
      seedPhrase, password,
    }, (err, ks) => {
      ks.keyFromPassword(password, function (err, keyFromPw) {
        ks.generateNewAddress(keyFromPw, 5)
        const acct = ks.getAddresses()
        resolve(acct)
      })
    })
  })
}

function retrieveSig1 (multisigAddr, nonce, destAddr, destValue, destData) {
  return new Promise(resolve => {
    const password = '123'
    const seedPhrase = 'pretty harsh depart gloom whip quit stable turtle question supreme rather problem'
    lightwallet.keystore.createVault({
      hdPathString: "m/44'/60'/0'/0",
      seedPhrase, password,
    }, (err, ks) => {
      ks.keyFromPassword(password, function (err, keyFromPw) {
        ks.generateNewAddress(keyFromPw, 5)
        const acct = ks.getAddresses()
        const sig = createSig(ks, acct[0], keyFromPw,
          multisigAddr, nonce, destAddr, destValue, destData)
        resolve(sig)
      })
    })
  })
}
function retrieveSig2 (multisigAddr, nonce, destAddr, destValue, destData) {
  return new Promise(resolve => {
    const password = '234'
    const seedPhrase = 'appear sponsor reveal either forget easily genre buzz print giggle erupt leopard'

    lightwallet.keystore.createVault({
      hdPathString: "m/44'/60'/0'/0",
      seedPhrase, password,
    }, (err, ks) => {
      ks.keyFromPassword(password, function (err, keyFromPw) {
        ks.generateNewAddress(keyFromPw, 5)
        const acct = ks.getAddresses()
        const sig = createSig(ks, acct[0], keyFromPw,
          multisigAddr, nonce, destAddr, destValue, destData)
        resolve(sig)
      })
    })
  })
}


// flow: 1. deploy the thing, get the address
contract('Test multisig', ([deployer]) => {
  it('should be possible to use two wallets', async () => {
    const [addr1] = await retrieveAddress1() // array of addresses
    const [addr2] = await retrieveAddress2()
    const owners = [addr1, addr2] // addresses
    owners.sort()

    const threshold = owners.length
    const multisigInstance = await SimpleMultiSig.new(threshold, owners, {from: deployer})

    const nonce = await multisigInstance.nonce()
    assert.equal(nonce.toNumber(), 0, "should be 0 at first")

    // let bal = await web3.eth.getBalance(multisig.address)
    // assert.equal(bal, web3.toWei(0.1, 'ether'))

    // check that owners are stored correctly
    for (let i = 0; i < owners.length; i++) {
      let ownerFromContract = await multisigInstance.ownersArr.call(i) // TODO make truffle learning example of this
      assert.equal(owners[i], ownerFromContract)
    }

    console.assert(multisigInstance.address, 'should have an address now')

    // deploy the other contract
    const stateMachineInstance = await StateMachine.new(multisigInstance.address)

    // test interaction
    const num = await stateMachineInstance.getState()
    assert.isTrue(num.eq("1"), "should have 1 to begin with")

    // test owner was set correctly
    const gotOwner = await stateMachineInstance.getOwner()
    assert.equal(gotOwner, multisigInstance.address, "owner should be "+multisigInstance.address)

    // fetch sigs
    const destAddr = stateMachineInstance.address
    const destValue = "0"
    const destData = lightwallet.txutils._encodeFunctionTxData('setState', [], [])

    const sig1 = await retrieveSig1(multisigInstance.address,  nonce,
      destAddr, destValue, destData)
    const sig2 = await retrieveSig2(multisigInstance.address,  nonce,
      destAddr, destValue, destData)

    console.assert(!!sig1, 'should have sig 1 here')
    console.assert(!!sig2, 'should have sig 2 (two) here')
    const sigs = {
      sigV: [sig2, sig1].map(sig => sig.sigV), // TODO find solution on ordering
      sigR: [sig2, sig1].map(sig => sig.sigR),
      sigS: [sig2, sig1].map(sig => sig.sigS),
    }
    console.assert(sigs.sigV[0])
    console.assert(sigs.sigR.length === 2)
    console.assert(sigs.sigS[1])

    await multisigInstance.execute(sigs.sigV, sigs.sigR, sigs.sigS, destAddr, "0", destData, {
      from: deployer,
    })

    // Check nonce updated
    assert.equal((await multisigInstance.nonce()).toString(), "1", "nonce should have updated")

    const num2 = await stateMachineInstance.getState()
    assert.isTrue(num2.eq("2"), "should have changed state to 2")

  })
})
