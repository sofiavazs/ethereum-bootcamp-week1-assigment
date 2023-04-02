const express = require("express");
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");

const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "04e7dce2c45c181a91390d78147a6c0868effe6cb53a2e88cc0cd0e05a115c8ac8037c5350c209bc28cb0ce67f916638c404b061976ae256aad28001152e3080e7": 100,
  "04ba13e42d5528d258d54858f8161449faa026dea315c98d6386ef8d2bde943fef795eaf5a128b0b21e41403145b841f64b22382e5461625dacff91db8c53aaa32": 50,
  "0443d07a43ccd6f356ab56c72f0281dc1639ad3e1414fc68f0224577f22182903fdc83733399fd19378874c3efba9cbc869895d20aed9887d0ed43174f26a95c9c": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", async (req, res) => {
  const { sender, recipient, amount, signature, recovery } = req.body;

  if (!signature)
    res.status(404).send({ message: "signature was not provided" });
  if (!recovery) res.status(400).send({ message: "recovery was not provided" });

  try {
    const bytes = utf8ToBytes(JSON.stringify({ sender, recipient, amount }));
    const hash = keccak256(bytes);

    const sig = new Uint8Array(signature);

    const publicKey = await secp.recoverPublicKey(hash, sig, recovery);

    if (toHex(publicKey) !== sender) {
      res.status(400).send({ message: "signature was not valid" });
    }

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
