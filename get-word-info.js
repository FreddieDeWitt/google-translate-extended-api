let request = require('request-promise');
// let gtoken = require('./token-generator');
const gtoken = require('@vitalets/google-translate-token');
let languageSupport = require('./languages');
const defaultDataOptions = {
	returnRawResponse: false,
    detailedTranslations: true,
    synonyms: false,
    detailedTranslationsSynonyms: false,
    definitions: true,
    definitionExamples: false,
    examples: true,
    collocations: true,
    removeStyles: true
}
replaceAll = function(target, search, replacement) {
    return target.split(search).join(replacement);
};

let getInfo = async (word, sourceLang, destLang, dataOptions) => {
    let trObj = {
        word
    }
    if (!languageSupport.isSupported(sourceLang)) {
        throw  `Language '${sourceLang} ' is not supported`;
    } 
    if (!languageSupport.isSupported(destLang)) {
        throw  `Language '${destLang}' is not supported`;
    }
    if (dataOptions == null)
        dataOptions = {};
    Object.keys(dataOptions).forEach((key) => {
        if (defaultDataOptions[key] == null) {
            console.log(`Warning! DataOptions field "${key}" is not supported`);
        }
    })
    Object.keys(defaultDataOptions).forEach((key) => {
        if (dataOptions[key] == null) 
            dataOptions[key] = defaultDataOptions[key];
    })
    
    try {
        let token = await gtoken.get(word);
        let options = {
            method: 'GET',
            uri: `https://translate.google.com/translate_a/single?client=t&sl=${sourceLang}&tl=${destLang}&hl=${destLang}&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&ie=UTF-8&oe=UTF-8&otf=1&ssel=5&tsel=5&kc=9&tk=${token.value}&q=${encodeURIComponent(word)}`,
            json: true // Automatically stringifies the body to JSON
        };
        const rawObj = await request(options);
        if (dataOptions.returnRawResponse) {
            return rawObj;
        }

        trObj["translation"] = rawObj[0][0][0];
        trObj["wordTranscription"] = rawObj[0][1][3];
        trObj["translationTranscription"] = rawObj[0][1][2];
        setDetailedTranslations(rawObj, trObj, dataOptions);
        setSynonyms(rawObj, trObj, dataOptions);
        setDefinitions(rawObj, trObj, dataOptions);
        setExamples(rawObj, trObj, dataOptions);
        setCollocations(rawObj, trObj, dataOptions);

    } catch (e) {
        let message = e.name;
        if (e.statusCode === 403)
            message = 'Authorization failed. The token may be invalid, so please check, if there is a new version of this module.'
        throw {
            message,
            statusCode: e.statusCode
        };
    }
    return trObj;
}

let setDetailedTranslations = (rawObj, destObj, dataOptions)=> {
    if (dataOptions.detailedTranslations) {
        destObj[["translations"]] = {};
        if (rawObj[1]) {
            rawObj[1].forEach(translation => {
                let wordType = translation[0];
                destObj["translations"][wordType] = translation[2].map(details => {
                    if (dataOptions.detailedTranslationsSynonyms)
                        return {
                            translation: details[0],
                            synonyms: details[1],
                            frequency: details[3]
                        };
                    return details[0];
                });
            });
        }
    }

}

let setSynonyms = (rawObj, destObj, dataOptions) => {
    if (dataOptions.synonyms) {
        destObj["synonyms"] = {};
    }
    if (dataOptions.synonyms && rawObj[11]) {
        rawObj[11].forEach((synonymDetailes) => {
            let synonymsObj = destObj["synonyms"];
            synonymsObj[synonymDetailes[0]] = synonymDetailes[1].map(synomyns => synomyns[0]);
        })
    }
};

let setDefinitions = (rawObj, destObj, dataOptions) => {
    if (dataOptions.definitions) {
        destObj["definitions"] = {};
    }
    if (dataOptions.definitions && rawObj[12]) {
        rawObj[12].forEach((definitionDetails) => {
            destObj["definitions"][definitionDetails[0]] = definitionDetails[1].map((defElem) => {
                if (dataOptions.definitionExamples)
                    return {
                        definition: defElem[0],
                        example: defElem[2]
                    }
                else 
                    return defElem[0];
            });
        })
    }
};

let setExamples = (rawObj, destObj, dataOptions) => {
    if (dataOptions.examples)
        destObj["examples"] = [];
    if (dataOptions.examples && rawObj[13]) {
        destObj["examples"] = rawObj[13][0].map(element => {
            if (dataOptions.removeStyles) {
                return element[0].replace('<b>','').replace('</b>', '');
            }
            return element[0]}
        );
    }
};

let setCollocations = (rawObj, destObj, dataOptions) => {
    if (dataOptions.collocations) {
        destObj["collocations"] = [];
    }
    if (dataOptions.collocations && rawObj[14]) {
        destObj["collocations"] = rawObj[14][0];
    }
}

    module.exports = getInfo;
module.exports.languages = languageSupport;
module.exports.defaultDataOptions = defaultDataOptions;
