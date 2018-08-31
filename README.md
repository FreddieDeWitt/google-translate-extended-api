# extended-google-translate-api

Free Google Translate API - get word definitions, examples, synonyms and a lot more

## Features

- Fast and efficient - each request consumes about 1.5 Kb

- Rich word information - definitions, examples, synonyms, collocations and multiple translations

- Uses the same request that translate.google.com do

## Installation

```npm i extended-google-translate-api```

## Usage examples

The first argument is query (it can be a single word or a sentence).  
The second argument is a source language of query, third - desired translation language.  
The fourth is optional - it is `dataOptions` object.  

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
  ],
  "collocations": []
}

```
The list of all available languages is available [here](https://github.com/FreddieDeWitt/extended-google-translate-api/blob/master/languages.js).


Or you can disable collocations and examples using `dataOptions` object:

``` js

translate("dog", "en", "de", {examples: false, collocations: false}).then((res) => {
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


### `translate(text, sourceLang, destLang, dataOptions)`

#### Arguments

- `text`: `String` - text to be translated (if you want to get detailed translations and definitions it usually should be a single word)  
- `sourceLang`, `destLang`: `String` - ISO code of source and desired languages of your text. Full list is [here](https://github.com/FreddieDeWitt/extended-google-translate-api/blob/master/languages.js).  
- `dataOptions`: `Object` - see [here](#dataoptions-object). If you pass wrong fields to the dataOptions object, the program generates a warning.

#### Response

See [`Response Object`](#response-object)

### dataOptions Object

#### Fields

- `detailedTranslations`: Boolean
- `synonims`: Boolean
- `detailedTranslationsSynonims`: Boolean - almost each detailed translation contains synonyms.  Set this field to true if you want to get them.
- `definitions`: Boolean
- `definitionExamples`: Boolean - almost each definition contains example(s). Set this field to true if you want to get them.
- `examples`: Boolean
- `collocations`: Boolean
- `removeStyles`: Boolean - google translate returns the word examples with the word surrounded by `<b>`, `</b>`. Setting `removeStyles` to true removes all HTML styles from the examples.

#### Defaults

``` javascript

defaultDataOptions = {
    detailedTranslations: true,
    synonyms: false,
    detailedTranslationsSynonyms: false,
    definitions: true,
    definitionExamples: false,
    examples: true,
    collocations: true,
    removeStyles: true
}

```

You can always change defaults like this:  

``` javascript

const translate = require('extended-google-translate-api');
translate.defaultDataOptions.synonyms = true;

```

### Response Object

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
  - `synonims`: [String]
  - `frequency`: Number - the frequency of this translation  

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
          "frequency": 0.51075
        },
        {
          "translation": "Rüde",
          "synonyms": [
            "male",
            "dog"
          ],
          "frequency": 0.0017576985
        }
      ]
    }

  ```

- `dataObject.synonyms === true`  
  **Field:** `synonyms`: Object  
  The keys of this object are word types (e.g. `noun`, `verb` etc.).  
  Each key contains an array of arrays with `String`  
  **Examples:**  

  ``` json

  "synonyms": {
    "noun": [
      [
        "hound",
        "canine",
        "mongrel",
        "mutt",
      ],
      [
        "hot dog",
        "hotdog",
      ]
    ]
  }

  ```

- `dataObject.definitions === true`  
  **Field:** `definitions`: Object  
  The keys of this object are word types (e.g. `noun`, `verb` etc.).  
  Each key contains an array of definitions (`String`) or if `dataOptions.definitionExamples === true` - an array of the following objects:  
  - `definition`: String
  - `example`: String  
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

- `dataOptions.collocations === true`  
  **Field:** `collocations`: [String]  
  The array contains all collocations for this word. 
  **Example:**  
  
  ``` json

  "collocations": [
    "hot dog",
    "dog food",
    "dog leash"
  ]

  ```
  
