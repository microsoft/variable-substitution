"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const envVarUtility = __importStar(require("../operations/envVariableUtility"));
const xmlDomUtility_1 = require("../operations/xmlDomUtility");
const xmlVariableSubstitution_1 = require("../operations/xmlVariableSubstitution");
const chai = require("chai");
const fs = require("fs");
const path = require("path");
const sinon = require("sinon");
var expect = chai.expect;
describe('Test Xml Variable Substitution', () => {
    it("Should substitute", () => {
        let envVarUtilityMock = sinon.mock(envVarUtility);
        envVarUtilityMock.expects('getVariableMap').returns(new Map([
            ['conntype', 'new_connType'],
            ['MyDB', 'TestDB'],
            ['webpages:Version', '1.1.7.3'],
            ['xdt:Transform', 'DelAttributes'],
            ['xdt:Locator', 'Match(tag)'],
            ['DefaultConnection', "Url=https://primary;Database=db1;ApiKey=11111111-1111-1111-1111-111111111111;Failover = {Url:'https://secondary', ApiKey:'11111111-1111-1111-1111-111111111111'}"],
            ['OtherDefaultConnection', 'connectionStringValue2'],
            ['ParameterConnection', 'New_Connection_String From xml var subs'],
            ['connectionString', 'replaced_value'],
            ['invariantName', 'System.Data.SqlServer'],
            ['blatvar', 'ApplicationSettingReplacedValue'],
            ['log_level', 'error,warning'],
            ['Email:ToOverride', '']
        ]));
        function replaceEscapeXMLCharacters(xmlDOMNode) {
            if (!xmlDOMNode || typeof xmlDOMNode == 'string') {
                return;
            }
            for (var xmlAttribute in xmlDOMNode.attrs) {
                xmlDOMNode.attrs[xmlAttribute] = xmlDOMNode.attrs[xmlAttribute].replace(/'/g, "APOS_CHARACTER_TOKEN");
            }
            for (var xmlChild of xmlDOMNode.children) {
                replaceEscapeXMLCharacters(xmlChild);
            }
        }
        let source = path.join(__dirname, "/Resources/Web.config");
        let fileBuffer = fs.readFileSync(source);
        let fileContent = fileBuffer.toString('utf-8');
        let xmlDomUtilityInstance = new xmlDomUtility_1.XmlDomUtility(fileContent);
        let xmlSubstitution = new xmlVariableSubstitution_1.XmlSubstitution(xmlDomUtilityInstance);
        let isApplied = xmlSubstitution.substituteXmlVariables();
        expect(isApplied).to.equal(true);
        let xmlDocument = xmlDomUtilityInstance.getXmlDom();
        replaceEscapeXMLCharacters(xmlDocument);
        let domContent = '\uFEFF' + xmlDomUtilityInstance.getContentWithHeader(xmlDocument);
        for (let replacableTokenValue in xmlSubstitution.replacableTokenValues) {
            domContent = domContent.split(replacableTokenValue).join(xmlSubstitution.replacableTokenValues[replacableTokenValue]);
        }
        let expectedResult = path.join(__dirname, "/Resources/Web_Expected.config");
        fileBuffer = fs.readFileSync(expectedResult);
        let expectedContent = fileBuffer.toString('utf-8');
        let targetXmlDomUtilityInstance = new xmlDomUtility_1.XmlDomUtility(expectedContent);
        let expectedXmlDocument = targetXmlDomUtilityInstance.getXmlDom();
        replaceEscapeXMLCharacters(expectedXmlDocument);
        let expectedDomContent = '\uFEFF' + xmlDomUtilityInstance.getContentWithHeader(expectedXmlDocument);
        expectedDomContent = expectedDomContent.split("APOS_CHARACTER_TOKEN").join("'");
        expect(domContent).to.equal(expectedDomContent);
    });
});
