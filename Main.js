const fs = require('fs');
const csv = require('csv-parser');
const { ethers } = require('ethers');
const ca = require('./ca.json');
const rpcs = require('./rpc.json');

const tokenAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint amount) returns (bool)"
];

async function getWalletsFromCSV(filePath) {
  const wallets = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => wallets.push(data))
      .on('end', () => {
        resolve(wallets);
      })
      .on('error', reject);
  });
}

async function checkAndTransferTokens(pk, toAddress, chain) {
  const provider = new ethers.providers.JsonRpcProvider(rpcs[chain]);
  const wallet = new ethers.Wallet(pk, provider);
  console.log(`Checking wallet balance ${wallet.address}...`);

  const gasPrice = await provider.getGasPrice();
  console.log(`Gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);

  const tokens = Object.keys(ca[chain]);
  for (const tokenName of tokens.filter(name => name !== 'ETH')) {
    const tokenContract = new ethers.Contract(ca[chain][tokenName], tokenAbi, wallet);
    const balance = await tokenContract.balanceOf(wallet.address);
    if (!balance.isZero()) {
      console.log(`${tokenName} balance: ${ethers.utils.formatUnits(balance, await tokenContract.decimals())}`);

      const estimatedGasLimit = await tokenContract.estimateGas.transfer(toAddress, balance);
      
      const tx = await tokenContract.transfer(toAddress, balance, {
        gasPrice: gasPrice,
        gasLimit: estimatedGasLimit
      });
      await tx.wait();
      console.log(`✅${tokenName} transfer to ${toAddress} successful.`);
    }
  }

  if (tokens.includes('ETH')) {
    const balance = await provider.getBalance(wallet.address);
    if (!balance.isZero()) {
      console.log(`ETH balance: ${ethers.utils.formatEther(balance)}`);
      const transferAmount = balance.mul(90).div(100);

      const txData = {
        to: toAddress,
        value: transferAmount,
        gasPrice: gasPrice
      };
      const estimatedGasLimit = await wallet.estimateGas(txData);
      
      const tx = await wallet.sendTransaction({
        ...txData,
        gasLimit: estimatedGasLimit
      });
      await tx.wait();
      console.log(`✅ETH transfer of 90% balance to ${toAddress} successful.`);
    }
  }
}

async function main() {
  const filePath = './wallet.csv';
  const wallets = await getWalletsFromCSV(filePath);
  for (const {pk, toAddress, chain} of wallets) {
    await checkAndTransferTokens(pk, toAddress, chain);
  }
}

main().catch(console.error);
