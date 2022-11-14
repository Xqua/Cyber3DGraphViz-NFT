// Code by Xqua In The Moon
// Import section

import _ from 'lodash';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

let colormap = require('colormap')
var createGraph = require('ngraph.graph');

// =============== 
//    Constants
// ===============

const MAX_TYPES = 14
const N = 1000;
var neg_force = -200

// ==================
// Getting parameters
// ==================

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

var jsonURL = urlParams.get("jsonURL");
var seed = urlParams.get("seed");
var glitch = urlParams.get("glitch");
var curvature = urlParams.get("curvature");
var animate = urlParams.get("animate");

if (glitch === "true") { 
    glitch = true;
} else {
    glitch = false;
}

if (animate === "true") {
    animate = true;
} else {
    animate = false;
}

if (curvature) {
    curvature = parseFloat(curvature);
} else {
    curvature = 0.0;
}

if (!seed) {
    seed = Math.random()
}

// =============== 
// Utils functions
// ===============

// Deterministic Random Shuffle

function shuffle(array, seed) {           
    var m = array.length, t, i;

    while (m) {

        i = Math.floor(random(seed) * m--);     

        t = array[m];
        array[m] = array[i];
        array[i] = t;
        ++seed                                  
    }

    return array;
}

function random(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// geometric computes

function volume(bbox) {
    let v = Math.abs(bbox.x[0] - bbox.x[1]) * Math.abs(bbox.y[0] - bbox.y[1]) * Math.abs(bbox.z[0] - bbox.z[1])
    return v;
}

// Shapes generator for node rendering

function getShape(node) {
    const size = node.size;
    const type_id = node.type_id
    var shapes = [
        new THREE.BoxGeometry(size, size, size),
        new THREE.ConeGeometry(size, size * 2, 6, 2),
        new THREE.CapsuleGeometry(size, size, 1, 5),
        new THREE.CylinderGeometry(size, size, size * 2, 8, 1),
        new THREE.DodecahedronGeometry(size, 0),
        new THREE.IcosahedronGeometry(size, 0),
        new THREE.OctahedronGeometry(size, 0),
        new THREE.TetrahedronGeometry(size, 1),
        new THREE.SphereGeometry(size, 8, 4),
        new THREE.TorusGeometry(size, size / 3, 7, 7),
        new THREE.TorusKnotGeometry(size/2, size/2, 16, 4, 17, 8),
        new THREE.TorusKnotGeometry(size/2, size/2, 8, 4, 7, 5),
        new THREE.TorusKnotGeometry(size/2, size/2, 10, 4, 1, 5),
        new THREE.TorusKnotGeometry(size/2, size/2, 16, 4, 3, 2)
    ]
    shapes = shuffle(shapes, seed);
    const shape = shapes[type_id]; 
    return shape
}

// Generating colors for rendering

const colormaps = ['viridis', 'plasma', 'jet', 'cool', 'spring', 'rainbow-soft', 'temperature']

let colors = colormap({
    colormap: shuffle(colormaps, seed)[0],
    nshades: MAX_TYPES,
    format: 'hex',
    alpha: 1
})

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

const hues = []
for (var i = 0; i<360; i+=10) {
    hues.push(hslToHex(i, 50, 7));
}

const backgroundColor = shuffle(hues, seed)[0]

// converting graph for ngraph

function rescale_int(n, n_types) {
    let r = parseInt((n * MAX_TYPES) / (n_types))
    return r    
}

function ngraph_formater(data) {
    const graph = createGraph();
    const types = []
    data.nodes.forEach((node) => {
        if (!node.labels) {node.labels = ["UKN"]}
        if (!types.includes(node.labels[0])) {
            types.push(node.labels[0])
        }
    })
    graph.types = types

    for (var i = 0; i < data.nodes.length; i++) {
        data.nodes[i].type_id = rescale_int(types.indexOf(data.nodes[i].labels[0]), types.length)
        graph.addNode(i, data.nodes[i])
    }
    data.links.forEach(link => {
        graph.addLink(link.source, link.target, link)
    })
    return graph;
}

// =============== 
// Graph Rendering
// ===============

// Getting the graph and preparating it for rendering
// example valid jsonURL: 'https://raw.githubusercontent.com/d3/d3-plugins/master/graph/data/miserables.json'
if (jsonURL) {
    fetch(jsonURL)
        .then((response) => response.json())
        .then((data) => {
            const graph = ngraph_formater(data);
            render(graph)
        });
} else {
    const graph = require('ngraph.generators').wattsStrogatz(1000, 2, 0.50);
    render(graph)
}

function render(graph) {
    const graphData = prepareGraph(graph)
    const Renderer = draw_graph(graphData);
    postprocessing(Renderer);
    if (animate){
        start_animation(Renderer);
    }
}

function prepareGraph(graph) {
    const nodes = [];
    const links = [];

    graph.forEachNode((node) => {
        if (!node.data || !node.data.name) {
            node.name = "ID: " + node.id
        } else {
            node.name = node.data.name;
        }
        
        if (node.data) {
            if (node.data.type_id) {
                node.type_id = node.data.type_id
            } else {
                node.type_id = node.id % MAX_TYPES
            }
        } else {
            node.type_id = node.id % MAX_TYPES
        }
        
        if (!node.data || !node.data.labels || !node.data.labels[0]) {
            node.label = "UKN"
        } else {
            node.label = node.data.labels[0];
        }
        node.color = colors[node.type_id]
        if (node.links != null) {
            node.size = Math.min(50, Math.max(5, node.links.size));
        } else {
            node.size = 5;
        }
        nodes.push(node)
        if (node.links) {
            node.links.forEach((link) => {
                links.push({
                    source: link.fromId,
                    target: link.toId,
                    color: node.color,
                    name: link.data.relType
                })
            })
        }
    })
    const graphData = { nodes: nodes, links: links }
    return graphData;
}

function draw_graph(graphData) {
    const Renderer = ForceGraph3D()
        (document.getElementById('3d-graph'))
        // .height(800)
        // .width(800)
        .backgroundColor(backgroundColor)
        .nodeThreeObject(node => new THREE.Mesh(
            getShape(node),
            new THREE.MeshLambertMaterial({
                color: node.color,
                transparent: true,
                opacity: 0.75,
                wireframe: true
            })
        ))
        .nodeLabel(node => `${node.label}: ${node.name}`)
        .onNodeClick(node => {
            // Aim at node from outside it
            const distance = 300;
            const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

            const newPos = node.x || node.y || node.z
                ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
                : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

            Renderer.cameraPosition(
                newPos, // new position
                node, // lookAt ({ x, y, z })
                3000  // ms transition duration
            );
        })
        .linkWidth(2)
        .linkOpacity(0.1)
        .linkLabel((link) => (link.name))
        .linkCurvature(curvature)
        .onBackgroundRightClick(() => Renderer.zoomToFit(1000))
        .graphData(graphData);
    if (graphData.nodes.length > 500) {
        autoScale(Renderer)
    }
    return Renderer
}

function autoScale(Renderer) {
    setTimeout(() => {
        const sizeCheck = setInterval(() => {
            let bbox = Renderer.getGraphBbox()
            if (volume(bbox) < 2000000000) {
                Renderer.d3Force('charge').strength(neg_force);
                Renderer.d3ReheatSimulation();
                neg_force -= 200;
            }
            if (volume(bbox) > 2500000000) {
                Renderer.zoomToFit(1000)
                clearInterval(sizeCheck)
            }
        }, 1000)
    }, 1000);
}


function postprocessing(Renderer) {
    const bloomPass = new UnrealBloomPass();
    if (glitch) {
        bloomPass.strength = 1;
        bloomPass.radius = 3;
    } else {
        bloomPass.strength = 1.2;
        bloomPass.radius = 1;
    }
    bloomPass.threshold = 0.1;
    Renderer.postProcessingComposer().addPass(bloomPass);
    if (glitch) {
        const glicthPass = new GlitchPass();
        Renderer.postProcessingComposer().addPass(glicthPass);
    }
}

// function to_spherical(x, y, z) {
//     const radius = Math.sqrt(x**2 + y**2 + z**2);
//     const theta = Math.atan((y + 0.00001) / (x + 0.00001));
//     const phi = Math.atan(Math.sqrt(x**2+y**2)/z+0.00001);
//     return { radius: radius, theta: theta, phi: phi};
// }

// function to_cartesian(radius, theta, phi) {
//     const x = radius * Math.sin(phi) * Math.cos(theta);
//     const y = radius * Math.sin(phi) * Math.sin(theta)
//     const z = radius * Math.cos(phi)
//     return {x: x, y: y, z: z}
// }

var pushpull = true;

function start_animation(Renderer) {
    setTimeout(() => {
        setInterval(() => {
            if (pushpull == 0) {
                Renderer.d3Force('charge').strength(2);
                Renderer.d3ReheatSimulation()
            } else {
                Renderer.d3Force('charge').strength(-20);
                Renderer.d3ReheatSimulation()
            } 
            pushpull = !pushpull
        }, 1000)
    }, 5000)
    // setInterval(() => { 
    //     console.log("=================")
    //     const cameraPosition = Renderer.cameraPosition();
    //     const spherical = to_spherical(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    //     spherical.theta = ((0.001 + spherical.theta + (Math.PI / 2)) % Math.PI) - (Math.PI / 2);
    //     spherical.phi = ((0.001 + spherical.theta + (Math.PI/2)) % Math.PI) - (Math.PI/2);
    //     const newCoords = to_cartesian(spherical.radius, spherical.theta, spherical.phi);
    //     cameraPosition.x = newCoords.x
    //     cameraPosition.y = newCoords.y
    //     cameraPosition.z = newCoords.z
    //     Renderer.cameraPosition(cameraPosition)
    // }, 1)
    // setInterval(() => {
    //     Graph.cameraPosition({
    //         x: distance * Math.sin(angle),
    //         z: distance * Math.cos(angle)
    //     });
    //     angle += Math.PI / 300;
    // }, 10);
}
