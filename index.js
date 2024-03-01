const fs = require('fs');
const { getOrganizationID, parseData, sendDatatoCorvina } = require('./corvina');
const { Command } = require('commander');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.removeAllListeners('warning');

// Read the file data.json
async function main() {
    // use commander to get previous values from the command line
    const program = new Command();
    program
        .command('send')
        .option('-f, --file <file>', 'File name')
        .option('-o, --organization <organization>', 'Organization name')
        .option('-k, --xApiKey <xApiKey>', 'X-Api-Key')
        .option('-h, --hostname <hostname>', 'Hostname')
        .option('-p, --port <port>', 'Port')
        .action(async (options) => {
            let xApiKey;
            if (options.xApiKey) {
                xApiKey = options.xApiKey;
            } else {
                console.log("You must provide the X-Api-Key");
                return;
            }

            let filename = options.file || 'data.json';
            let organizationName = options.organization || 'exor';
            let hostname = options.hostname || 'corvina.fog';
            let port = options.port || 10443;
            const context = {
                xApiKey, 
                hostname, 
                port,
                organization: "",
                organizationName
            };    
            console.log("Reading file: data.json");
            const data = fs.readFileSync(filename, 'utf8');
            context.organization = await getOrganizationID(context, organizationName, hostname, port);
            console.log("Preparing to send data to Corvina.");
            const postData = await parseData(context, data);
            console.log("Data are ready, I will send now to Corvina.");
            sendDatatoCorvina(context, postData);
        });
    program.parse();
}

console.log("----------------------");
console.log("- Hello Corvina Team -");
console.log("----------------------");
main();



