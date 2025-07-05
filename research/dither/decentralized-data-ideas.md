# Decentralized Data

Overall goal: maximize human utility
 - response speed is useful
 - anonymity is useful
 - getting what you requested is useful
 - getting the maximum bang for buck (bandwidth, storage) is useful, not just within program but between dither and other programs.

Translates for computer: 
 - maximize speed of request:
   - Establishing a connection
   - Fetching data request
 - maximize anonymity, balanced with speed, based on utility of any given request valuing speed / anonymity
 - maximize data availability - cache along concept

API:
 - `LookupComputer { some_temporary_unnique_code } -> Set[NetworkCoordinates]`
 - `ConnectComputer { network_coord } -> Transport`

Given some anonymous routing protocol:
 - Nodes collaboratively learn coordinates to estimate expected latency / bandwidth to arbitrary nodes
 - 
 - Data

Data:
 - Person P has utility $U_P(x)$ for data $x$
 - Data has a Cost $C(x)$ associated with storage.
 - Person P has capacity $C_{max}$ for data storage.
 - Utility defines a partial order on pieces of Data
 - 

## Using AI to solve game theory problems

Q:
 - Can a p2p network be simulated with just a bunch of matrix multiplications?
   - Can a node's behavior be simulated with a neural network?
     - What are the inputs and outputs of a node?
       - Packet inputs, packet outputs
       - How to deal with discrete time vs continuous time?
       - What about bandwidth and non-network nodes?
         - Multi-agent system with different types of nodes?
         - What about interpretability?
           - Symbolic extraction -> probably not going to work
           - Alternative: node is regular program that uses neural world-models, i.e. predict latency/bandwidth
  
Idea: Use world-models NNs to manage:
 - Predicting latency/bandwidth
   - Need adversarially-resistant with confidence intervals for latency and bandwidth given arbitrary embedding vectors.
     - https://www.semanticscholar.org/paper/Accurate-Prediction-of-Network-Distance-via-Deep-Huang-Cai/3333a7fe4871cfc4d81874de6e2be8627ce79307
     - + Some kind of bayesian model? Gaussian Processes perhaps?
     - Goal: Figure out this paper^^^, federated learning, figure out adversarial learning, diff privacy. 
 - Predict anonymity content (probability of discovery given a space / range of threat models and a given correlation we care about)
   - How do we encode threat models? How do we simulate under different threat models?
 - Maintaining a data connection, i.e. for a given packet/response history, and some data we want to send, we should be able to predict what we should send next in order to reduce chances of censorship.
   - What's the performance cost here? Would it be better to learn algos instead of params? Can we use new research in transformers to improve this performance, 1.58b quant?
   - Is this on a per-connection or all connection basis? -> probably all connection since all traffic will be monitored.
   - If we do use neural nets, what architecture would possibly work? Diffusion? Specialized transformer? (is context window going to be an issue here?) What about timing detection? Would encoding data over voice work here for example? Long-term peer durability?
     - If the goal is just be "good enough" to avoid china firewall, do we really need all this?
     - What about online/federated learning?
     - What about learning small symbolic programs (assembly sequences) to bypass firewalls?
       - How is this tested? Can we learn from few examples? Can we learn in a decentralized manner? Resilient to adversarial updates?
         - How do we do adversarial distributed ML in general?