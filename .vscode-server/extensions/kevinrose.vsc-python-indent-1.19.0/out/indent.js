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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newlineAndIndent = newlineAndIndent;
exports.editsToMake = editsToMake;
exports.extendCommentToNextLine = extendCommentToNextLine;
exports.currentLineDedentation = currentLineDedentation;
exports.trimCurrentLine = trimCurrentLine;
exports.startingWhitespaceLength = startingWhitespaceLength;
const vscode = __importStar(require("vscode"));
const parser_1 = require("./parser");
function newlineAndIndent(textEditor, edit, args) {
    // Get rid of any user selected text, since a selection is
    // always deleted whenever ENTER is pressed.
    // This should always happen first
    if (!textEditor.selection.isEmpty) {
        edit.delete(textEditor.selection);
        // Make sure we get rid of the selection range.
        textEditor.selection = new vscode.Selection(textEditor.selection.end, textEditor.selection.end);
    }
    const position = textEditor.selection.active;
    const tabSize = textEditor.options.tabSize;
    const insertionPoint = new vscode.Position(position.line, position.character);
    const currentLine = textEditor.document.lineAt(position).text;
    let snippetCursor = '$0';
    let settings = vscode.workspace.getConfiguration('pythonIndent');
    if (settings.useTabOnHangingIndent) {
        snippetCursor = '$1';
    }
    let hanging = parser_1.Hanging.none;
    let toInsert = '\n';
    try {
        if (textEditor.document.languageId === 'python') {
            const lines = textEditor.document.getText(new vscode.Range(0, 0, position.line, position.character)).split("\n");
            const edits = editsToMake(lines, currentLine, tabSize, position.line, position.character, settings.trimLinesWithOnlyWhitespace, settings.keepHangingBracketOnLine);
            toInsert = edits.insert;
            edits.deletes.forEach(range => { edit.delete(range); });
            hanging = edits.hanging;
        }
    }
    finally {
        // we never ever want to crash here, fallback on just inserting newline
        if (hanging === parser_1.Hanging.full) {
            // Hanging indents end up with the cursor in a bad place if we
            // just use the edit.insert() function, snippets behave better.
            // The VSCode snippet logic already does some indentation handling,
            // so don't use the toInsert, just ' ' * tabSize.
            // That behavior is not documented.
            textEditor.insertSnippet(new vscode.SnippetString('\n' + ' '.repeat(tabSize) + snippetCursor + '\n'));
        }
        else {
            edit.insert(insertionPoint, toInsert);
        }
        textEditor.revealRange(new vscode.Range(position, new vscode.Position(position.line + 2, 0)));
    }
}
function editsToMake(lines, currentLine, tabSize, lineNum, charNum, trimLinesWithOnlyWhitespace, keepHangingBracketOnLine) {
    let { nextIndentationLevel: indent, parseOutput: parseOut } = (0, parser_1.indentationInfo)(lines, tabSize);
    let deletes = [];
    // If cursor has whitespace to the right, followed by non-whitespace,
    // and also has non-whitespace to the left, then trim the whitespace to the right
    // of the cursor. E.g. in cases like "def f(x,| y):"
    const numCharsToDelete = startingWhitespaceLength(currentLine.slice(charNum));
    if ((numCharsToDelete > 0) && (/\S/.test(currentLine.slice(0, charNum)))) {
        deletes.push(new vscode.Range(lineNum, charNum, lineNum, charNum + numCharsToDelete));
    }
    const dedentAmount = currentLineDedentation(lines, tabSize, parseOut);
    const shouldTrim = trimCurrentLine(lines[lines.length - 1], trimLinesWithOnlyWhitespace);
    if ((dedentAmount > 0) || shouldTrim) {
        const totalDeleteAmount = shouldTrim ? lines[lines.length - 1].length : dedentAmount;
        deletes.push(new vscode.Range(lineNum, 0, lineNum, totalDeleteAmount));
        indent = Math.max(indent - dedentAmount, 0);
    }
    let hanging = (0, parser_1.shouldHang)(currentLine, charNum);
    if (keepHangingBracketOnLine && hanging === parser_1.Hanging.full) {
        // The only difference between partial and full is that
        // full puts the closing bracket on its own line.
        hanging = parser_1.Hanging.partial;
    }
    let toInsert = '\n';
    if (hanging === parser_1.Hanging.partial) {
        toInsert = '\n' + ' '.repeat((0, parser_1.indentationLevel)(currentLine) + tabSize);
    }
    else {
        toInsert = '\n' + ' '.repeat(Math.max(indent, 0));
    }
    if (extendCommentToNextLine(currentLine, charNum)) {
        toInsert = toInsert + '# ';
    }
    return { insert: toInsert, deletes: deletes, hanging: hanging };
}
// Current line is a comment line, and we should make the next one commented too.
function extendCommentToNextLine(line, pos) {
    if (line.trim().startsWith('#') && line.slice(pos).trim().length && line.slice(0, pos).trim().length) {
        return true;
    }
    return false;
}
// Returns the number of spaces that should be removed from the current line
function currentLineDedentation(lines, tabSize, parseOut) {
    const dedentKeywords = { elif: ["if"], else: ["if", "try", "for", "while"], except: ["try"], finally: ["try"] };
    // Reverse to help searching, use slice() to copy since reverse() is inplace
    const line = lines[lines.length - 1];
    const trimmed = line.trim();
    if (trimmed.endsWith(":")) {
        for (const keyword of Object.keys(dedentKeywords).filter((key) => trimmed.startsWith(key))) {
            var lastSeenIndentRows = [-1];
            dedentKeywords[keyword].map((indentKeyword) => {
                const indenterRow = parseOut.last_seen_indenters[(indentKeyword + '_')];
                if (typeof indenterRow === 'number') {
                    lastSeenIndentRows.push(indenterRow);
                }
            });
            const matchingLineNumber = Math.max(...lastSeenIndentRows);
            if (matchingLineNumber >= 0) {
                const currentIndent = (0, parser_1.indentationLevel)(line);
                const matchedIndent = (0, parser_1.indentationLevel)(lines[matchingLineNumber]);
                return Math.max(0, Math.min(tabSize, currentIndent, currentIndent - matchedIndent));
            }
        }
    }
    return 0;
}
// Returns true if the current line should have all of its characters deleted.
function trimCurrentLine(line, trimLinesWithOnlyWhitespace) {
    if (trimLinesWithOnlyWhitespace) {
        if (line.trim().length === 0) {
            // That means the string contained only whitespace.
            return true;
        }
    }
    return false;
}
// Returns the number of whitespace characters until the next non-whitespace char
// If there are no non-whitespace chars, returns 0, regardless of number of whitespace chars.
function startingWhitespaceLength(line) {
    return /\S/.exec(line)?.index ?? 0;
}
//# sourceMappingURL=indent.js.map