## ⚠️ Project Origin

This project is an **adaptation and extension** of the original
MediaShuttle Metadata Signature Generator developed by Signiant.

Original project:
- Repository: https://github.com/Signiant/mediashuttle-metadata-signature-generator
- Author: Signiant Inc.

Changes and additions in this project:
- Adaptation as a Node-RED custom node
- Integration with Node-RED credential management
- Support for TypedInput (msg / flow / global / env)
- Automatic preparation of HTTP request parameters
- Node-RED–specific error handling and status reporting

------------------------------------------------------------------------------------------------------------------------------

node-red-contrib-mediashuttle-signature-z 

Node-RED custom node to generate MediaShuttle SIG1 (HMAC-SHA256) signed URLs for the MediaShuttle Metadata API (v3.0). 

The node prepares authenticated HTTP requests by calculating the required signature and query parameters, allowing downstream nodes (for example http request) to execute MediaShuttle API calls without manual cryptographic handling. 

 

✨ Features 

    Generates SIG1-HMAC-SHA256 signatures compliant with MediaShuttle specifications 

    Supports multiple request types 

    Uses Node-RED credentials to securely store the registrationKey 

    Supports Node-RED TypedInput (string, msg, flow, global, env) 

    Automatically sets HTTP method, URL, and headers 

 

📦 Installation 

From the Node-RED editor: 

1     Menu → Manage palette → Install → node-red-contrib-mediashuttle-signature-z 

Or via npm: 

1     npm install node-red-contrib-mediashuttle-signature-z 

Restart Node-RED after installation. 

 

🧩 Node: MediaShuttle Signature Z 

Purpose 

This node does not perform the HTTP call itself. It prepares a signed request by setting: 

    msg.method 

    msg.url 

    (optionally) msg.headers 

These can then be passed to a Node-RED HTTP Request node. 

 

⚙️ Configuration 

Node Properties 

Property 
	

Description 

Portal Prefix 
	

MediaShuttle portal name (e.g. myportal) 

Package ID 
	

MediaShuttle package identifier 

Request Type 
	

Type of MediaShuttle API request 

All fields support TypedInput (str, msg, flow, global, env). 

Credentials 

Credential 
	

Description 

Registration Key 
	

MediaShuttle registration key (stored securely) 

The credential can be overridden at runtime by providing: 

1     msg.registrationKey 

 

🔁 Supported Request Types 

1️⃣ GetPackageDetails 

Retrieves metadata for a MediaShuttle package. 

Behavior: 

    HTTP Method: GET 

    Body: empty 

Generated URL format: 

1      

Output: 

1     msg.method = "GET" 

2     msg.url    = "<signed url>" 

 

2️⃣ RedirectPackageMetadata 

Redirects or updates package metadata using a POST request. 

Input: 

    msg.payload can be: 

    a JavaScript object (auto-converted to JSON) 

    a JSON string 

Behavior: 

    HTTP Method: POST 

    Content-Type: application/json 

Output: 

1     msg.method  = "POST" 

2     msg.url     = "<signed url>" 

3     msg.headers = { 

4       "Content-Type": "application/json" 

5     } 

 

🔐 Signature Generation Details 

The node performs the following steps: 

    Generates an ISO 8601 timestamp 

    Hashes the request body using SHA-256 

    Builds a canonical query string 

    Derives a signing key using: 

1     HMAC-SHA256(registrationKey, timestamp) 

    Generates the final signature using: 

1     HMAC-SHA256(signingKey, stringToSign) 

The signature is appended to the request URL as X-Sig-Signature. 

 

✅ Error Handling 

The node will fail if any required parameter is missing: 

    portalPrefix 

    packageId 

    registrationKey 

    requestType 

Visual feedback is provided via node status indicators in the editor. 

 

🔧 Example Flow 

1     [ Inject ] 

2         ↓ 

3     [ MediaShuttle Signature Z ] 

4         ↓ 

5     [ HTTP Request ] 

Example payload for RedirectPackageMetadata: 

1     msg.payload = { 

2       title: "New Package Title", 

3       description: "Updated via Node-RED" 

4     } 

 

🛡️ Compatibility 

    Node-RED ≥ 0.20 

    Node.js ≥ 12 

Backward compatibility for Node-RED < 1.0 is included. 

 

📄 License 

MIT 

 

👤 Author 

zzzcrosss 

 

📝 Notes 

This node is intended for backend / automation usage where MediaShuttle API authentication is required. It does not expose cryptographic secrets in messages or logs. 
