const tickerAndOptionsIterator = (data, converterFunction) => {
    // Handle arrays by applying the converter function
    if (Array.isArray(data)) {
        return converterFunction(data);
    }
    
    // Handle non-object or null values
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    // Create a new object to store transformed data
    const transformed = {};

    // Iterate through all keys in the object
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            // Recursively process nested objects and arrays
            console.log(`Processing key: ${key}`);
            transformed[key] = tickerAndOptionsIterator(data[key], converterFunction);
        }
    }

    return transformed;
};

export default tickerAndOptionsIterator;