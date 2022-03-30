import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;


function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [feedback, setFeedback] = useState(`Click buy to mint your NFT.`);
  const [displayPrice, setDisplayPrice] = useState(`0 MATIC`);

  const [mintLive, setMintLive] = useState(false);
  const [whitelistMintLive, setWhitelistMintLive] = useState(false);

  const [whitelistCount, setWhitelistCount] = useState(0);
  // const [whitelistMintAvailable, setWhitelistMintAvailable] = useState(0);
  const [mintDone, setMintDone] = useState(0);
  const [mintPrice, setMintPrice] = useState(0);

  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });


  const getSaleState = () => {
    blockchain.smartContract.methods.isSaleActive().call().then((receipt) => {
      setMintLive (receipt);
    });    
  }

  const getWhitelistState = () => {
    blockchain.smartContract.methods.whitelistMintingActive().call().then((receipt) => {
      setWhitelistMintLive (receipt);
    });    
  }

  const getNextPrice = () => {
    console.log ("🤑 Retriving price for wallet");
    blockchain.smartContract.methods.getMyNextPriceWithAddress(blockchain.account).call().then((receipt) => {
      console.log("🤑🤑 Next price: " + receipt);
      
      // Set display price
      setDisplayPrice(receipt == 0 ? "Free" : receipt + " MATIC");
      
      // Set mint price
      setMintPrice (receipt);
    });
  }

  const getWhitelistSlots = () => {
    console.log ("🔥 Retriving total whitelist slots");
    
    blockchain.smartContract.methods.getWhiteCount(blockchain.account).call().then((receipt) => {
      console.log("🔥🔥 Whitelist count: " + receipt);
      
      // Set mint price
      setWhitelistCount (receipt);
    });
  }

  // const getAvailableWhitelistSlots = () => {
  //   console.log ("😈 Retriving available whitelist slots");

  //   blockchain.smartContract.methods.getAvailableWhiteSlots(blockchain.account).call().then((receipt) => {
  //     console.log("😈😈 Available Whitelist Slots: " + receipt);
      
  //     // Set mint price
  //     setWhitelistMintAvailable(receipt);
  //   });
  // }

  const getMintCount = () => {
    console.log ("⚫️ Retriving mint count");

    blockchain.smartContract.methods.getMintCount(blockchain.account).call().then((receipt) => {
      console.log("⚫️⚫️ Mint Done: " + receipt);
      
      // Set Mints done
      setMintDone (receipt);
    });
  }


// Mint
// Whitelist
  const claimWhitelistNFT = () => {
    setFeedback(`Minting your Free BOO...`);
    
    // Set button as minting
    setClaimingNft(true);

    blockchain.smartContract.methods.mintWhitelist().send({
        gasLimit: String(CONFIG.GAS_LIMIT),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: String(0),
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `👻 Boooooo Yeeeeaaah!<br />You catch a Boo NFT! go visit Opensea.io to view it.`
        );
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));

        // Update all data
        getData();
      });
  };

// Public
  const claimNFTs = () => {
    let totalCostWei = String(mintPrice); // must be WEI cost
    let totalGasLimit = String(CONFIG.GAS_LIMIT);
    console.log("Cost: ", totalCostWei);
    console.log("Gas limit: ", totalGasLimit);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}...`);
    
    // Change button status
    setClaimingNft(true);

    blockchain.smartContract.methods
      .mint()
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `WOW, the ${CONFIG.NFT_NAME} is yours! go visit Opensea.io to view it.`
        );
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));

        // Update all data
        getData();
      });
  };


// Checa quantos WL tem disponível
// Checa quantos WL já mintou
  // Checa se ainda tem Wl após o mint
  // Checa o preço antes de cada mint


  const getData = () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));

      // Check if sale and whitelist are open
      getSaleState();
      getWhitelistState();
      
      // get next price for this user
      getNextPrice();

      // get whitelist total
      getWhitelistSlots();

      // Get available whitelist slots
      // getAvailableWhitelistSlots();

      // get mint count
      getMintCount();
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);


  
  // Check if wallet is connected
  if(blockchain.account === "" || blockchain.smartContract === null) {
    return (
      <>
        <div id="dapp" class="connect">
            <h2>
              Boo Things
            </h2>

            <div class="mint-status">
              <ul class="score-left">
                <li>0</li>
                <li class="label">Whitelist Slots</li>
              </ul>

              <ul class="score-right">
                <li>0</li>
                <li class="label">Ghosts Minted</li>
              </ul>
            </div>
            
            <div class="price-status">
              <h3>Free</h3>
              <p>Price of your next ghost</p>
              <small>+ Cents in Gas Fees</small>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                dispatch(connect());
                getData();
              }}
            >
              Connect your wallet
            </button>
        </div>

        {blockchain.errorMsg !== "" ? (<> <p> {blockchain.errorMsg} </p></>) : null}    
        {feedback !== "" ? (<> <p> {feedback} </p></>) : null}
      </>
    );
  }

  // Check if Mint is not Open YET
  if(!mintLive && !whitelistMintLive){

    return (
        
          <>
            <div id="dapp" class="closed">
              <h2>
                Mint Not Live
              </h2>

              <div class="mint-status">
                <ul class="score-left">
                  <li>{whitelistCount}</li>
                  <li class="label">Whitelist Slots</li>
                </ul>

                <ul class="score-right">
                  <li>{mintDone}</li>
                  <li class="label">Ghosts Minted</li>
                </ul>
              </div>
              
              <div class="price-status">
                <h3>{displayPrice}</h3>
                <p>Price of your next ghost</p>
                <small>+ Cents in Gas Fees</small>
              </div>

            </div>

            {blockchain.errorMsg !== "" ? (<> <p> {blockchain.errorMsg} </p></>) : null}
            {feedback !== "" ? (<> <p> {feedback} </p></>) : null}
          </>
        
      );

  }

  if(mintLive) {
      return (
        
          <>
            <div id="dapp" class="public">
              <h2>
                Public Sale
              </h2>

              <div class="mint-status">
                <ul class="score-left">
                  <li>{mintDone}</li>
                  <li class="label">Ghosts Minted</li>
                </ul>

                <ul class="score-right">
                  <li>{whitelistCount}</li>
                  <li class="label">Whitelist Slots</li>
                </ul>
              </div>
              
              <div class="price-status">
                <h3>{ displayPrice }</h3>
                <p>Price of your next ghost</p>
                <small>+ Cents in Gas Fees</small>
              </div>

              <button disabled= { claimingNft ? 1 : 0 }
                onClick={(e) => {
                  e.preventDefault();
                  claimNFTs();
                  getData();
                }}
              > 
              {claimingNft ? "Working..." : "Mint your Boo"}
              </button>
            </div>

            {blockchain.errorMsg !== "" ? (<> <p> {blockchain.errorMsg} </p></>) : null}
            {feedback !== "" ? (<> <p> {feedback} </p></>) : null}
          </>
        
      );
  }
  
  if(whitelistMintLive) {
      console.log("🚨 Whitelist mint");
      return (
        
          <>
            <div id="dapp" class="whitelist">
              <h2>
                Whitelist
              </h2>

              <div class="mint-status">
                <ul class="score-left">
                  <li>{mintDone}</li>
                  <li class="label">Ghosts Minted</li>
                </ul>

                <ul class="score-right">
                  <li>{whitelistCount}</li>
                  <li class="label">Whitelist Slots</li>
                </ul>
              </div>
              
              <div class="price-status">
                <h3>{ displayPrice }</h3>
                <p>Price of your next ghost</p>
                <small>+ Cents in Gas Fees</small>
              </div>

              {
                mintDone < whitelistCount ? 
                (
                  <button disabled= { claimingNft ? 1 : 0 }
                  onClick={(e) => {
                    e.preventDefault();
                    claimWhitelistNFT();
                    getData();
                  }}
                  > 
                  {claimingNft ? "Working..." : "Mint your Boo"}
                  </button>
                ) : (
                  <button disabled="1"> 
                    Out of slots
                  </button>
                )
              }
          </div>

          {blockchain.errorMsg !== "" ? (<> <p> {blockchain.errorMsg} </p></>) : null}
          {feedback !== "" ? (<> <p> {feedback} </p></>) : null}
        </>
        
      );
  }

  
}

export default App;
