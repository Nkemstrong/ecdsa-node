 const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes, toHex } = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "0473045614ea6da119eee46e5226c860366dd38954402add9f34cacbd5ab47f022040eef87c1b946dfbba40c3debb52e128443bb3100ac8d2cf3816cdc8f9698cf": 100,

  "04e5785854272938adb4a2137441555924b3121560525118843e575e83d0fd4eb10eebb4d51c59287ec662918a695da3ef5052320c220cc8847ae886961577298d": 50,

  "041d1357bd1bd31d86577395a03998e6c0c4db9975aaf628c92d00a7c7eecba394bf570655a2e17b4ebd3224c53c5edaf4875da406ed0a7a0f923134acb7fb3b3d": 75,
};

const nonces = {};

for (const address of Object.keys(balances)) {
  nonces[address] = 0;
}
app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
   res.send({
    balance,
    nonce: nonces[address] || 0,
  });
});

app.post("/send", async (req, res) => {
  try {
    const { sender, recipient, amount, nonce, signature, recoveryBit } = req.body;

    if (!signature || recoveryBit === undefined) {
      return res.status(400).send({
        message: "Missing signature",
      });
    }

    const message = JSON.stringify({
      sender,
      recipient,
      amount,
      nonce,
    });

    const messageHash = keccak256(utf8ToBytes(message));

    const publicKey = secp.recoverPublicKey(
      messageHash,
      signature,
      recoveryBit
    );

    const recoveredAddress = toHex(publicKey);

    if (recoveredAddress !== sender) {
      return res.status(401).send({
        message: "Signature does not match sender",
      });
    }

    if (nonce !== nonces[sender]) {
      return res.status(400).send({
        message: "Invalid nonce",
      });
    }

    if (balances[sender] === undefined) {
      return res.status(400).send({
        message: "Sender account does not exist",
      });
    }

    if (balances[sender] < amount) {
      return res.status(400).send({
        message: "Not enough funds!",
      });
    }

    if (balances[recipient] === undefined) {
      balances[recipient] = 0;
    }

    balances[sender] -= amount;
    balances[recipient] += amount;

    nonces[sender]++;

   res.send({
      balance: balances[sender],
      nonce: nonces[sender],
    });
  } catch (error) {
    console.error(error);

    res.status(400).send({
      message: "Invalid signature",
    });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});