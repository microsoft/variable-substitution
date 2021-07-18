"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonVariableSubstitutionUtility_1 = require("../operations/jsonVariableSubstitutionUtility");
const variableSubstitution_1 = require("../variableSubstitution");
const xmlVariableSubstitution_1 = require("../operations/xmlVariableSubstitution");
const chai_1 = require("chai");
const path = require("path");
const sinon = require("sinon");
describe("Test variable substitution main", () => {
    var spy, JsonSubstitutionMock, XmlSubstitutionMock;
    before(() => {
        spy = sinon.spy(console, "log");
        JsonSubstitutionMock = sinon.mock(jsonVariableSubstitutionUtility_1.JsonSubstitution);
        XmlSubstitutionMock = sinon.mock(xmlVariableSubstitution_1.XmlSubstitution);
    });
    after(() => {
        JsonSubstitutionMock.restore();
        XmlSubstitutionMock.restore();
        spy.restore();
    });
    it("Valid XML", () => {
        let file = path.join(__dirname, "/Resources/Web.config");
        let filesArr = file.split(",");
        let varSub = new variableSubstitution_1.VariableSubstitution();
        try {
            varSub.segregateFilesAndSubstitute(filesArr);
        }
        catch (e) {
        }
        chai_1.expect(spy.calledWith("Applying variable substitution on XML file: " + file)).to.be.true;
    });
    it("Valid JSON", () => {
        let file = path.join(__dirname, "/Resources/test.json");
        let filesArr = file.split(",");
        let varSub = new variableSubstitution_1.VariableSubstitution();
        try {
            varSub.segregateFilesAndSubstitute(filesArr);
        }
        catch (e) {
        }
        chai_1.expect(spy.calledWith("Applying variable substitution on JSON file: " + file)).to.be.true;
    });
    it("Invalid JSON", () => {
        let file = path.join(__dirname, "/Resources/Wrong_test.json");
        let filesArr = file.split(",");
        let varSub = new variableSubstitution_1.VariableSubstitution();
        try {
            varSub.segregateFilesAndSubstitute(filesArr);
        }
        catch (e) {
        }
        chai_1.expect(spy.calledWith("Applying variable substitution on JSON file: " + file)).to.be.false;
    });
    it("Valid YAML", () => {
        let file = path.join(__dirname, "/Resources/test.yaml");
        let filesArr = file.split(",");
        let varSub = new variableSubstitution_1.VariableSubstitution();
        try {
            varSub.segregateFilesAndSubstitute(filesArr);
        }
        catch (e) {
        }
        chai_1.expect(spy.calledWith("Applying variable substitution on YAML file: " + file)).to.be.true;
    });
    it("Invalid YAML", () => {
        let file = path.join(__dirname, "/Resources/Wrong_test.yml");
        let filesArr = file.split(",");
        let varSub = new variableSubstitution_1.VariableSubstitution();
        try {
            varSub.segregateFilesAndSubstitute(filesArr);
        }
        catch (e) {
        }
        chai_1.expect(spy.calledWith("Applying variable substitution on YAML file: " + file)).to.be.false;
    });
});
