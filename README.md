
ca.json

-放代币的合约地址，每条链对应的合约地址都不一样，在cmc自己扒

rpc.json

-放rpc链接的，自己去chainlist找

wallet.csv

-no: 钱包序号

-pk: 钱包私钥

-toAddress: 转入的地址，如果是交易所地址，请先确认支不支持当前链和币的充值

-chain: 你要转账和查询的链，前提是你先把rpc链接放在rpc.json里面，切记链名要和rpc里面的链名对应，大小写严格区分

怎么运行？

1、先 npm install
2、填写好wallet里面的数据
3、在文件夹内执行 node main.js
