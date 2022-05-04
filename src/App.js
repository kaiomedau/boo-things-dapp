import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import Web3B from "web3";

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;


function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);

  const [claimingNft, setClaimingNft] = useState(false);
  const [warningFeedback, setWarningFeedback] = useState(``);
  const [successFeedback, setSuccessFeedback] = useState(``);
  const [displayPrice, setDisplayPrice] = useState(`0 MATIC`);
  
  const [totlSupply, setTotlSupply] = useState(0);
  const [mintLive, setMintLive] = useState(false); // Public sale
  const [whitelistMintLive, setWhitelistMintLive] = useState(false); // whitelist mint

  const [whitelistCount, setWhitelistCount] = useState(0);
  const [mintDone, setMintDone] = useState(0);
  
  const [lastPrice, setLastPrice] = useState(0);
  const [mintPrice, setMintPrice] = useState(0);
  const [fetchingPrice , setFetchingPrice] = useState(false);
  const [fetchingCount , setFetchingCount] = useState(0);

  let fetchCount = 0;
  let fetchLimit = 50;
  
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

  const fetchNewPrice =  () => {
    setTimeout(function(){ 
      getNextPrice();
    }, 1000);
  }

  const removefeedback = () => {
    setTimeout(function(){ 
      setSuccessFeedback(``);
      setWarningFeedback(``);
    }, 5000);
  }

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
    console.log ("🤑 Retriving price for wallet " + fetchCount + "/" + fetchLimit);
    setFetchingPrice(true);
    blockchain.smartContract.methods.getMyNextPriceWithAddress(blockchain.account).call().then((receipt) => {
      console.log("🤑🤑 Next price: " + receipt);
      
      // Set display price
      setDisplayPrice(receipt == 0 ? "Free" : Web3B.utils.fromWei(receipt, 'ether') + " MATIC");
      
      if(mintLive && lastPrice > 0 && lastPrice >= receipt && fetchCount < 50){
        fetchCount++;
        console.log ("🤑😨 Mint price was the same as before(" + lastPrice + "/" + receipt + ")");
        // getNextPrice();
        fetchNewPrice();
      } else {
        fetchCount = 0;
        console.log ("🤑🥰 New mint price set(" + lastPrice + "/" + receipt + ")");
        setLastPrice(receipt);
        // Set mint price
        setMintPrice (receipt);
        // release mint button
        setFetchingPrice(false);
      }
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

  const getTotalSupply = () => {
    console.log ("🔥 Retriving total totalSupply");
    
    blockchain.smartContract.methods.totalSupply().call().then((receipt) => {
      console.log("🔥🔥 Whitelist count: " + receipt);
      
      // Set mint price
      setTotlSupply (receipt);
    });
  }

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
    // Set button as minting
    setClaimingNft(true);

    blockchain.smartContract.methods.mintWhitelist().send({
        gasLimit: String(CONFIG.GAS_LIMIT),
        maxPriorityFeePerGas: null,
        maxFeePerGas: null, 
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: String(0),
      })
      .once("error", (err) => {
        setWarningFeedback("Oops... Try again later.");
        setSuccessFeedback(``);
        removefeedback();

        console.log(err);
        setClaimingNft(false);
        getData();
      })
      .then((receipt) => {
        setSuccessFeedback(`👻 Boooooo Yeeeeaaah!`);
        setWarningFeedback(``);
        removefeedback();

        console.log(receipt);
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));
        getData();
      });
  };

// Public
  const claimNFTs = () => {
    let totalCostWei = String(mintPrice); // must be WEI cost
    let totalGasLimit = String(CONFIG.GAS_LIMIT);
    console.log("Cost: ", totalCostWei);
    console.log("Gas limit: ", totalGasLimit);
    
    // Change button status
    setClaimingNft(true);

    blockchain.smartContract.methods
      .mint()
      .send({
        gasLimit: String(totalGasLimit),
        maxPriorityFeePerGas: null,
        maxFeePerGas: null, 
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        setWarningFeedback("Oops... Try again later.");
        setSuccessFeedback(``);
        removefeedback();

        console.log(err);
        setClaimingNft(false);
        getData();
      })
      .then((receipt) => {
        setSuccessFeedback(`👻 Boooooo Yeeeeaaah!`);
        setWarningFeedback(``);
        removefeedback();

        console.log(receipt);
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));
        
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
      
      // get whitelist total
      getWhitelistSlots();

      // get mint count
      getMintCount();

      // Update Total Supply
      getTotalSupply();

      // get next price for this user
      getNextPrice(); 
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

            <small class="total_supply"> {totlSupply} / {CONFIG.MAX_SUPPLY} 👻</small>

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

        {blockchain.errorMsg !== "" ?(<><div class="warning-message">{blockchain.errorMsg}</div></>):null}
        {warningFeedback !== "" ?(<><div class="warning-message">{warningFeedback}</div></>):null}
        {successFeedback !== "" ?(<><div class="success-message">{successFeedback}</div></>):null}
      </>
    );
  }


  // Check for supply limit
  if(totlSupply >= CONFIG.MAX_SUPPLY) {
    return (
      <>
        <div id="dapp" class="public">
            <h2>
              Sold Out!
            </h2>

            <small class="total_supply"> {totlSupply} / {CONFIG.MAX_SUPPLY} 👻</small>

            <div class="bottom_margin">
              <a href={CONFIG.MARKETPLACE_LINK}>Check on OpenSea</a>
            </div>
        </div>

        {blockchain.errorMsg !== "" ?(<><div class="warning-message">{blockchain.errorMsg}</div></>):null}
        {warningFeedback !== "" ?(<><div class="warning-message">{warningFeedback}</div></>):null}
        {successFeedback !== "" ?(<><div class="success-message">{successFeedback}</div></>):null}
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

              <small class="total_supply"> {totlSupply} / {CONFIG.MAX_SUPPLY} 👻</small>

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

            {blockchain.errorMsg !== "" ?(<><div class="warning-message">{blockchain.errorMsg}</div></>):null}
            {warningFeedback !== "" ?(<><div class="warning-message">{warningFeedback}</div></>):null}
            {successFeedback !== "" ?(<><div class="success-message">{successFeedback}</div></>):null}
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

              <small class="total_supply"> {totlSupply} / {CONFIG.MAX_SUPPLY} 👻</small>

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
                !fetchingPrice ? 
                (
                  <button disabled= { claimingNft ? 1 : 0 }
                    onClick={(e) => {
                      e.preventDefault();
                      claimNFTs();
                    }}
                  > 
                  {claimingNft ? "Hunting..." : "Mint your Boo"}
                  </button>
                ) : (
                  <button disabled="1"> 
                    Fetching Price...
                  </button>
                )
              }
            </div>

            {blockchain.errorMsg !== "" ?(<><div class="warning-message">{blockchain.errorMsg}</div></>):null}
            {warningFeedback !== "" ?(<><div class="warning-message">{warningFeedback}</div></>):null}
            {successFeedback !== "" ?(<><div class="success-message">{successFeedback}</div></>):null}
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

              <small class="total_supply"> {totlSupply} / {CONFIG.MAX_SUPPLY} 👻</small>

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
                  }}
                  > 
                  {claimingNft ? "Hunting..." : "Mint your Boo"}
                  </button>
                ) : (
                  <button disabled="1"> 
                    Out of slots
                  </button>
                )
              }
          </div>

          {blockchain.errorMsg !== "" ?(<><div class="warning-message">{blockchain.errorMsg}</div></>):null}
          {warningFeedback !== "" ?(<><div class="warning-message">{warningFeedback}</div></>):null}
          {successFeedback !== "" ?(<><div class="success-message">{successFeedback}</div></>):null}
        </>
        
      );
  }

  
}

export default App;
