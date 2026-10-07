import { useState } from "react";
import server from "./server";

function Transfer({ address, setBalance, nonce, setNonce }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    if (!address) {
      alert("Please connect MetaMask first.");
      return;
    }

    try {
      const amount = parseInt(sendAmount);

      if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
      }

      const message = JSON.stringify({
        sender: address,
        recipient,
        amount,
        nonce,
      });

      // Ask MetaMask to sign the transaction message.
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      const {
        data: { balance, nonce: newNonce },
      } = await server.post("send", {
        sender: address,
        recipient,
        amount,
        nonce,
        signature,
      });

      setBalance(balance);
      setNonce(newNonce);

      setSendAmount("");
      setRecipient("");

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
          placeholder="Recipient address"
          value={recipient}
          onChange={setValue(setRecipient)}
        />
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;