"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var envVarUtility = require("./envVariableUtility");
var ltx = require('ltx');
class XmlDomUtility {
    constructor(xmlContent) {
        this.xmlDomLookUpTable = {};
        this.xmlDomLookUpTable = {};
        this.headerContent = null;
        this.xmlDom = ltx.parse(xmlContent);
        this.readHeader(xmlContent);
        this.buildLookUpTable(this.xmlDom);
    }
    getXmlDom() {
        return this.xmlDom;
    }
    readHeader(xmlContent) {
        let index = xmlContent.indexOf('\n');
        if (index > -1) {
            let firstLine = xmlContent.substring(0, index).trim();
            if (firstLine.startsWith("<?") && firstLine.endsWith("?>")) {
                this.headerContent = firstLine;
            }
        }
    }
    getContentWithHeader(xmlDom) {
        return xmlDom ? (this.headerContent ? this.headerContent + "\n" : "") + xmlDom.root().toString() : "";
    }
    /**
     * Define method to create a lookup for DOM
     */
    buildLookUpTable(node) {
        if (node) {
            let nodeName = node.name;
            if (nodeName) {
                nodeName = nodeName.toLowerCase();
                let listOfNodes = this.xmlDomLookUpTable[nodeName];
                if (listOfNodes == null || !(Array.isArray(listOfNodes))) {
                    listOfNodes = [];
                    this.xmlDomLookUpTable[nodeName] = listOfNodes;
                }
                listOfNodes.push(node);
                let childNodes = node.children;
                for (let i = 0; i < childNodes.length; i++) {
                    let childNodeName = childNodes[i].name;
                    if (childNodeName) {
                        this.buildLookUpTable(childNodes[i]);
                    }
                }
            }
        }
    }
    /**
     *  Returns array of nodes which match with the tag name.
     */
    getElementsByTagName(nodeName) {
        if (envVarUtility.isEmpty(nodeName))
            return [];
        let selectedElements = this.xmlDomLookUpTable[nodeName.toLowerCase()];
        if (!selectedElements) {
            selectedElements = [];
        }
        return selectedElements;
    }
    /**
     *  Search in subtree with provided node name
     */
    getChildElementsByTagName(node, tagName) {
        if (!envVarUtility.isObject(node))
            return [];
        let children = node.children;
        let liveNodes = [];
        if (children) {
            for (let i = 0; i < children.length; i++) {
                let childName = children[i].name;
                if (!envVarUtility.isEmpty(childName) && tagName == childName) {
                    liveNodes.push(children[i]);
                }
                let liveChildNodes = this.getChildElementsByTagName(children[i], tagName);
                if (liveChildNodes && liveChildNodes.length > 0) {
                    liveNodes = liveNodes.concat(liveChildNodes);
                }
            }
        }
        return liveNodes;
    }
}
exports.XmlDomUtility = XmlDomUtility;
