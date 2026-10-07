const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const { verifyMessage, getAddress } = require("ethers");

app.use(cors());
app.use(express.json());

// MetaMask Ethereum addresses go here.
// We will replace the first address with your MetaMask address next.
const balances = {
  "0x77daC04B11b1Fa659B3747E2ad8517C9945e1413": 100,
};

const nonces = {};

for (const address of Object.keys(balances)) {
  nonces[address] = 0;
}

app.get("/balance/:address", (req, res) => {
  try {
    const address = getAddress(req.params.address);

    const balance = balances[address] || 0;

    res.send({
      balance,
      nonce: nonces[address] || 0,
    });
  } catch (error) {
    res.status(400).send({
      message: "Invalid Ethereum address",
    });
  }
});

app.post("/send", async (req, res) => {
  try {
    const {
      sender,
      recipient,
      amount,
      nonce,
      signature,
    } = req.body;

    if (!signature) {
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

    // Recover the Ethereum address from the exact message MetaMask signed.
    const recoveredAddress = verifyMessage(message, signature);

    const senderAddress = getAddress(sender);
    const recipientAddress = getAddress(recipient);

    if (getAddress(recoveredAddress) !== senderAddress) {
      return res.status(401).send({
        message: "Signature does not match sender",
      });
    }

    if (nonce !== (nonces[senderAddress] || 0)) {
      return res.status(400).send({
        message: "Invalid nonce",
      });
    }

    if (balances[senderAddress] === undefined) {
      return res.status(400).send({
        message: "Sender account does not exist",
      });
    }

    if (balances[senderAddress] < amount) {
      return res.status(400).send({
        message: "Not enough funds!",
      });
    }

    if (balances[recipientAddress] === undefined) {
      balances[recipientAddress] = 0;
      nonces[recipientAddress] = 0;
    }

    balances[senderAddress] -= amount;
    balances[recipientAddress] += amount;

    nonces[senderAddress]++;

    res.send({
      balance: balances[senderAddress],
      nonce: nonces[senderAddress],
    });
  } catch (error) {
    console.error(error);

    res.status(400).send({
      message: error.message || "Invalid transaction",
    });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});