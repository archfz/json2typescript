import { MappingOptions, Settings } from "./json-convert-options";
import { Any } from "./any";

/**
 * Decorator of a class that is a custom converter.
 *
 * @param target the class
 */
export function JsonConverter(target: any) {
    target[Settings.MAPPER_PROPERTY] = "";
}

/**
 * Decorator of a class that comes from a JSON object.
 *
 * @param name The target class or the name of the class.
 */
export function JsonObject(name: any | string): any {
    const decorator = function (target: any) {
        target[Settings.MAPPING_PROPERTY] = [];
        target[Settings.CLASS_NAME_PROPERTY] = name;

        const mapping = target.prototype[Settings.MAPPING_PROPERTY];
        if (!mapping) {
            return;
        }

        let unmappedKeys = Object.keys(mapping)
            .filter((val) => val.indexOf("[[UNMAPPED]].") === 0);

        for (let key of unmappedKeys) {
            mapping[key.replace("[[UNMAPPED]]", name)] =
                mapping[key];

            delete mapping[key];
        }

        target.prototype[Settings.MAPPING_PROPERTY] = mapping;
    };

    // We allow default mode and declarative class names. In case
    // we have string we add that as name, in case only the target
    // then we default to constructor name.
    if (typeof name !== "string") {
        const target = name;
        name = name.name;
        decorator(target);
        return;
    }

    return decorator;
}

/**
 * Decorator of a class property that comes from a JSON object.
 *
 * The second param can be either a type or a class of a custom converter.
 *
 * Use the following notation for the type:
 * - Primitive type: String|Number|Boolean
 * - Custom type: YourClassName
 * - Array type: [String|Number|Boolean|YourClassName]
 *
 * If you decide to use a custom converter, make sure this class implements the interface JsonCustomConvert from this package.
 *
 * @param jsonPropertyName optional param (default: classPropertyName) the property name in the expected JSON object
 * @param conversionOption optional param (default: Any), should be either the expected type (String|Boolean|Number|etc) or a custom converter class implementing JsonCustomConvert
 * @param isOptional optional param (default: false), if true, the json property does not have to be present in the object
 *
 * @returns {(target:any, key:string)=>void}
 */
export function JsonProperty(...params: any[]): any {

    return function (target: any, classPropertyName: string): void {

        let jsonPropertyName: string = classPropertyName;
        let conversionOption: any = Any;
        let isOptional: boolean = false;

        switch (params.length) {
            case 0:
                break;
            case 1:
                jsonPropertyName = params[0];
                break;
            case 2:
                if (params[1] === undefined) throw new Error(
                    "Fatal error in JsonConvert. " +
                    "It's not allowed to explicitely pass \"undefined\" as second parameter in the @JsonProperty decorator.\n\n" +
                    "\tClass name: \n\t\t" + target.constructor.name + "\n\n" +
                    "\tClass property: \n\t\t" + classPropertyName + "\n\n" +
                    "Use \"Any\" to allow any type. You can import this class from \"json2typescript\".\n\n"
                );
                jsonPropertyName = params[0];
                conversionOption = params[1];
                break;
            case 3:
                jsonPropertyName = params[0];
                conversionOption = params[1];
                isOptional = params[2];
                break;
            default:
                break;
        }


        if (typeof(target[Settings.MAPPING_PROPERTY]) === "undefined") {
            target[Settings.MAPPING_PROPERTY] = [];
        }

        // We set it unmapped, so that the json object decorator can
        // actually set the desired on default class name.
        const className = '[[UNMAPPED]]';

        if (typeof(jsonPropertyName) === "undefined") {
            jsonPropertyName = classPropertyName;
        }


        let jsonPropertyMappingOptions = new MappingOptions();
        jsonPropertyMappingOptions.classPropertyName = classPropertyName;
        jsonPropertyMappingOptions.jsonPropertyName = jsonPropertyName;
        jsonPropertyMappingOptions.isOptional = isOptional ? isOptional : false;

        // Check if conversionOption is a type or a custom converter.
        if (typeof(conversionOption) !== "undefined" && conversionOption !== null && typeof(conversionOption[Settings.MAPPER_PROPERTY]) !== "undefined") {
            jsonPropertyMappingOptions.customConverter = new conversionOption();
        } else {
            jsonPropertyMappingOptions.expectedJsonType = conversionOption;
        }

        // Save the mapping info
        target[Settings.MAPPING_PROPERTY][className + "." + classPropertyName] = jsonPropertyMappingOptions;

    }

}
