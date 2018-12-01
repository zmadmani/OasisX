const IPFS_API = require('ipfs-api')
const IPFS = new IPFS_API({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

export default IPFS;