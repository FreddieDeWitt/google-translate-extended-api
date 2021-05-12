var querystring = require('querystring');

var got = require('got');


// safely get access to a nested element of object o
// return null if some property doesn't exist at any level
const getNested = (o, p) =>
  p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o)
let languageSupport = require('./languages');

const defaultDataOptions = {
	returnRawResponse: false,
    detailedTranslations: true,
    definitionSynonyms: false,
    detailedTranslationsSynonyms: false,
    definitions: true,
    definitionExamples: false,
    examples: true,
    removeStyles: true
}
replaceAll = function(target, search, replacement) {
    return target.split(search).join(replacement);
};

var got = require('got');

var languages = require('./languages');

function extract(key, res) {
    var re = new RegExp(`"${key}":".*?"`);
    var result = re.exec(res.body);
    if (result !== null) {
        return result[0].replace(`"${key}":"`, '').slice(0, -1);
    }
    return '';
}


// function that sends a request to google translate service and return 
// a translation object
// fully based on code from @vitalets/google-translate-api
async function get_raw_object(text, opts, gotopts) {
    opts = opts || {};
    gotopts = gotopts || {};
    gotopts.headers = {}
    var e;
    [opts.from, opts.to].forEach(function (lang) {
        if (lang && !languages.isSupported(lang)) {
            e = new Error();
            e.code = 400;
            e.message = 'The language \'' + lang + '\' is not supported';
        }
    });
    if (e) {
        return new Promise(function (resolve, reject) {
            reject(e);
        });
    }

    opts.from = opts.from || 'auto';
    opts.to = opts.to || 'en';
    opts.tld = opts.tld || 'com';

    opts.from = languages.getCode(opts.from);
    opts.to = languages.getCode(opts.to);

    var url = 'https://translate.google.' + opts.tld;
    res = await got(url, gotopts)
   
    var data = {
        'rpcids': 'MkEWBc',
        'f.sid': extract('FdrFJe', res),
        'bl': extract('cfb2h', res),
        'hl': 'en-US',
        'soc-app': 1,
        'soc-platform': 1,
        'soc-device': 1,
        '_reqid': Math.floor(1000 + (Math.random() * 9000)),
        'rt': 'c'
    };
    url = url + '/_/TranslateWebserverUi/data/batchexecute?' + querystring.stringify(data);
    gotopts.body = 'f.req=' + encodeURIComponent(JSON.stringify([[['MkEWBc', JSON.stringify([[text, opts.from, opts.to, true], [null]]), null, 'generic']]])) + '&';
    gotopts.headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8';


    res = await got.post(url, gotopts)
    var json = res.body.slice(6);
    var length = '';

    try {
        length = /^\d+/.exec(json)[0];
        json = JSON.parse(json.slice(length.length, parseInt(length, 10) + length.length));
        json = JSON.parse(json[0][2]);
        return json
    } catch (e) {
        return Promise.reject();
    }
}


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
        const rawObj = await get_raw_object(word, {from:sourceLang, to:destLang})

        trObj["translation"] = getNested(rawObj, [1, 0, 0, 5, 0, 0])// rawObj[1][0][0][5][0][0];
        trObj["wordTranscription"] = getNested(rawObj,[0,0]);
        trObj["translationTranscription"] = getNested(rawObj,[1, 0, 0, 1]);
        setDetailedTranslations(rawObj, trObj, dataOptions);
        // setSynonyms(rawObj, trObj, dataOptions);
        setDefinitions(rawObj, trObj, dataOptions);
        setExamples(rawObj, trObj, dataOptions);
        // setCollocations(rawObj, trObj, dataOptions);

    } catch (e) {
        throw e
        // let message = e.name;
        // if (e.statusCode === 403)
        //     message = 'Authorization failed. The token may be invalid, so please check, if there is a new version of this module.'
        // throw {
        //     message,
        //     statusCode: e.statusCode
        // };
    }
    return trObj;
}

let setDetailedTranslations = (rawObj, destObj, dataOptions)=> {
    if (dataOptions.detailedTranslations) {
        destObj[["translations"]] = {};
        translationPart = getNested(rawObj, [3,5,0])
        if (translationPart) {
            translationPart.forEach(translation => {
                let wordType = translation[0];
                destObj["translations"][wordType] = translation[1].map(details => {
                    if (dataOptions.detailedTranslationsSynonyms)
                        return {
                            translation: details[0],
                            synonyms: details[2],
                            frequency: details[3]
                        };
                    return details[0];
                });
            });
        }
    }

}

let setSynonyms = (rawObj, destObj, dataOptions) => {
    if (!dataOptions.synonyms) {
        return
    }
    destObj["synonyms"] = {};
    synonimsPart = rawObj[3][1][0]
    if (dataOptions.synonyms && rawObj[11]) {
        synonimsPart.forEach((synonymDetailes) => {
            let synonymsObj = destObj["synonyms"];
            synonymsObj[synonymDetailes[0]] = synonymDetailes[1].map(synomyns => synomyns[0]);
        })
    }
};

let setDefinitions = (rawObj, destObj, dataOptions) => {
    destObj["definitions"] = {};
    if (!dataOptions.definitions) {
        return
    }
    definitionsPart = getNested(rawObj,[3, 1, 0])
    if (definitionsPart) {
        definitionsPart.forEach((definitionDetails) => {
            if (definitionDetails.length < 2)
                return
            destObj["definitions"][definitionDetails[0]] = definitionDetails[1].map((defElem) => {
                if (defElem.length == 0)
                    return

                if (dataOptions.definitionExamples || dataOptions.synonyms) {
                    result = {definition: defElem[0]}
                    if (dataOptions.definitionExamples) {
                        if (defElem.length >= 2 && defElem[1])
                            result.example = defElem[1]
                    }
                    if (dataOptions.synonyms) {
                        if (defElem.length >= 6 && defElem[5]) {
                            result.synonyms = {}
                            synomynsPart = defElem[5]
                            synomynsPart.forEach((synObj)=> {
                                if (synObj.length == 0)
                                    return
                                synonyms = synObj[0].map((syn)=>syn[0])
                                synonymsTag = "normal"
                                if (synObj.length > 1)
                                    synonymsTag = synObj[1]
                                result.synonyms[synonymsTag] = synonyms
                            })
                        }
                    }
                    return result
                } else 
                    return defElem[0];
            });
        })
    }
};

let setExamples = (rawObj, destObj, dataOptions) => {
    destObj["examples"] = [];
    if (!dataOptions.examples)
        return
    examplesPart = getNested(rawObj,[3,2])
    if (examplesPart) {
        destObj["examples"] = examplesPart[0].map(element => {
            if (dataOptions.removeStyles) {
                return element[1].replace('<b>','').replace('</b>', '');
            }
            return element[1]}
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
