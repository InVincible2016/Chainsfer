
import bip38 from 'bip38'

self.addEventListener('message', event => { // eslint-disable-line
  const { action, payload } = event.data
  try {
    if (action === 'encrypt') {
      const { btcWalletWifDecoded, password } = payload
      const result = bip38.encrypt(btcWalletWifDecoded.privateKey, btcWalletWifDecoded.compressed, password)
      self.postMessage({ ok: true, payload: result }) // eslint-disable-line
    } else if (action === 'decrypt') {
      const { encryptedWallet, password } = payload
      const result = bip38.decrypt(encryptedWallet, password)
      self.postMessage({ ok: true, payload: result })  // eslint-disable-line
    } else {
      self.postMessage(new Error('Invalid crypto action')) // eslint-disable-line
    }
  } catch (e) {
    console.warn(e)
    self.postMessage({ ok: false, payload: e }) // eslint-disable-line
  }
})
