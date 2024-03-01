# corvina-insert-bulk

## Description
This program is designed to insert bulk data to Corvina Cloud.

## Installation
To install the program, you can use npm:
```bash
npm install -g corvina-insert-bulk
```

## Usage
```bash
corvina-insert-bulk send [options]
```

### Options
- `-f, --file <file>`: Specifies the file name to be sent.
- `-o, --organization <organization>`: Specifies the Corvina organization name.
- `-k, --xApiKey <xApiKey>`: Specifies the X-Api-Key, from Corvina Cloud.
- `-h, --hostname <hostname>`: Specifies the hostname of the destination.
- `-p, --port <port>`: Specifies the port number of the destination.

## Examples
```bash
corvina-insert-bulk send -f data.json -o "app.corvina.cloud" ---xApiKey abc123
```