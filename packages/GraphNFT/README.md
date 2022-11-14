# Diamond DAO Graph NFT generator

This project generates unique Graph representation as dynamic NFT from JSON files containing network data. 

## API

When deployed, the HTML/javascript project will display the following API through URL search params:

- **jsonURL**: The link to the JSON network file to be loaded and displayed.
- **seed**: A unique seed corresponding to this NFT which controls the colors and shape attributes.
- **glitch**: A flag to be set to *true* to activate the Glitch postprocessing effect. (default: false)
- **curvature**: The amount of curvature for the links, 0.0 is no curvature 1.0 is a large curvature. The value must be positive. (default: 0.00)
- **animate**: Creates a "Breathing" animation on the graph which expands and contracts with time. (default: false)

complete API example:
https://url.to.deployement/?jsonURL=[URL]&seed=[UNIQUE_SEED]&glitch=[true]&curvature=[float 0.0->1.0]&animate=[true]

## Install and Run

This project uses yarn and webpack. First you need to install the dependencies with `yarn`, then you can start a local instance using the webpack dev server.

### Install dependencies

`yarn`

### Run local server

`yarn start`

### Auto rebuild

`yarn watch`

### local Serve

`yarn serve`

## Deployement

You can deploy the project to surge or to IPFS automatically. The final code is bundled in the `dist` folder. 

### Surge deployement 

`yarn surge` 

### IPFS deployement
You will need to have a local ipfs deamon running! And your deamon need to be connected to the swarm for the file to propagate.
 
`yarn ipfs`

## Deploying as an NFT

The important part of the deployement of a HTML/js as an NFT is going to be formatting the json metadata correctly. This means that the `animation_url` must be pointing to the URL of the HTML animation.

### Example:
```json
{
    "description":"A long form description of what this is about",
    "tokenID":0,
    "name":"The name of the NFT",
    "image":"ipfs://[CID hash]/0.jpeg",
    "animation_url":"ipfs://[CID hash]?jsonURL=[URL]&seed=[12345]",
    "attributes":
    [
        {"trait_type":"Glitch","value":"Glitching"},
        {"trait_type":"Animation","value":"Animated"}
    ]
}
```