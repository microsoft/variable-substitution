"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai = require("chai");
const envVariableUtility_1 = require("../operations/envVariableUtility");
const jsonVariableSubstitutionUtility_1 = require("../operations/jsonVariableSubstitutionUtility");
var expect = chai.expect;
describe('Test JSON Variable Substitution with period', () => {
    var jsonObject, isApplied;
    var splitChar = '.';
    before(() => {
        let stub = sinon.stub(envVariableUtility_1.EnvTreeUtility, "getEnvVarTree").callsFake(() => {
            let envVariables = new Map([
                ['system.debug', 'true'],
                ['data.ConnectionString', 'database_connection'],
                ['data.userName', 'db_admin'],
                ['data.password', 'db_pass'],
                ['&pl.ch@r@cter.k^y', '*.config'],
                ['build.sourceDirectory', 'DefaultWorkingDirectory'],
                ['user.profile.name.first', 'firstName'],
                ['user.profile', 'replace_all'],
                ['constructor.name', 'newConstructorName'],
                ['constructor.valueOf', 'constructorNewValue'],
                ['profile.users', '["suaggar","rok","asranja", "chaitanya"]'],
                ['profile.enabled', 'false'],
                ['profile.version', '1173'],
                ['profile.somefloat', '97.75'],
                ['profile.premium_level', '{"suaggar": "V4", "rok": "V5", "asranja": { "type" : "V6"}}']
            ]);
            let envVarTree = {
                value: null,
                isEnd: false,
                child: {
                    '__proto__': null
                }
            };
            for (let [key, value] of envVariables.entries()) {
                if (!envVariableUtility_1.isPredefinedVariable(key)) {
                    let envVarTreeIterator = envVarTree;
                    let envVariableNameArray = key.split(splitChar);
                    for (let variableName of envVariableNameArray) {
                        if (envVarTreeIterator.child[variableName] === undefined || typeof envVarTreeIterator.child[variableName] === 'function') {
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
                'ConnectionString': 'connect_string',
                'userName': 'name',
                'password': 'pass'
            },
            '&pl': {
                'ch@r@cter.k^y': 'v@lue'
            },
            'system': {
                'debug': 'no_change'
            },
            'user.profile': {
                'name.first': 'fname'
            },
            'constructor.name': 'myconstructorname',
            'constructor': {
                'name': 'myconstructorname',
                'valueOf': 'myconstructorvalue'
            },
            'profile': {
                'users': ['arjgupta', 'raagra', 'muthuk'],
                'premium_level': {
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
        let jsonSubsitution = new jsonVariableSubstitutionUtility_1.JsonSubstitution();
        isApplied = jsonSubsitution.substituteJsonVariable(jsonObject, envVariableUtility_1.EnvTreeUtility.getEnvVarTree(splitChar));
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
        expect(jsonObject['profile']['premium_level']).to.deep.equal({ "suaggar": "V4", "rok": "V5", "asranja": { "type": "V6" } });
    });
});
describe('Test JSON Variable Substition with underscores', () => {
    var jsonObject, isApplied;
    var splitChar = '__';
    before(() => {
        let stub = sinon.stub(envVariableUtility_1.EnvTreeUtility, "getEnvVarTree").callsFake(() => {
            let envVariables = new Map([
                ['system.debug', 'true'],
                ['data__ConnectionString', 'database_connection'],
                ['data__userName', 'db_admin'],
                ['data__password', 'db_pass'],
                ['&pl__ch@r@cter__k^y', '*.config'],
                ['build__sourceDirectory', 'DefaultWorkingDirectory'],
                ['user__profile__name__first', 'firstName'],
                ['user__profile', 'replace_all'],
                ['constructor__name', 'newConstructorName'],
                ['constructor__valueOf', 'constructorNewValue'],
                ['profile__users', '["suaggar","rok","asranja", "chaitanya"]'],
                ['profile__enabled', 'false'],
                ['profile__version', '1173'],
                ['profile__somefloat', '97.75'],
                ['profile__premium_level', '{"suaggar": "V4", "rok": "V5", "asranja": { "type" : "V6"}}']
            ]);
            let envVarTree = {
                value: null,
                isEnd: false,
                child: {
                    '__proto__': null
                }
            };
            for (let [key, value] of envVariables.entries()) {
                if (!envVariableUtility_1.isPredefinedVariable(key)) {
                    let envVarTreeIterator = envVarTree;
                    let envVariableNameArray = key.split(splitChar);
                    for (let variableName of envVariableNameArray) {
                        if (envVarTreeIterator.child[variableName] === undefined || typeof envVarTreeIterator.child[variableName] === 'function') {
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
                'ConnectionString': 'connect_string',
                'userName': 'name',
                'password': 'pass'
            },
            '&pl': {
                'ch@r@cter.k^y': 'v@lue'
            },
            'system': {
                'debug': 'no_change'
            },
            'user.profile': {
                'name.first': 'fname'
            },
            'constructor.name': 'myconstructorname',
            'constructor': {
                'name': 'myconstructorname',
                'valueOf': 'myconstructorvalue'
            },
            'profile': {
                'users': ['arjgupta', 'raagra', 'muthuk'],
                'premium_level': {
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
        let jsonSubsitution = new jsonVariableSubstitutionUtility_1.JsonSubstitution();
        isApplied = jsonSubsitution.substituteJsonVariable(jsonObject, envVariableUtility_1.EnvTreeUtility.getEnvVarTree(splitChar));
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
        expect(jsonObject['profile']['premium_level']).to.deep.equal({ "suaggar": "V4", "rok": "V5", "asranja": { "type": "V6" } });
    });
});
