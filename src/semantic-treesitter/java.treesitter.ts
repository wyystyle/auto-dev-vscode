import { TSLanguageConfig, MemoizedQuery } from "./TSLanguageConfig";
import path from "path";
import { extensionLanguageMap } from "../language/supported";
import Parser from "web-tree-sitter";
import { getLanguage } from "../language/parser";

const JAVA: TSLanguageConfig = {
    languageIds: ['Java'],
    fileExtensions: ['java'],
    grammar: () => { 
        return getLanguage('java');
    },
    scopeQuery: new MemoizedQuery(""),
    hoverableQuery: new MemoizedQuery(`
      [(identifier)
       (type_identifier)] @hoverable
    `),
    namespaces: [
      [
        // variables
        'local',
        // functions
        'method',
        // namespacing, modules
        'package',
        'module',
        // types
        'class',
        'enum',
        'enumConstant',
        'record',
        'interface',
        'typedef',
        // misc.
        'label',
      ]
    ]
  };
  