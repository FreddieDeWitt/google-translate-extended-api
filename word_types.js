let word_types = ["Noun",
    "Verb",
    "Adjective",
    "Adverb",
    "Preposition",
    "Abbreviation",
    "Conjunction",
    "Pronoun",
    "Interjection",
    "Phrase",
    "Prefix",
    "Suffix",
    "Article",
    "Combining form",
    "Numeral",
    "Auxiliary verb",
    "Exclamation",
    "Plural",
    "Particle"]

function get_type(type_number) {
    if (type_number < 1 || type_number > 19) {
        return "General";
    }
    return word_types[type_number - 1];
}
module.exports.get_type = get_type
module.exports.word_types = word_types