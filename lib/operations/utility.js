"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const os = __importStar(require("os"));
const minimatch = __importStar(require("minimatch"));
const fs = require("fs");
const path = require("path");
function findfiles(filepath) {
    core.debug("Finding files matching input: " + filepath);
    let filesList;
    if (filepath.indexOf('*') == -1 && filepath.indexOf('?') == -1) {
        // No pattern found, check literal path to a single file
        if (exist(filepath)) {
            filesList = [filepath];
        }
        else {
            core.debug('No matching files were found with search pattern: ' + filepath);
            return [];
        }
    }
    else {
        filepath = path.join(process.env.GITHUB_WORKSPACE, filepath);
        let firstWildcardIndex = function (str) {
            let idx = str.indexOf('*');
            let idxOfWildcard = str.indexOf('?');
            if (idxOfWildcard > -1) {
                return (idx > -1) ?
                    Math.min(idx, idxOfWildcard) : idxOfWildcard;
            }
            return idx;
        };
        // Find app files matching the specified pattern
        core.debug('Matching glob pattern: ' + filepath);
        // First find the most complete path without any matching patterns
        let idx = firstWildcardIndex(filepath);
        core.debug('Index of first wildcard: ' + idx);
        let slicedPath = filepath.slice(0, idx);
        let findPathRoot = path.dirname(slicedPath);
        if (slicedPath.endsWith("\\") || slicedPath.endsWith("/")) {
            findPathRoot = slicedPath;
        }
        core.debug('find root dir: ' + findPathRoot);
        // Now we get a list of all files under this root
        let allFiles = find(findPathRoot);
        // Now matching the pattern against all files
        filesList = match(allFiles, filepath, '', { matchBase: true, nocase: !!os.type().match(/^Win/) });
        // Fail if no matching files were found
        if (!filesList || filesList.length == 0) {
            core.debug('No matching files were found with search pattern: ' + filepath);
            return [];
        }
    }
    return filesList;
}
exports.findfiles = findfiles;
class _FindItem {
    constructor(path, level) {
        this.path = path;
        this.level = level;
    }
}
function find(findPath) {
    if (!findPath) {
        core.debug('no path specified');
        return [];
    }
    // normalize the path, otherwise the first result is inconsistently formatted from the rest of the results
    // because path.join() performs normalization.
    findPath = path.normalize(findPath);
    // debug trace the parameters
    core.debug(`findPath: '${findPath}'`);
    // return empty if not exists
    try {
        fs.lstatSync(findPath);
    }
    catch (err) {
        if (err.code == 'ENOENT') {
            core.debug('0 results');
            return [];
        }
        throw err;
    }
    try {
        let result = [];
        // push the first item
        let stack = [new _FindItem(findPath, 1)];
        let traversalChain = []; // used to detect cycles
        while (stack.length) {
            // pop the next item and push to the result array
            let item = stack.pop(); // non-null because `stack.length` was truthy
            result.push(item.path);
            // stat the item.  the stat info is used further below to determine whether to traverse deeper
            //
            // stat returns info about the target of a symlink (or symlink chain),
            // lstat returns info about a symlink itself
            let stats;
            // use lstat (not following symlinks)
            stats = fs.lstatSync(item.path);
            // note, isDirectory() returns false for the lstat of a symlink
            if (stats.isDirectory()) {
                core.debug(`  ${item.path} (directory)`);
                // push the child items in reverse onto the stack
                let childLevel = item.level + 1;
                let childItems = fs.readdirSync(item.path)
                    .map((childName) => new _FindItem(path.join(item.path, childName), childLevel));
                for (let i = childItems.length - 1; i >= 0; i--) {
                    stack.push(childItems[i]);
                }
            }
            else {
                core.debug(`  ${item.path} (file)`);
            }
        }
        core.debug(`${result.length} results`);
        return result;
    }
    catch (err) {
        throw new Error('LIB_OperationFailed' + 'find' + err.message);
    }
}
function _getDefaultMatchOptions() {
    return {
        debug: false,
        nobrace: true,
        noglobstar: false,
        dot: true,
        noext: false,
        nocase: process.platform == 'win32',
        nonull: false,
        matchBase: false,
        nocomment: false,
        nonegate: false,
        flipNegate: false
    };
}
function cloneMatchOptions(matchOptions) {
    return {
        debug: matchOptions.debug,
        nobrace: matchOptions.nobrace,
        noglobstar: matchOptions.noglobstar,
        dot: matchOptions.dot,
        noext: matchOptions.noext,
        nocase: matchOptions.nocase,
        nonull: matchOptions.nonull,
        matchBase: matchOptions.matchBase,
        nocomment: matchOptions.nocomment,
        nonegate: matchOptions.nonegate,
        flipNegate: matchOptions.flipNegate
    };
}
function match(list, patterns, patternRoot, options) {
    // trace parameters
    core.debug(`patternRoot: '${patternRoot}'`);
    options = options || _getDefaultMatchOptions(); // default match options
    // convert pattern to an array
    if (typeof patterns == 'string') {
        patterns = [patterns];
    }
    // hashtable to keep track of matches
    let map = {};
    let originalOptions = options;
    for (let pattern of patterns) {
        core.debug(`pattern: '${pattern}'`);
        // trim and skip empty
        pattern = (pattern || '').trim();
        if (!pattern) {
            core.debug('skipping empty pattern');
            continue;
        }
        // clone match options
        let options = cloneMatchOptions(originalOptions);
        // skip comments
        if (!options.nocomment && startsWith(pattern, '#')) {
            core.debug('skipping comment');
            continue;
        }
        // set nocomment - brace expansion could result in a leading '#'
        options.nocomment = true;
        // determine whether pattern is include or exclude
        let negateCount = 0;
        if (!options.nonegate) {
            while (pattern.charAt(negateCount) == '!') {
                negateCount++;
            }
            pattern = pattern.substring(negateCount); // trim leading '!'
            if (negateCount) {
                core.debug(`trimmed leading '!'. pattern: '${pattern}'`);
            }
        }
        let isIncludePattern = negateCount == 0 ||
            (negateCount % 2 == 0 && !options.flipNegate) ||
            (negateCount % 2 == 1 && options.flipNegate);
        // set nonegate - brace expansion could result in a leading '!'
        options.nonegate = true;
        options.flipNegate = false;
        // expand braces - required to accurately root patterns
        let expanded;
        let preExpanded = pattern;
        if (options.nobrace) {
            expanded = [pattern];
        }
        else {
            // convert slashes on Windows before calling braceExpand(). unfortunately this means braces cannot
            // be escaped on Windows, this limitation is consistent with current limitations of minimatch (3.0.3).
            core.debug('expanding braces');
            let convertedPattern = process.platform == 'win32' ? pattern.replace(/\\/g, '/') : pattern;
            expanded = minimatch.braceExpand(convertedPattern);
        }
        // set nobrace
        options.nobrace = true;
        for (let pattern of expanded) {
            if (expanded.length != 1 || pattern != preExpanded) {
                core.debug(`pattern: '${pattern}'`);
            }
            // trim and skip empty
            pattern = (pattern || '').trim();
            if (!pattern) {
                core.debug('skipping empty pattern');
                continue;
            }
            // root the pattern when all of the following conditions are true:
            if (patternRoot && // patternRoot supplied
                !isRooted(pattern) && // AND pattern not rooted
                // AND matchBase:false or not basename only
                (!options.matchBase || (process.platform == 'win32' ? pattern.replace(/\\/g, '/') : pattern).indexOf('/') >= 0)) {
                pattern = ensureRooted(patternRoot, pattern);
                core.debug(`rooted pattern: '${pattern}'`);
            }
            if (isIncludePattern) {
                // apply the pattern
                core.debug('applying include pattern against original list');
                let matchResults = minimatch.match(list, pattern, options);
                core.debug(matchResults.length + ' matches');
                // union the results
                for (let matchResult of matchResults) {
                    map[matchResult] = true;
                }
            }
            else {
                // apply the pattern
                core.debug('applying exclude pattern against original list');
                let matchResults = minimatch.match(list, pattern, options);
                core.debug(matchResults.length + ' matches');
                // substract the results
                for (let matchResult of matchResults) {
                    delete map[matchResult];
                }
            }
        }
    }
    // return a filtered version of the original list (preserves order and prevents duplication)
    let result = list.filter((item) => map.hasOwnProperty(item));
    core.debug(result.length + ' final results');
    return result;
}
function ensureRooted(root, p) {
    if (!root) {
        throw new Error('ensureRooted() parameter "root" cannot be empty');
    }
    if (!p) {
        throw new Error('ensureRooted() parameter "p" cannot be empty');
    }
    if (isRooted(p)) {
        return p;
    }
    if (process.platform == 'win32' && root.match(/^[A-Z]:$/i)) { // e.g. C:
        return root + p;
    }
    // ensure root ends with a separator
    if (endsWith(root, '/') || (process.platform == 'win32' && endsWith(root, '\\'))) {
        // root already ends with a separator
    }
    else {
        root += path.sep; // append separator
    }
    return root + p;
}
function isRooted(p) {
    p = normalizeSeparators(p);
    if (!p) {
        throw new Error('isRooted() parameter "p" cannot be empty');
    }
    if (process.platform == 'win32') {
        return startsWith(p, '\\') || // e.g. \ or \hello or \\hello
            /^[A-Z]:/i.test(p); // e.g. C: or C:\hello
    }
    return startsWith(p, '/'); // e.g. /hello
}
function startsWith(str, start) {
    return str.slice(0, start.length) == start;
}
function endsWith(str, end) {
    return str.slice(-end.length) == end;
}
function normalizeSeparators(p) {
    p = p || '';
    if (process.platform == 'win32') {
        // convert slashes on Windows
        p = p.replace(/\//g, '\\');
        // remove redundant slashes
        let isUnc = /^\\\\+[^\\]/.test(p); // e.g. \\hello
        return (isUnc ? '\\' : '') + p.replace(/\\\\+/g, '\\'); // preserve leading // for UNC
    }
    // remove redundant slashes
    return p.replace(/\/\/+/g, '/');
}
function exist(path) {
    let exist = false;
    try {
        exist = !!(path && fs.statSync(path) != null);
    }
    catch (err) {
        if (err && err.code === 'ENOENT') {
            exist = false;
        }
        else {
            throw err;
        }
    }
    return exist;
}
