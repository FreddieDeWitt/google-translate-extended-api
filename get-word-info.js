const querystring = require('querystring');

const got = require('got');
const languages = require('./languages');
const wordTypes = require('./word_types');

// safely get access to a nested element of object o
// return null if some property doesn't exist at any level
const getNested = (o, p) =>
    p.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

// pos_enum is Google's internal, language-independent POS id; pos is a
// human-readable label that may not be stable/English for every source
// language, so prefer the enum and only fall back to the raw string
const getWordType = (entry) => {
    const type =
        typeof entry.pos_enum === 'number'
            ? wordTypes.get_type(entry.pos_enum)
            : null;
    if (type && type !== 'General') return type.toLowerCase();
    return (entry.pos || 'generic').toLowerCase();
};

const defaultDataOptions = {
    returnRawResponse: false,
    detailedTranslations: true,
    definitionSynonyms: false,
    detailedTranslationsSynonyms: false,
    definitions: true,
    definitionExamples: false,
    examples: true,
    removeStyles: true,
    articles: 'combine', // 'none' | 'combine' | 'separate'
};

// entry.previous_word can be anything from "der"/"le" to an elided "l'",
// so we can't always join with a space; if it doesn't end in a letter
// (e.g. an apostrophe) we merge directly, otherwise we add a space
const combineWithArticle = (word, previousWord) => {
    if (!previousWord) return word;
    const lastChar = previousWord[previousWord.length - 1];
    const separator = /\p{L}/u.test(lastChar) ? ' ' : '';
    return previousWord + separator + word;
};

// function that sends a request to google translate service and return
// a translation object
async function get_raw_object(text, opts, gotopts) {
    opts = opts || {};
    gotopts = gotopts || {};
    gotopts.headers = {};
    let e;
    [opts.from, opts.to].forEach(function (lang) {
        if (lang && !languages.isSupported(lang)) {
            e = new Error();
            e.code = 400;
            e.message = "The language '" + lang + "' is not supported";
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

    const data = {
        client: 'gtx',
        sl: opts.from,
        tl: opts.to,
        dj: 1,
        q: text,
        dt: ['t', 'at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss'],
    };
    const url =
        'https://translate.google.' +
        opts.tld +
        '/translate_a/single?' +
        querystring.stringify(data);

    const res = await got(url, gotopts);

    try {
        return JSON.parse(res.body);
    } catch {
        return Promise.reject();
    }
}

const getInfo = async (word, sourceLang, destLang, dataOptions) => {
    const trObj = {
        word,
    };
    if (!languages.isSupported(sourceLang)) {
        throw `Language '${sourceLang} ' is not supported`;
    }
    if (!languages.isSupported(destLang)) {
        throw `Language '${destLang}' is not supported`;
    }
    if (dataOptions == null) dataOptions = {};
    Object.keys(dataOptions).forEach((key) => {
        if (defaultDataOptions[key] == null) {
            console.log(`Warning! DataOptions field "${key}" is not supported`);
        }
    });
    Object.keys(defaultDataOptions).forEach((key) => {
        if (dataOptions[key] == null)
            dataOptions[key] = defaultDataOptions[key];
    });

    try {
        const rawObj = await get_raw_object(word, {
            from: sourceLang,
            to: destLang,
        });

        if (dataOptions.returnRawResponse) return rawObj;

        const sentences = rawObj.sentences || [];
        const transSentence = sentences.find((s) => s.trans);
        const translitSentence = sentences.find((s) => s.src_translit);

        trObj['translation'] = transSentence?.trans ?? null;
        trObj['detectedSourceLang'] = rawObj.src ?? null;
        trObj['wordTranscription'] = translitSentence?.src_translit ?? null;
        trObj['translationTranscription'] = translitSentence?.translit ?? null;
        setDetailedTranslations(rawObj, trObj, dataOptions);
        setDefinitions(rawObj, trObj, dataOptions);
        setExamples(rawObj, trObj, dataOptions);
    } catch (e) {
        // throw e
        let message = e.name;
        if (e.statusCode === 403)
            message =
                'Request failed. Please check if there is a new version of this module.';
        throw {
            message,
            statusCode: e.statusCode,
        };
    }
    return trObj;
};

const setDetailedTranslations = (rawObj, destObj, dataOptions) => {
    if (dataOptions.detailedTranslations) {
        destObj['translations'] = {};
        const dictPart = rawObj.dict;
        if (dictPart) {
            dictPart.forEach((translation) => {
                const wordType = getWordType(translation);
                destObj['translations'][wordType] = (
                    translation.entry || []
                ).map((entry) => {
                    const word =
                        dataOptions.articles === 'combine'
                            ? combineWithArticle(
                                  entry.word,
                                  entry.previous_word,
                              )
                            : entry.word;

                    const needsObject =
                        dataOptions.detailedTranslationsSynonyms ||
                        dataOptions.articles === 'separate';
                    if (!needsObject) return word;

                    const result = { translation: word };
                    if (dataOptions.detailedTranslationsSynonyms) {
                        result.synonyms = entry.reverse_translation;
                        result.frequency = entry.score;
                    }
                    if (dataOptions.articles === 'separate')
                        result.article = entry.previous_word || null;
                    return result;
                });
            });
        }
    }
};

const setDefinitions = (rawObj, destObj, dataOptions) => {
    destObj['definitions'] = {};
    if (!dataOptions.definitions) {
        return;
    }
    const definitionsPart = rawObj.definitions;
    if (definitionsPart) {
        const synonymsById = {};
        // weirdly, the examples (separate part of the request)
        // are also connected to the definitions, and they are not always the same
        // as what's given with the definition, so these are places into moreExamples
        const examplesById = {};
        if (dataOptions.definitionExamples) {
            const examplesPart = getNested(rawObj, ['examples', 'example']);
            (examplesPart || []).forEach((example) => {
                if (!example.definition_id) return;
                const text = dataOptions.removeStyles
                    ? example.text.replace('<b>', '').replace('</b>', '')
                    : example.text;
                examplesById[example.definition_id] = (
                    examplesById[example.definition_id] || []
                ).concat(text);
            });
        }
        if (dataOptions.definitionSynonyms && rawObj.synsets) {
            rawObj.synsets.forEach((synset) => {
                (synset.entry || []).forEach((synEntry) => {
                    if (!synEntry.synonym || !synEntry.synonym.length) return;
                    let tag = 'normal';
                    if (synEntry.label_info && synEntry.label_info.register)
                        tag = synEntry.label_info.register.join(', ');
                    const byId = (synonymsById[synEntry.definition_id] =
                        synonymsById[synEntry.definition_id] || {});
                    byId[tag] = (byId[tag] || []).concat(synEntry.synonym);
                });
            });
        }

        definitionsPart.forEach((definitionDetails) => {
            if (
                !definitionDetails.entry ||
                definitionDetails.entry.length === 0
            )
                return;
            const wordType = getWordType(definitionDetails);

            destObj['definitions'][wordType] = definitionDetails.entry.map(
                (defElem) => {
                    if (
                        dataOptions.definitionExamples ||
                        dataOptions.definitionSynonyms
                    ) {
                        const result = { definition: defElem.gloss };
                        if (dataOptions.definitionExamples) {
                            if (defElem.example)
                                result.example = defElem.example;
                            const moreExamples =
                                examplesById[defElem.definition_id];
                            if (moreExamples)
                                result.moreExamples = moreExamples;
                        }
                        if (dataOptions.definitionSynonyms) {
                            if (synonymsById[defElem.definition_id])
                                result.synonyms =
                                    synonymsById[defElem.definition_id];
                        }
                        return result;
                    } else return defElem.gloss;
                },
            );
        });
    }
};

const setExamples = (rawObj, destObj, dataOptions) => {
    destObj['examples'] = [];
    if (!dataOptions.examples) return;
    const examplesPart = getNested(rawObj, ['examples', 'example']);
    if (examplesPart) {
        destObj['examples'] = examplesPart.map((element) => {
            if (dataOptions.removeStyles) {
                return element.text.replace('<b>', '').replace('</b>', '');
            }
            return element.text;
        });
    }
};

module.exports = getInfo;
module.exports.languages = languages;
module.exports.defaultDataOptions = defaultDataOptions;
