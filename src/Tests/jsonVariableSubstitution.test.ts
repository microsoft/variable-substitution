import sinon = require("sinon");
import chai = require('chai');

import { EnvTreeUtility, isPredefinedVariable } from "../operations/envVariableUtility";

import { JsonSubstitution } from "../operations/jsonVariableSubstitutionUtility";

var expect = chai.expect;

describe('Test JSON Variable Substitution', () => {
    var jsonObject, isApplied;

    before(() => {       
        let stub = sinon.stub(EnvTreeUtility, "getEnvVarTree").callsFake(() => {
            let envVariables = new Map([
                [ 'system.debug', 'true'],
                [ 'data.ConnectionString', 'database_connection'],
                [ 'data.userName', 'db_admin'],
                [ 'data.password', 'db_pass'],
                [ '&pl.ch@r@cter.k^y', '*.config'],
                [ 'build.sourceDirectory', 'DefaultWorkingDirectory'],
                [ 'user.profile.name.first', 'firstName'],
                [ 'user.profile', 'replace_all'],
                [ 'constructor.name', 'newConstructorName'],
                [ 'constructor.valueOf', 'constructorNewValue'],
                [ 'profile.users', '["suaggar","rok","asranja", "chaitanya"]'],
                [ 'profile.enabled', 'false'],
                [ 'profile.version', '1173'],
                [ 'profile.somefloat', '97.75'],
                [ 'profile.preimum_level', '{"suaggar": "V4", "rok": "V5", "asranja": { "type" : "V6"}}']
            ]);
            let envVarTree = {
                value: null,
                isEnd: false,
                child: {
                    '__proto__': null
                }
            };
            for(let [key, value] of envVariables.entries()) {
                if(!isPredefinedVariable(key)) {
                    let envVarTreeIterator = envVarTree;
                    let envVariableNameArray = key.split('.');
                    
                    for(let variableName of envVariableNameArray) {
                        if(envVarTreeIterator.child[variableName] === undefined || typeof envVarTreeIterator.child[variableName] === 'function') {
                            envVarTreeIterator.child[variableName] = {
                                value: null,
                                isEnd: false,
                                child: {}
                            };
                        }
                        envVarTreeIterator = envVarTreeIterator.child[variableName];
                    }
                    envVarTreeIterator.isEnd = true;
                    envVarTreeIterator.value = value;
                }
            }
            return envVarTree;
        });
        
        jsonObject = {
            'User.Profile': 'do_not_replace',
            'data': {
                'ConnectionString' : 'connect_string',
                'userName': 'name',
                'password': 'pass'
            },
            '&pl': {
                'ch@r@cter.k^y': 'v@lue'
            },
            'system': {
                'debug' : 'no_change'
            },
            'user.profile': {
                'name.first' : 'fname'
            },
            'constructor.name': 'myconstructorname',
            'constructor': {
                'name': 'myconstructorname',
                'valueOf': 'myconstructorvalue'
            },
            'profile': {
                'users': ['arjgupta', 'raagra', 'muthuk'],
                'preimum_level': {
                    'arjgupta': 'V1',
                    'raagra': 'V2',
                    'muthuk': {
                        'type': 'V3'
                    }
                },
                "enabled": true,
                "version": 2,
                "somefloat": 2.3456
            }
        };

        let jsonSubsitution =  new JsonSubstitution();
        isApplied = jsonSubsitution.substituteJsonVariable(jsonObject, EnvTreeUtility.getEnvVarTree());
        stub.restore();
    });

    it("Should substitute", () => {
        console.log(JSON.stringify(jsonObject));
        expect(isApplied).to.equal(true);
    });

    it("Validate simple string change", () => {
        expect(jsonObject['data']['ConnectionString']).to.equal('database_connection');
        expect(jsonObject['data']['userName']).to.equal('db_admin');
    });

    it("Validate system variable elimination", () => {
        expect(jsonObject['system']['debug']).to.equal('no_change');
    });

    it("Validate special variables", () => {
        expect(jsonObject['&pl']['ch@r@cter.k^y']).to.equal('*.config');
    });

    it("Validate case sensitive variables", () => {
        expect(jsonObject['User.Profile']).to.equal('do_not_replace');
    });

    it("Validate inbuilt JSON attributes substitution", () => {
        expect(jsonObject['constructor.name']).to.equal('newConstructorName');
        expect(jsonObject['constructor']['name']).to.equal('newConstructorName');
        expect(jsonObject['constructor']['valueOf']).to.equal('constructorNewValue');
    });

    it("Validate Array Object", () => {
        expect(jsonObject['profile']['users'].length).to.equal(4);
        let newArray = ["suaggar", "rok", "asranja", "chaitanya"];
        expect(jsonObject['profile']['users']).to.deep.equal(newArray);
    });

    it("Validate Boolean", () => {
        expect(jsonObject['profile']['enabled']).to.equal(false);
    });

    it("Validate Number(float)", () => {
        expect(jsonObject['profile']['somefloat']).to.equal(97.75);
    });

    it("Validate Number(int)", () => {
        expect(jsonObject['profile']['version']).to.equal(1173);
    });

    it("Validate Object", () => {
        expect(jsonObject['profile']['preimum_level']).to.deep.equal({"suaggar": "V4", "rok": "V5", "asranja": { "type" : "V6"}});
    });
});