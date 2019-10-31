"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
let envVarUtility = require('./envVariableUtility');
const tags = ["applicationSettings", "appSettings", "connectionStrings", "configSections"];
class XmlSubstitution {
    constructor(xmlDomUtilityInstance) {
        this.replacableTokenValues = { "APOS_CHARACTER_TOKEN": "'" };
        this.variableMap = envVarUtility.getVariableMap();
        this.xmlDomUtility = xmlDomUtilityInstance;
    }
    substituteXmlVariables() {
        let isSubstitutionApplied = false;
        for (let tag of tags) {
            let nodes = this.xmlDomUtility.getElementsByTagName(tag);
            if (nodes.length == 0) {
                core.debug("Unable to find node with tag '" + tag + "' in provided xml file.");
                continue;
            }
            for (let xmlNode of nodes) {
                if (envVarUtility.isObject(xmlNode)) {
                    console.log('Processing substitution for xml node: ', xmlNode.name);
                    try {
                        if (xmlNode.name == "configSections") {
                            isSubstitutionApplied = this.updateXmlConfigNodeAttribute(xmlNode) || isSubstitutionApplied;
                        }
                        else if (xmlNode.name == "connectionStrings") {
                            isSubstitutionApplied = this.updateXmlConnectionStringsNodeAttribute(xmlNode) || isSubstitutionApplied;
                        }
                        else {
                            isSubstitutionApplied = this.updateXmlNodeAttribute(xmlNode) || isSubstitutionApplied;
                        }
                    }
                    catch (error) {
                        core.debug("Error occurred while processing xml node : " + xmlNode.name);
                        core.debug(error);
                    }
                }
            }
        }
        return isSubstitutionApplied;
    }
    updateXmlConfigNodeAttribute(xmlNode) {
        let isSubstitutionApplied = false;
        let sections = this.xmlDomUtility.getChildElementsByTagName(xmlNode, "section");
        for (let section of sections) {
            if (envVarUtility.isObject(section)) {
                let sectionName = section.attr('name');
                if (!envVarUtility.isEmpty(sectionName)) {
                    let customSectionNodes = this.xmlDomUtility.getElementsByTagName(sectionName);
                    if (customSectionNodes.length != 0) {
                        let customNode = customSectionNodes[0];
                        isSubstitutionApplied = this.updateXmlNodeAttribute(customNode) || isSubstitutionApplied;
                    }
                }
            }
        }
        return isSubstitutionApplied;
    }
    updateXmlNodeAttribute(xmlDomNode) {
        let isSubstitutionApplied = false;
        if (envVarUtility.isEmpty(xmlDomNode) || !envVarUtility.isObject(xmlDomNode) || xmlDomNode.name == "#comment") {
            core.debug("Provided node is empty or a comment.");
            return isSubstitutionApplied;
        }
        const ConfigFileAppSettingsToken = 'CONFIG_FILE_SETTINGS_TOKEN';
        let xmlDomNodeAttributes = xmlDomNode.attrs;
        for (var attributeName in xmlDomNodeAttributes) {
            var attributeNameValue = (attributeName === "key" || attributeName == "name") ? xmlDomNodeAttributes[attributeName] : attributeName;
            var attributeName = (attributeName === "key" || attributeName == "name") ? "value" : attributeName;
            if (this.variableMap.get(attributeNameValue) != undefined) {
                let ConfigFileAppSettingsTokenName = ConfigFileAppSettingsToken + '(' + attributeNameValue + ')';
                let isValueReplaced = false;
                if (xmlDomNode.getAttr(attributeName) != undefined) {
                    console.log(`Updating value for key: ${attributeNameValue} with token value: ${ConfigFileAppSettingsTokenName}`);
                    xmlDomNode.attr(attributeName, ConfigFileAppSettingsTokenName);
                    isValueReplaced = true;
                }
                else {
                    let children = xmlDomNode.children;
                    for (var childNode of children) {
                        if (envVarUtility.isObject(childNode) && childNode.name == attributeName) {
                            if (childNode.children.length === 1) {
                                console.log(`Updating value for key: ${attributeNameValue} with token value: ${ConfigFileAppSettingsTokenName}`);
                                childNode.children[0] = ConfigFileAppSettingsTokenName;
                                isValueReplaced = true;
                            }
                        }
                    }
                }
                if (isValueReplaced) {
                    this.replacableTokenValues[ConfigFileAppSettingsTokenName] = this.variableMap.get(attributeNameValue).replace(/"/g, "'");
                    isSubstitutionApplied = true;
                }
            }
        }
        let children = xmlDomNode.children;
        for (var childNode of children) {
            if (envVarUtility.isObject(childNode)) {
                isSubstitutionApplied = this.updateXmlNodeAttribute(childNode) || isSubstitutionApplied;
            }
        }
        return isSubstitutionApplied;
    }
    updateXmlConnectionStringsNodeAttribute(xmlDomNode) {
        let isSubstitutionApplied = false;
        const ConfigFileConnStringToken = 'CONFIG_FILE_CONN_STRING_TOKEN';
        if (envVarUtility.isEmpty(xmlDomNode) || !envVarUtility.isObject(xmlDomNode) || xmlDomNode.name == "#comment") {
            core.debug("Provided node is empty or a comment.");
            return isSubstitutionApplied;
        }
        let xmlDomNodeAttributes = xmlDomNode.attrs;
        if (xmlDomNodeAttributes.hasOwnProperty("connectionString")) {
            if (xmlDomNodeAttributes.hasOwnProperty("name") && this.variableMap.get(xmlDomNodeAttributes.name)) {
                let ConfigFileConnStringTokenName = ConfigFileConnStringToken + '(' + xmlDomNodeAttributes.name + ')';
                core.debug(`Substituting connectionString value for connectionString= ${xmlDomNodeAttributes.name} with token value: ${ConfigFileConnStringTokenName}`);
                xmlDomNode.attr("connectionString", ConfigFileConnStringTokenName);
                this.replacableTokenValues[ConfigFileConnStringTokenName] = this.variableMap.get(xmlDomNodeAttributes.name).replace(/"/g, "'");
                isSubstitutionApplied = true;
            }
            else if (this.variableMap.get("connectionString") != undefined) {
                let ConfigFileConnStringTokenName = ConfigFileConnStringToken + '(connectionString)';
                core.debug(`Substituting connectionString value for connectionString= ${xmlDomNodeAttributes.name} with token value: ${ConfigFileConnStringTokenName}`);
                xmlDomNode.attr("connectionString", ConfigFileConnStringTokenName);
                this.replacableTokenValues[ConfigFileConnStringTokenName] = this.variableMap.get("connectionString").replace(/"/g, "'");
                isSubstitutionApplied = true;
            }
        }
        let children = xmlDomNode.children;
        for (var childNode of children) {
            if (envVarUtility.isObject(childNode)) {
                isSubstitutionApplied = this.updateXmlConnectionStringsNodeAttribute(childNode) || isSubstitutionApplied;
            }
        }
        return isSubstitutionApplied;
    }
}
exports.XmlSubstitution = XmlSubstitution;
