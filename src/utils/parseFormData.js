const parseFormData = (data) => {
    // Recursive function to handle nested structures
    const parseValue = (value) => {
        if (Array.isArray(value)) {
            // If value is an array, recursively parse each item
            return value.map(item => parseValue(item));
        } else if (typeof value === 'object' && value !== null) {
            // If value is an object, recursively parse its keys and values
            return parseFormData(value); // Recurse for nested objects
        } else if (typeof value === 'string') {
            // If value is a string, try parsing it as JSON or an array
            try {
                // Attempt to parse as JSON
                return JSON.parse(value);
            } catch (e) {
                // If parsing fails, return the string as is
                return value;
            }
        } else {
            // If value is not an object or string, return it as is
            return value;
        }
    };

    // Create a new object with parsed values
    const parsedData = {};
    for (const [key, value] of Object.entries(data)) {
        parsedData[key] = parseValue(value);
    }

    return parsedData;
};

module.exports = parseFormData;
