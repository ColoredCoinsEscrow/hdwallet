var HDWallet = require('..')
var chai = require('chai')
chai.use(require('chai-string'))
expect = chai.expect
assert = chai.assert
var bitcoin = require('bitcoinjs-lib')

var privateSeed = 'ff92aaece15f7b179796f0b849ca69a869f1f043a45b1e4ba821f20db25a52c8'
var privateSeedWIF = 'cW9W4z8UHiypm2nmvsZmwMEcpdW95GNbbRXwJJNrwBKFMzBJbzR1'
// var priv = 'cQ176k8LDck5aNJTQcXd7G4rCqGM3jhJyZ7MNawyzAfaWuVpP5Xb'
var address = 'mgNcWJp4hPd7MN6ets2P8HcB5k99aCs8cy'

describe('Test hdwallet', function () {
  it('Should generate a private seed.', function (done) {
    var hdwallet = new HDWallet({network: 'testnet'})
    var privateSeed = hdwallet.getPrivateSeed()
    assert.equal(typeof privateSeed, 'string', 'Should be a string.')
    assert.equal(privateSeed.length, 64, 'Should be 32 bytes long (hex string of 64 chars).')
    done()
  })

  it('Should load the same privateSeed.', function (done) {
    var hdwallet = new HDWallet({network: 'testnet', privateSeed: privateSeed})
    var hdSeed = hdwallet.getPrivateSeed()
    assert.equal(hdSeed, privateSeed, 'Seeds should be the same.')
    done()
  })

  it('Should load the same privateSeed from private key.', function (done) {
    var hdwallet = new HDWallet({network: 'testnet', privateSeedWIF: privateSeedWIF})
    var hdSeed = hdwallet.getPrivateSeed()
    assert.equal(hdSeed, privateSeed, 'Seeds should be the same.')
    done()
  })

  it('Should init.', function (done) {
    this.timeout(30000)
    var hdwallet = new HDWallet({network: 'testnet', privateSeed: privateSeed})
    hdwallet.on('connect', function () {
      done()
    })
    hdwallet.init()
  })

  it('Should save the private key of an address', function (done) {
    this.timeout(60000)
    var hdwallet = new HDWallet({network: 'testnet', privateSeed: privateSeed})
    hdwallet.on('connect', function () {
      hdwallet.getAddressPrivateKey(address, function (err, priv) {
        assert.ifError(err)
        assert(priv.toWIF(bitcoin.networks.testnet), priv)
        done()
      })
    })
    hdwallet.init()
  })

  it('Should encrypt/decrypt Private Key', function (done) {
    this.timeout(0)
    var encryptedPrivateKey = HDWallet.encryptPrivateKey(privateSeedWIF, '123')
    assert.equal(HDWallet.decryptPrivateKey(encryptedPrivateKey, '123', 'testnet'), privateSeedWIF, 'Should decrypt correctly')
    done()
  })

  it('Should create a new mainnet Private Key', function (done) {
    this.timeout(120000)
    var key = HDWallet.createNewKey()
    var hdwallet = new HDWallet({privateSeedWIF: key.privateKey})
    hdwallet.on('connect', function () {
      hdwallet.getAddresses(function (err, addresses) {
        assert.ifError(err)
        // console.log('addresses:', addresses)
        expect(addresses).to.be.a('array')
        expect(addresses).to.have.length.above(0)
        done()
      })
    })
    hdwallet.init()
  })

  it('Should create a new testnet Private Key', function (done) {
    this.timeout(120000)
    var key = HDWallet.createNewKey('testnet')
    var hdwallet = new HDWallet({network: 'testnet', privateSeedWIF: key.privateKey})
    hdwallet.on('connect', function () {
      hdwallet.getAddresses(function (err, addresses) {
        assert.ifError(err)
        // console.log('addresses:', addresses)
        expect(addresses).to.be.a('array')
        expect(addresses).to.have.length.above(0)
        done()
      })
    })
    hdwallet.init()
  })

  it('Should create a new encrypted Private Key', function (done) {
    this.timeout(120000)
    var key = HDWallet.createNewKey(null, '123')
    assert(key.encryptedPrivateKey, 'Should generate and encrypted key')
    done()
  })

  it('Should create a get zero account (mainnet)', function (done) {
    this.timeout(120000)
    var key = HDWallet.createNewKey()
    var hdwallet = new HDWallet({privateSeedWIF: key.privateKey})
    hdwallet.on('connect', function () {
      var extendedKey = hdwallet.getAccount(0)
      expect(extendedKey).to.startsWith('xpub')
      assert.equal(extendedKey, key.extendedPublicKey, 'Should return the same extended public key')
      done()
    })
    hdwallet.init()
  })

  it('Should create a get zero account (testnet)', function (done) {
    this.timeout(120000)
    var key = HDWallet.createNewKey('testnet')
    var hdwallet = new HDWallet({network: 'testnet', privateSeedWIF: key.privateKey})
    hdwallet.on('connect', function () {
      var extendedKey = hdwallet.getAccount(0)
      expect(extendedKey).to.startsWith('tpub')
      assert.equal(extendedKey, key.extendedPublicKey, 'Should return the same extended public key')
      done()
    })
    hdwallet.init()
  })

  it('Should get the addresses of the wallet', function (done) {
    this.timeout(60000)
    var hdwallet = new HDWallet({network: 'testnet', privateSeed: privateSeed})
    hdwallet.on('connect', function () {
      hdwallet.getAddresses(function (err, addresses) {
        assert.ifError(err)
        // console.log('addresses:', addresses)
        expect(addresses).to.be.a('array')
        expect(addresses).to.have.length.above(0)
        assert(addresses.indexOf(address) !== -1)
        done()
      })
    })
    hdwallet.init()
  })

  it('Should get a p2sh address', function (done) {
    this.timeout(60000)
    var hdwallet = new HDWallet({network: 'testnet', privateSeed: privateSeed})
    hdwallet.on('connect', function () {
      var address = hdwallet.getAddress(undefined, undefined, true)
      expect(address).to.be.a('string')
      expect(address).to.have.length.of(35)
      expect(address[0]).to.equal('2')
      done()
    })
    hdwallet.init()
  })

  it('Should store redeem script and local address for p2sh address', function (done) {
    this.timeout(60000)
    var hdwallet = new HDWallet({network: 'testnet', privateSeed: privateSeed})
    hdwallet.on('connect', function () {
      var address = hdwallet.getAddress(undefined, undefined, true)
      hdwallet.getP2SHAddressData(address, function(err, data) {
        expect(data.redeemScript).to.be.a('string')
        expect(data.redeemScript).to.have.length.of(142)
        expect(data.localAddress).to.be.a('string')
        expect(data.localAddress).to.have.length.of(34)
        expect(data.localAddress[0]).to.equal('m')
        done()
      })
    })
    hdwallet.init()
  })

})
