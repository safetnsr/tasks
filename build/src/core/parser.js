"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTaskFile = parseTaskFile;
exports.parseTaskContent = parseTaskContent;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const yaml_1 = __importDefault(require("yaml"));
function parseTaskFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return parseTaskContent(content, filePath);
}
function parseTaskContent(content, filePath) {
    const { frontmatter, body } = extractFrontmatter(content);
    const taskSection = extractSection(body, 'task');
    if (taskSection === null) {
        throw new Error(`Missing ## task section in ${filePath}`);
    }
    const acceptanceSection = extractSection(body, 'acceptance');
    if (acceptanceSection === null) {
        throw new Error(`Missing ## acceptance section in ${filePath}`);
    }
    const contextSection = extractSection(body, 'context');
    const contextFiles = contextSection ? parseContextList(contextSection) : [];
    const acceptance = parseAcceptanceCriteria(acceptanceSection);
    const name = (typeof frontmatter.name === 'string' ? frontmatter.name : '') || path.basename(filePath, '.md');
    const timeout = typeof frontmatter.timeout === 'number' ? frontmatter.timeout : 600;
    return {
        name,
        timeout,
        task: taskSection.trim(),
        context: contextFiles,
        acceptance,
        filePath,
    };
}
function extractFrontmatter(content) {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!fmMatch) {
        return { frontmatter: {}, body: content };
    }
    let frontmatter = {};
    try {
        frontmatter = yaml_1.default.parse(fmMatch[1]) || {};
    }
    catch {
        frontmatter = {};
    }
    return { frontmatter, body: fmMatch[2] };
}
function extractSection(body, sectionName) {
    const regex = new RegExp(`^## ${sectionName}\\s*$`, 'im');
    const match = regex.exec(body);
    if (!match)
        return null;
    const start = match.index + match[0].length;
    const nextSection = body.slice(start).search(/^## /m);
    const end = nextSection === -1 ? body.length : start + nextSection;
    return body.slice(start, end).trim();
}
function parseContextList(section) {
    return section
        .split('\n')
        .map(line => line.replace(/^[\s]*[-*]\s*/, '').trim())
        .filter(line => line.length > 0);
}
function parseAcceptanceCriteria(section) {
    return section
        .split('\n')
        .map(line => line.replace(/^[\s]*-\s*\[[ x]?\]\s*/, '').trim())
        .filter(line => line.length > 0)
        .map(parseCriterionLine);
}
function parseCriterionLine(raw) {
    // test:pass
    if (/^test:pass$/i.test(raw)) {
        return { type: 'test-pass', raw };
    }
    // command:exit0 "<cmd>"
    const cmdMatch = raw.match(/^command:exit0\s+"(.+)"$/i);
    if (cmdMatch) {
        return { type: 'command-exit0', command: cmdMatch[1], raw };
    }
    // <path> contains "<str>"
    const containsMatch = raw.match(/^(\S+)\s+contains\s+"(.+)"$/i);
    if (containsMatch) {
        return { type: 'file-contains', path: containsMatch[1], value: containsMatch[2], raw };
    }
    // <path> > N lines
    const linesMatch = raw.match(/^(\S+)\s*>\s*(\d+)\s+lines$/i);
    if (linesMatch) {
        return { type: 'file-min-lines', path: linesMatch[1], minLines: parseInt(linesMatch[2], 10), raw };
    }
    // <path> exists
    const existsMatch = raw.match(/^(\S+)\s+exists$/i);
    if (existsMatch) {
        return { type: 'file-exists', path: existsMatch[1], raw };
    }
    // fallback: if it looks like a file path, treat as file-exists
    if (/\.\w+$/.test(raw) || raw.includes('/')) {
        return { type: 'file-exists', path: raw.trim(), raw };
    }
    // otherwise treat as test-pass
    return { type: 'test-pass', raw };
}
