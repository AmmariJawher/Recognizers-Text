import { BaseNumberExtractor, RegExpValue, RegExpRegExp, BasePercentageExtractor } from "../extractors";
import { Constants } from "../constants";
import { NumberMode, LongFormatType } from "../models";
import { ArabicNumeric } from "../../resources/ArabicNumeric";
import { BaseNumbers } from "../../resources/baseNumbers";
import { RegExpUtility } from "@microsoft/recognizers-text";

export class ArabicNumberExtractor extends BaseNumberExtractor {
    protected extractType: string = Constants.SYS_NUM;
    protected negativeNumberTermsRegex: RegExp;

    constructor(mode: NumberMode = NumberMode.Default) {
        super();

        this.negativeNumberTermsRegex = RegExpUtility.getSafeRegExp(ArabicNumeric.NegativeNumberTermsRegex + "$", "is");

        let regexes = new Array<RegExpValue>();

        // Add Cardinal
        let cardExtract: ArabicCardinalExtractor | null = null;
        switch (mode) {
            case NumberMode.PureNumber:
                cardExtract = new ArabicCardinalExtractor(ArabicNumeric.PlaceHolderPureNumber);
                break;
            case NumberMode.Currency:
                regexes.push({ regExp: RegExpUtility.getSafeRegExp(BaseNumbers.CurrencyRegex, "gs"), value: "IntegerNum" });
                break;
            case NumberMode.Default:
                break;
        }

        if (cardExtract === null) {
            cardExtract = new ArabicCardinalExtractor();
        }

        cardExtract.regexes.forEach(r => regexes.push(r));

        // Add Fraction
        let fracExtract = new ArabicFractionExtractor(mode);
        fracExtract.regexes.forEach(r => regexes.push(r));

        this.regexes = regexes;

        // Add filter
        let ambiguityFiltersDict = new Array<RegExpRegExp>();

        if (mode != NumberMode.Unit) {
            for (let [ key, value ] of ArabicNumeric.AmbiguityFiltersDict){
                ambiguityFiltersDict.push({ regExpKey: RegExpUtility.getSafeRegExp(key, "gs"), regExpValue: RegExpUtility.getSafeRegExp(value, "gs")})
            }

        }

        this.ambiguityFiltersDict = ambiguityFiltersDict;
    }
}

// TODO: Enhance This
export class ArabicCardinalExtractor extends BaseNumberExtractor {
    protected extractType: string = Constants.SYS_NUM_CARDINAL;

    constructor(placeholder: string = ArabicNumeric.PlaceHolderDefault) {
        super();
        let regexes = new Array<RegExpValue>();

        // Add Integer Regexes
        let intExtract = new ArabicIntegerExtractor(placeholder);
        intExtract.regexes.forEach(r => regexes.push(r));

        // Add Double Regexes
        let doubleExtract = new ArabicDoubleExtractor(placeholder);
        doubleExtract.regexes.forEach(r => regexes.push(r));

        this.regexes = regexes;
    }
}

// TODO: Enhance This
export class ArabicIntegerExtractor extends BaseNumberExtractor {
    protected extractType: string = Constants.SYS_NUM_INTEGER;

    constructor(placeholder: string = ArabicNumeric.PlaceHolderDefault) {
        super();

        let regexes = new Array<RegExpValue>(
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.NumbersWithPlaceHolder(placeholder), "gi"),
                value: "IntegerNum"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.NumbersWithSuffix, "gs"),
                value: "IntegerNum"
            },
            {
                regExp: this.generateLongFormatNumberRegexes(LongFormatType.integerNumComma, placeholder),
                value: "IntegerNum"
            },
            {
                regExp: this.generateLongFormatNumberRegexes(LongFormatType.integerNumBlank, placeholder),
                value: "IntegerNum"
            },
            {
                regExp: this.generateLongFormatNumberRegexes(LongFormatType.integerNumNoBreakSpace, placeholder),
                value: "IntegerNum"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.RoundNumberIntegerRegexWithLocks, "gis"),
                value: "IntegerNum"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.NumbersWithDozenSuffix, "gis"),
                value: "IntegerNum"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.AllIntRegexWithLocks, "gis"),
                value: "IntegerEng"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.AllIntRegexWithDozenSuffixLocks, "gis"),
                value: "IntegerEng"
            }
        );

        this.regexes = regexes;
    }
}

//  TODO: Enhance This
export class ArabicDoubleExtractor extends BaseNumberExtractor {
    protected extractType: string = Constants.SYS_NUM_DOUBLE;

    constructor(placeholder: string = ArabicNumeric.PlaceHolderDefault) {
        super();

        let regexes = new Array<RegExpValue>(
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.DoubleDecimalPointRegex(placeholder), "gis"),
                value: "DoubleNum"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.DoubleWithoutIntegralRegex(placeholder), "gis"),
                value: "DoubleNum"
            },
            {
                regExp: this.generateLongFormatNumberRegexes(LongFormatType.doubleNumCommaDot, placeholder),
                value: "DoubleNum"
            },
            {
                regExp: this.generateLongFormatNumberRegexes(LongFormatType.doubleNumNoBreakSpaceDot, placeholder),
                value: "DoubleNum"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.DoubleWithMultiplierRegex, "gs"),
                value: "DoubleNum"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.DoubleWithRoundNumber, "gis"),
                value: "DoubleNum"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.DoubleAllFloatRegex, "gis"),
                value: "DoubleEng"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.DoubleExponentialNotationRegex, "gis"),
                value: "DoublePow"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.DoubleCaretExponentialNotationRegex, "gis"),
                value: "DoublePow"
            }
        );

        this.regexes = regexes;
    }
}

//  TODO: Enhance this part
export class ArabicFractionExtractor extends BaseNumberExtractor {

    protected extractType: string = Constants.SYS_NUM_FRACTION;

    constructor(mode: NumberMode = NumberMode.Default) {
        super();

        let regexes = new Array<RegExpValue>(
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.FractionNotationWithSpacesRegex, "gis"),
                value: "FracNum"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.FractionNotationRegex, "gis"),
                value: "FracNum"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.FractionNounRegex, "gis"),
                value: "FracArb"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.FractionNounWithArticleRegex, "gis"),
                value: "FracArb"
            }
        );

        // Not add FractionPrepositionRegex when the mode is Unit to avoid wrong recognize cases like "$1000 over 3"
        if (mode != NumberMode.Unit) {
            regexes.push({
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.FractionPrepositionRegex, "gis"),
                value: "FracEng"
            });
        };

        this.regexes = regexes;
    }
}

export class ArabicOrdinalExtractor extends BaseNumberExtractor {
    protected extractType: string = Constants.SYS_NUM_ORDINAL;

    constructor() {
        super();
        let regexes = new Array<RegExpValue>(
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.OrdinalNumericRegex, "gis"),
                value: "OrdinalArb"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.OrdinalArabicRegex, "gis"),
                value: "OrdinalArb"
            },
            {
                regExp: RegExpUtility.getSafeRegExp(ArabicNumeric.OrdinalRoundNumberRegex, "gis"),
                value: "OrdinalArb"
            }
        );

        this.regexes = regexes;
    }
}

export class ArabicPercentageExtractor extends BasePercentageExtractor {
    constructor() {
        super(new ArabicNumberExtractor());
    }

    protected initRegexes(): RegExp[] {
        let regexStrs = [
            ArabicNumeric.NumberWithSuffixPercentage,
            ArabicNumeric.NumberWithPrefixPercentage
        ];

        return this.buildRegexes(regexStrs);
    }
}

