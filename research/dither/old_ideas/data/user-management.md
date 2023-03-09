

# Dither's User API

## Purpose
Dither is aiming to replace the internet, so it needs a standard method of accounting. This includes storing user data publicly and privately, identifying users, and authenticating users. These accounts need to be able work across devices and should have varying levels of authentication for varying levels of storage of information.
Dither accounts should also be able to prove qualities about themselves to external parties using zero-knowledge proofs.

## Goals

Accounts should be able to be accessed in a standard way that is accessible to any application.

Accounts should have multiple levels of authentication for varying levels of access to information.

Accounts should be able to expose however much information their users want.
 - Whether it be a throwaway anonymous account or an account connected to every aspect of a person's life.

## Structure
A user is just a Public / Private key pair with encrypted and unencrypted data stored in a versioned data structure.

There are two parts to this datastructure, a public versioned structure and a private encrypted structure. The public key is stored in the public structure, the private key is stored in the private structure. 

Any interaction between an application and a user on Dither is done through the Dither API. Applications can create users, authenticate as a user and discover the public data of other users through the User API.

## User Definitions

These public and private structures can have various definitions that define various qualities about the user. Definitions are just permissioned data that is stored by a user. Definitions can be publicly available, publicly writable or conditionally available, and writable with specific permissions.

### Examples of Definitions

 - Public
   - Username
   - Autobiography
 - Private

## User API
Application 
- `CreateUser()`
  - Create new user (for permanent or temporary purposes)
  - This will create a new user in this peer and give access to application that called this DitherAction
- `Bootstrap(PeerID, MultiAddr)`
  - Tell network layer to bootstrap to specific node (only used on startup)
- `Discover(UserId)`
  - Initiate a network tree request to discover info about a user. (e.g. hosting peers, public configuration)
  - Depending on the queried user’s config information may or may not be returned.
- `Authenticate(UserId, UserToken)` - Authenticate to user on dither network
  - This will attempt to authenticate an application as a user on the network. 
  - When a token is sent to the peer(s) with permission over the user’s private key, the type of authentication is predetermined by the permissions in the private user configuration. The Types of Authentication are:
    - Hosting - the user’s private key is sent to the application and the application has full control over the user
    - Proxy - all events are sent through peers with actual permission to sign messages
  - Will attempt to authenticate as a known user with known hosting peer
- `SendData(UserId, Data)`
  - Send data to specific application of specific UserId
  - Can potentially be a local application (such as dither-scp or dither-db)
  - Or another dither service running on another peer