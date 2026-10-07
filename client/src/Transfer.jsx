import { useState } from "react";
import server from "./server";

import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, toHex } from "ethereum-cryptography/utils";
import * as secp from "ethereum-cryptography/secp256k1";

function Transfer({ address, setBalance, nonce, setNonce }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    try {
      const amount = parseInt(sendAmount);

      const message = JSON.stringify({
        sender: address,
        recipient,
        amount,
        nonce,
      });
      const messageHash = keccak256(utf8ToBytes(message));

      const [signature, recoveryBit] = await secp.sign(
        messageHash,
        privateKey,
        {
          recovered: true,
        }
      );

      const {
        data: { balance, nonce: newNonce },
      } = await server.post("send", {
        sender: address,
        recipient,
        amount,
        nonce,
        signature: toHex(signature),
        recoveryBit,
      });

      setBalance(balance);
      setNonce(newNonce);

      setSendAmount("");
      setRecipient("");
      setPrivateKey("");

      alert("Transfer successful!");
    } catch (ex) {
      console.error(ex);
      alert(ex.response?.data?.message || ex.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        />
      </label>

      <label>
        Recipient
        <input
          placeholder="Public key of recipient"
          value={recipient}
          onChange={setValue(setRecipient)}
        />
      </label>

      <label>
        Private Key
        <input
          type="password"
          placeholder="Enter your private key"
          value={privateKey}
          onChange={setValue(setPrivateKey)}
        />
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;