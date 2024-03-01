const undici = require('undici');
async function parseData(context, data) {
    // Split the data by lines
    const lines = data.split('\n');
    let mapDevice = new Map();
    let firstLine = true;
    for (let line of lines) {
        if (firstLine || line === '') {
            firstLine = false;
            continue;
        }


        const parts = line.split(',');
        const [deviceId, modelPath, timestamp, value] = parts;
        let mapModelPath = mapDevice.get(deviceId);
        if (!mapModelPath) {
            mapModelPath = new Map();
            mapDevice.set(deviceId, mapModelPath);
        }

        let modelPathData = mapModelPath.get(modelPath);
        if (!modelPathData) {
            modelPathData = [];
            mapModelPath.set(modelPath, modelPathData);
        }
        modelPathData.push([timestamp, parseFloat(value)]);
    }

    let postData = [];
    let modelPaths = new Map();
    for (const [deviceId, mapModelPath] of mapDevice) {
        for (const [modelPath, data] of mapModelPath) {
            if (!modelPaths.has(modelPath))
                modelPaths.set(modelPath, await getPropertyType(context, modelPath));
            const payload = {
                deviceId,
                modelPath,
                header: ["timestamp", "value"],
                types: ["datetime", modelPaths.get(modelPath)],
                data
            }
            postData.push(payload);
        }
    }
    return postData;
}

async function sendDatatoCorvina(context, data) {
    const options = {
        hostname: 'app.' + context.hostname,
        port: context.port || 80,
        path: `/svc/platform/api/v1/organizations/${context.organization}/devices/bulkInsertTags?ifNotExists=true`,
        method: 'POST',
        headers: {
            'accept': '*/*',
            'X-Api-Key': context.xApiKey,
            'Content-Type': 'application/json'
        }
    };
    // send request using undici
    const client = new undici.Client(`https://${options.hostname}:${options.port}`);
    const body = JSON.stringify(data);
    const { statusCode, headers, body: responseBody } = await client.request({
        path: options.path,
        method: options.method,
        headers: options.headers,
        body
    });
    console.log("Data sent to Corvina");
    console.log("Response: ", statusCode == 200 ? "Done!" : statusCode, await responseBody.text());
}

async function getOrganizationID(context, org) {
    const options = {
        hostname: 'app.' + context.hostname,
        port: context.port || 80,
        path: `/svc/license/api/v1/organizations/${org}`,
        method: 'GET',
        headers: {
            'accept': '*/*',
            'X-Api-Key': context.xApiKey
        }
    };
    // send request using undici
    const client = new undici.Client(`https://${options.hostname}:${options.port}`);
    const { statusCode, headers, body } = await client.request({
        path: options.path,
        method: options.method,
        headers: options.headers
    });
    return (await body.json()).orgCoreId;
}

async function getPropertyType(context, modelPath) {
    const tagIndex = modelPath.indexOf('/');
    if (tagIndex === -1) {
        throw "Invalid modelPath: " + modelPath;
    }
    const tag = modelPath.substring(tagIndex + 1);
    const modelAndVersion = modelPath.substring(0, tagIndex);
    const model = modelAndVersion.split(':')[0];
    let version = modelAndVersion.split(':')[1];
    version = version.indexOf('.') === -1 ? version + ".0.0" : version;
    const options = {
        hostname: 'app.' + context.hostname,
        port: context.port || 80,
        path: `/svc/mappings/api/v1/models?name=${model}&version=${version}&organization=${context.organizationName}`,
        method: 'GET',
        headers: {
            'accept': '*/*',
            'X-Api-Key': context.xApiKey
        }
    };
    // send request using undici
    const client = new undici.Client(`https://${options.hostname}:${options.port}`);
    const { statusCode, headers, body } = await client.request({
        path: options.path,
        method: options.method,
        headers: options.headers
    });
    const models = await body.json();
    if (models.data.length === 0) {
        throw "Model not found: " + modelAndVersion;
    }
    const type = findTagType(models.data[0].json.properties, tag);
    if (!type) {
        throw "Cannot get type of: " + modelPath;
    }
    return type;
}

function findTagType(properties, tag) {
    if(tag in properties) {
        return properties[tag].type;
    }
    for(let property in properties) {
        if(property.properties) {
            let type = findTagType(property.properties, tag);
            if(type) {
                return type;
            }
        }
    }
    return null;
}

exports.parseData = parseData;
exports.sendDatatoCorvina = sendDatatoCorvina;
exports.getOrganizationID = getOrganizationID;
exports.getPropertyType = getPropertyType;
exports.findTagType = findTagType;