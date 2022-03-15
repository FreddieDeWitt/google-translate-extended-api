# google-translate-extended-api

Free Extended Google Translate API - get word definitions, examples, synonyms and a lot more

# Updates

- Using code from @vitalets/google-translate-api, as the request to Google Translate and the responce changed.
- Change the available settings options, as the response from Google Translate has changed - `collocations` are not available anymore, and `synonyms` are changed to `definitionSynonyms` and they are stored inside the definitions (see the API for new [Fields](#fields))

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage examples](#usage-examples)
- [API](#api)
  - [translate(text, sourceLang, destLang, dataOptions)](#translatetext-sourcelang-destlang-dataoptions)
    - [Arguments](#arguments)
    - [Response](#response)
  - [dataOptions Object](#dataoptions-object)
    - [Fields](#fields)
    - [Defaults](#defaults)
  - [Response Object](#response-object)
- [Contacts](#contacts)

## Features

- Fast and efficient - each request consumes about 1.5 Kb

- Rich word information - definitions, examples, synonyms, collocations and multiple translations

- Uses the same request that translate.google.com do

## Installation

```npm i google-translate-extended-api```

## Usage examples

The first argument is query (it can be a single word or a sentence).  
The second argument is a source language of query, third - desired translation language.  
The fourth is optional - it is [`dataOptions`](#dataoptions-object) object.  

``` js

const translate = require('extended-google-translate-api');

translate("parlous", "en", "de").then((res) => {
    console.log(JSON.stringify(res, undefined, 2));
}).catch(console.log);

```


Result is:

``` json

{
  "word": "parlous",
  "translation": "parlous",
  "wordTranscription": "ˈpärləs",
  "translationTranscription": null,
  "translations": {
    "adjective": [
      "gefährlich",
      "schlimm"
    ]
  },
  "definitions": {
    "adjective": [
      "full of danger or uncertainty; precarious."
    ],
    "adverb": [
      "greatly or excessively."
    ]
  },
  "examples": [
    "And how do you sap the energy of the insurgency when the parlous state of the economy keeps everyone desperately poor?",
    "Finally, I want to talk quite seriously about the parlous state of politics in this House.",
    "Is the state of American political fiction really so parlous perilous?"
  ]
}

```
The list of all available languages is available [here](https://github.com/FreddieDeWitt/extended-google-translate-api/blob/master/languages.js). Use 'auto' as a source language to use Google's language detection.


Or you can disable examples using [`dataOptions`](#dataoptions-object) object:

``` js

translate("dog", "en", "de", {examples: false}).then((res) => {
    console.log(JSON.stringify(res, undefined, 2));
}).catch(console.log);

```


Which yields:

``` json

{
  "word": "dog",
  "translation": "Hund",
  "wordTranscription": "dôg",
  "translationTranscription": null,
  "translations": {
    "noun": [
      "Hund",
      "Rüde",
      "Pleite"
    ]
  },
  "definitions": {
    "noun": [
      "a domesticated carnivorous mammal that typically has a long snout, an acute sense of smell, and a barking, howling, or whining voice. It is widely kept as a pet or for work or field sports.",
      "a person regarded as unpleasant, contemptible, or wicked (used as a term of abuse)."
    ],
    "verb": [
      "follow (someone or their movements) closely and persistently.",
      "act lazily; fail to try one's hardest."
    ]
  }
}

```

## API


### translate(text, sourceLang, destLang, dataOptions)

#### Arguments

- `text`: `String` - text to be translated (if you want to get detailed translations and definitions it usually should be a single word)  
- `sourceLang`, `destLang`: `String` - ISO code of source and desired languages of your text. Full list is [here](https://github.com/FreddieDeWitt/extended-google-translate-api/blob/master/languages.js).  
- `dataOptions`: `Object` - see [here](#dataoptions-object). If you pass wrong fields to the dataOptions object, the program generates a warning.

#### Response

returns Promise that:
- resolves with `Response Object` (Take a look at [`Response Object`](#response-object))  
- or rejects with Error (when request to translate.google.com failed) that have the following properties:
  - message - an Error message
  - statusCode - status code of the bad request


### dataOptions Object

#### Fields

- `returnRawResponse`: Boolean - if this flag is chosen, then the [Result Object](#result-object) will be the raw data from request to translate.google.com.
- `detailedTranslations`: Boolean
- `definitionSynonyms`: Boolean - synonyms that are available for each of the definitions. Set this field to true if you want to get them.
- `detailedTranslationsSynonyms`: Boolean - almost each detailed translation contains synonyms.  Set this field to true if you want to get them.
- `definitions`: Boolean
- `definitionExamples`: Boolean - almost each definition contains example(s). Set this field to true if you want to get them.
- `examples`: Boolean
- `removeStyles`: Boolean - google translate returns the word examples with the word surrounded by `<b>`, `</b>`. Setting `removeStyles` to true removes all HTML styles from the examples.

#### Defaults

``` javascript

defaultDataOptions = {
    returnRawResponse: false,
    detailedTranslations: true,
    definitionSynonyms: false,
    detailedTranslationsSynonyms: false,
    definitions: true,
    definitionExamples: false,
    examples: true,
    removeStyles: true
}
```

You can always change defaults like this:  

``` javascript

const translate = require('extended-google-translate-api');
translate.defaultDataOptions.definitions = true;

```

### Response Object

if (`dataOptions.returnRawResponse === true`) then the result will be the raw data from request to translate.google.com.

Otherwise:

This object always contains the following fields:
- `word`: String - the word itself
- `translation`: String - Google Translate primary translation
- `wordTranscription`: String - the transcription of the word
- `translationTranscription`: String - the transcription of the main translation

Availability of other fields depends on [`dataOptions` Object](#dataoptions-object), the third argument of `translate` function

- `dataOption.detailedTranslations === true`  

  **Field**: `translations`: Object  
  The keys of this object are word types (e.g. `noun`, `verb` etc.).  
  Each key contains an array of translations (`String`) or if `dataOption.detailedTranslationsSynonyms === true` - an array of the following Objects  
  - `translation`: String
  - `synonyms`: [String]
  - `frequency`: Number - the frequency of this translation (1, 2, 3). 1 means the most frequently, 3 - the least frequent words.

  **Examples:** (some results was omitted for the sake of simplicity)  
  - `dataOption.detailedTranslationsSynonyms === false`  

  ``` json

  "translations": {
      "noun": [
        "Hund",
        "Rüde",
      ]

  ```

  - `dataOption.detailedTranslationsSynonyms === true`  

  ``` json

  "translations": {
      "noun": [
        {
          "translation": "Hund",
          "synonyms": [
            "dog",
            "hound"
          ],
          "frequency": 1
        },
        {
          "translation": "Rüde",
          "synonyms": [
            "male",
            "dog"
          ],
          "frequency": 3
        }
      ]
    }

  ```

- `dataObject.definitions === true`  
  **Field:** `definitions`: Object  
  The keys of this object are word types (e.g. `noun`, `verb` etc.).  
  Each key contains an array of definitions (`String`) or if `dataOptions.definitionExamples === true` - an array of the following objects:  
  - `definition`: String
  - `example`: String  
  Setting `dataOptions.definitionExamples === true` also adds the `synonyms` field to the object.
  `synonyms` field is an object, the keys of which denote the type of the synonyms. The regular ones are stored under the key `normal`, some other possible tags are for instance `informal`, `formal`. The synonyms of each type are store in a string array.
  **Examples:**  
  - `dataOptions.definitionExamples === true`

  ``` json

  "definitions": {
    "noun": [
      "a domesticated carnivorous mammal that typically has a long snout, an acute sense of smell, and a barking, howling, or whining voice. It is widely kept as a pet or for work or field sports.",
      "a person regarded as unpleasant, contemptible, or wicked (used as a term of abuse).",
    ],
    "verb": [
      "follow (someone or their movements) closely and persistently.",
      "act lazily; fail to try one's hardest.",
    ]
  }

  ```
  - `dataOptions.definitionExamples === false`  

  ``` json

  "definitions": {
    "noun": [
      {
        "definition": "a domesticated carnivorous mammal that typically has a long snout, an acute sense of smell, and a barking, howling, or whining voice. It is widely kept as a pet or for work or field sports.",
        "example": "Shouts mingle with the barking and howling of dogs ."
      },
      {
        "definition": "a person regarded as unpleasant, contemptible, or wicked (used as a term of abuse).",
        "example": "come out, Michael, you dog!"
      }
    ],
    "verb": [
      {
        "definition": "follow (someone or their movements) closely and persistently.",
        "example": "photographers seemed to dog her every step"
      },
      {
        "definition": "act lazily; fail to try one's hardest.",
        "example": "He entered the season with a reputation for dogging it when he wasn't the primary receiver."
      }
    ]
  }

  ```
`dataOptions.definitionSynonyms === true`
  ``` json
  "definitions": {
    "noun": [
      {
        "definition": "a domesticated carnivorous mammal that typically has a long snout, an acute sense of smell, nonretractable claws, and a barking, howling, or whining voice.",
        "synonyms": {
          "normal": [
            "canine",
            "hound"
          ],
          "informal": [
            "doggy",
            "pooch",
            "mutt"
          ]
        }
      },
      {
        "definition": "a mechanical device for gripping."
      },
      {
        "definition": "short for firedog."
      }
    ],
    "verb": [
      {
        "definition": "follow (someone or their movements) closely and persistently.",
        "example": "photographers seemed to dog her every step",
        "synonyms": {
          "normal": [
            "pursue",
            "follow",
            "stalk",
            "track",
            "haunt"
          ],
          "informal": [
            "tail"
          ]
        }
      }
    ]
  }
  ```
- `dataOptions.examples === true`  
  **Field:** `examples`: [String]  
  The array contains all examples for the word.  
  if `dataOptions.removeStyles === false` then the word will be surrounded by `<b>`, `<\b>`  
  **Examples:**  
  - `dataOptions.removeStyles === true`

  ``` json

  "examples": [
    "One of the great mysteries of Australian political life is why a man who is about to dump a dog of a tax system on an unsuspecting public should appear so smug?",
    "In order to get him to commit you have to treat him like a dog .",
    "It is a dog of a day, relentless rain and biting cold fraying the nerve ends of men who like to be in perpetual motion.",
    "During the Second World War, he treated Sinclair like a dog .",
    "a dog fox"
  ]

  ```

  - `dataOptions.removeStyles === false`  

  ``` json

    "examples": [
        "One of the great mysteries of Australian political life is why a man who is about to dump a <b>dog</b> of a tax system on an unsuspecting public should appear so smug?",
        "In order to get him to commit you have to treat him like a <b>dog</b> .",
        "It is a <b>dog</b> of a day, relentless rain and biting cold fraying the nerve ends of men who like to be in perpetual motion.",
        "During the Second World War, he treated Sinclair like a <b>dog</b> .",
        "a <b>dog</b> fox"
    ]

  ```
  
## Contacts

If you see a mistake in README, have a question or encountered a problem - please open an issue [here](https://github.com/FreddieDeWitt/extended-google-translate-api/issues) or write me at freddie.dewitt@yandex.com