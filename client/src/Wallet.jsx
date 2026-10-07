import server from "./server";

function Wallet({ address, setAddress, balance, setBalance, setNonce }) {
  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const walletAddress = accounts[0];

      setAddress(walletAddress);

      const {
        data: { balance, nonce },
      } = await server.get(`balance/${walletAddress}`);

      setBalance(balance);
      setNonce(nonce);
    } catch (error) {
      console.error(error);
      alert("Failed to connect MetaMask.");
    }
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <button type="button" className="button" onClick={connectWallet}>
        {address ? "Wallet Connected" : "Connect MetaMask"}
      </button>

      {address && (
        <>
          <div className="address">{address}</div>
          <div className="balance">Balance: {balance}</div>
        </>
      )}
    </div>
  );
}

export default Wallet;