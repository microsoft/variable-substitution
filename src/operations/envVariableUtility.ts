export function isPredefinedVariable(variable: string): boolean {
    let predefinedVarPrefix = ['runner.', 'azure_http_user_agent', 'common.', 'system.'];
    for(let varPrefix of predefinedVarPrefix) {
        if(variable.toLowerCase().startsWith(varPrefix)) {
            return true;
        }
    }
    return false;
}

export function getVariableMap() {
    let variableMap = new Map();
    let variables = process.env;
    Object.keys(variables).forEach(key => {
        if(!isPredefinedVariable(key)) {
            variableMap.set(key, variables[key]);
        }
    });
    return variableMap;
}

export function isEmpty(object){
    if(object == null || object == "")
        return true;
    return false;
}

export function isObject(object){
    if(object == null || object == "" || typeof(object) != 'object'){
        return false;
    }
    return true;
}

interface varTreeNode {
    value: any,
    isEnd: boolean,
    child: any
}

export class EnvTreeUtility {

    public static getEnvVarTree() {
        let util = new EnvTreeUtility();
        if(!util.envVarTree) {
            util.envVarTree = util.createEnvTree(getVariableMap());
        }

        return util.envVarTree;
    }

    private createEnvTree(envVariables): varTreeNode {
        // __proto__ is marked as null, so that custom object can be assgined.
        // This replacement do not affect the JSON object, as no inbuilt JSON function is referenced.
        let envVarTree: varTreeNode = {
            value: null,
            isEnd: false,
            child: {
                '__proto__': null
            }
        };
        for(let [key, value] of envVariables.entries()) {
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
        return envVarTree;
    }

    checkEnvTreePath(jsonObjectKey, index, jsonObjectKeyLength, envVarTree) {
        if(index == jsonObjectKeyLength) {
            return envVarTree;
        }
        if(envVarTree.child[ jsonObjectKey[index] ] === undefined || typeof envVarTree.child[ jsonObjectKey[index] ] === 'function') {
            return undefined;
       }
        return this.checkEnvTreePath(jsonObjectKey, index + 1, jsonObjectKeyLength, envVarTree.child[ jsonObjectKey[index] ]);
    }

    private envVarTree: varTreeNode = null;
}