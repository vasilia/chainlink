import { deploy, checkPublicABI, bigNum } from './support/helpers'
import { assertBigNum } from './support/matchers'

contract('Coordinator', () => {
  const sourcePath = 'Coordinator.sol'
  let coordinator

  beforeEach(async () => {
    coordinator = await deploy(sourcePath)
  })

  it('has a limited public interface', () => {
    checkPublicABI(artifacts.require(sourcePath), [
      'getId',
      'initiateServiceAgreement',
      'serviceAgreements'
    ])
  })

  describe('#getId', () => {
    it('matches the ID generated by the oracle off-chain', async () => {
      let result = await coordinator.getId.call(
        1,
        2,
        ['0x70AEc4B9CFFA7b55C0711b82DD719049d615E21d', '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'],
        '0x85820c5ec619a1f517ee6cfeff545ec0ca1a90206e1a38c47f016d4137e801dd'
      )
      assert.equal(result, '0x2249a9e0a0463724551b2980299a16406da6f4e80d911628ee77445be4e04e7c')
    })
  })

  describe('#initiateServiceAgreement', () => {
    it('saves a service agreement struct from the parameters', async () => {
      await coordinator.initiateServiceAgreement(
        1,
        2,
        ['0x70AEc4B9CFFA7b55C0711b82DD719049d615E21d', '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'],
        '0x85820c5ec619a1f517ee6cfeff545ec0ca1a90206e1a38c47f016d4137e801dd'
      )

      let sa = await coordinator.serviceAgreements.call(
        '0x2249a9e0a0463724551b2980299a16406da6f4e80d911628ee77445be4e04e7c'
      )

      assertBigNum(sa[0], bigNum(1))
      assertBigNum(sa[1], bigNum(2))
      assert.equal(
        sa[2],
        '0x85820c5ec619a1f517ee6cfeff545ec0ca1a90206e1a38c47f016d4137e801dd'
      )
      // TODO:
      // Web3.js doesn't support generating an artifact for arrays within a struct.
      // This means that we aren't returned the list of oracles and
      // can't assert on their values.
      //
      // However, we can pass them into the function to generate the ID
      // & solidity won't compile unless we pass the correct number and
      // type of params when initializing the ServiceAgreement struct,
      // so we have some indirect test coverage.
      //
      // https://github.com/ethereum/web3.js/issues/1241
      // assert.equal(
      //   sa[2],
      //   ['0x70AEc4B9CFFA7b55C0711b82DD719049d615E21d', '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07']
      // )
    })
  })
})