import { JsonSubstitution } from '../operations/jsonVariableSubstitutionUtility';
import { VariableSubstitution } from "../variableSubstitution";
import { XmlSubstitution } from '../operations/xmlVariableSubstitution';
import { expect } from 'chai';

import path = require('path');
import sinon = require("sinon");

describe("Test variable substitution main", () => {
    var spy, JsonSubstitutionMock, XmlSubstitutionMock;
    before(() => {
        spy = sinon.spy(console, "log");
        JsonSubstitutionMock = sinon.mock(JsonSubstitution);
        XmlSubstitutionMock = sinon.mock(XmlSubstitution);
    });

    after(() => {        
        JsonSubstitutionMock.restore();
        XmlSubstitutionMock.restore();
        spy.restore();
    });

    it("Valid XML", () => {
        let file = path.join(__dirname, "/Resources/Web.config");
        let filesArr = file.split(",");
        let varSub = new VariableSubstitution();
        try {
            varSub.segregateFilesAndSubstitute(filesArr);
        }
        catch(e) {
        }
        expect(spy.calledWith("Applying variable substitution on XML file: " + file)).to.be.true;
    });

    it("Valid JSON", () => {
        let file = path.join(__dirname, "/Resources/test.json");
        let filesArr = file.split(",");
        let varSub = new VariableSubstitution();
        try {
            varSub.segregateFilesAndSubstitute(filesArr);
        }
        catch(e) {
        }
        expect(spy.calledWith("Applying variable substitution on JSON file: " + file)).to.be.true;
    });

    it("Invalid JSON", () => {
        let file = path.join(__dirname, "/Resources/Wrong_test.json");
        let filesArr = file.split(",");
        let varSub = new VariableSubstitution();
        try {
            varSub.segregateFilesAndSubstitute(filesArr);
        }
        catch(e) {
        }
        expect(spy.calledWith("Applying variable substitution on JSON file: " + file)).to.be.false;
    });

    it("Valid YAML", () => {
        let file = path.join(__dirname, "/Resources/test.yaml");
        let filesArr = file.split(",");
        let varSub = new VariableSubstitution();
        try {
            varSub.segregateFilesAndSubstitute(filesArr);
        }
        catch(e) {
        }
        expect(spy.calledWith("Applying variable substitution on YAML file: " + file)).to.be.true;
    });

    it("Invalid YAML", () => {
        let file = path.join(__dirname, "/Resources/Wrong_test.yml");
        let filesArr = file.split(",");
        let varSub = new VariableSubstitution();
        try {
            varSub.segregateFilesAndSubstitute(filesArr);
        }
        catch(e) {
        }
        expect(spy.calledWith("Applying variable substitution on YAML file: " + file)).to.be.false;
    });    
});