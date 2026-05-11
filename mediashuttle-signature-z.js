const crypto = require("crypto");

module.exports = function (RED) {

  function MediaShuttleSignatureZNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.status({});

    node.on("input", function (msg, send, done) {
      // Node-RED < 1.0 compatibility
      send = send || function () { node.send.apply(node, arguments); };
      done = done || function (err) { if (err) node.error(err, msg); };

      try {
        // Resolve TypedInput fields (str / msg / flow / global / env)
        const portalPrefix = RED.util.evaluateNodeProperty(
          config.portalPrefix, config.portalPrefixType || "str", node, msg
        ) || "";

        const packageId = RED.util.evaluateNodeProperty(
          config.packageId, config.packageIdType || "str", node, msg
        ) || "";

        const requestType = RED.util.evaluateNodeProperty(
          config.requestType, config.requestTypeType || "str", node, msg
        ) || "";

        // registrationKey: msg overrides credential (credential is encrypted at rest)
        const registrationKey =
          msg.registrationKey ||
          (node.credentials && node.credentials.registrationKey) ||
          "";

        const missing = [
          !portalPrefix    && "portalPrefix",
          !packageId       && "packageId",
          !registrationKey && "registrationKey",
          !requestType     && "requestType"
        ].filter(Boolean);

        if (missing.length > 0) {
          node.status({ fill: "red", shape: "dot", text: "missing: " + missing.join(", ") });
          done(new Error("Missing required parameters: " + missing.join(", ")));
          return;
        }

        const timestamp = new Date().toISOString();
        const baseUrl = `https://${portalPrefix}.mediashuttle.com/metadata/v3.0/portal/${portalPrefix}/package/${packageId}`;

        function generateSignedUrl(requestUrl, body) {
          const algorithmParam = "X-Sig-Algorithm=SIG1-HMAC-SHA256";
          const dateParam      = `X-Sig-Date=${timestamp}`;

          // Encode each key=value pair as the MediaShuttle SIG1 spec requires
          const canonicalQueryString =
            `${encodeURIComponent(algorithmParam)}&${encodeURIComponent(dateParam)}`;

          const requestBodyHash = crypto
            .createHash("sha256")
            .update(body || "")
            .digest("hex");

          const stringToSign =
            `${timestamp}\n${requestUrl}\n${canonicalQueryString}\n${requestBodyHash}`;

          const signingKey = crypto
            .createHmac("sha256", registrationKey)
            .update(timestamp)
            .digest();

          const signature = crypto
            .createHmac("sha256", signingKey)
            .update(stringToSign)
            .digest("hex");

          return `${requestUrl}?${algorithmParam}&${dateParam}&X-Sig-Signature=${signature}`;
        }

        if (requestType === "GetPackageDetails") {
          msg.method = "GET";
          msg.url    = generateSignedUrl(baseUrl, "");
          node.status({ fill: "green", shape: "dot", text: "GetPackageDetails" });

        } else if (requestType === "RedirectPackageMetadata") {
          // Accept string or object (auto-serialise to JSON)
          const body =
            typeof msg.payload === "string"  ? msg.payload :
            msg.payload != null              ? JSON.stringify(msg.payload) :
            "";

          msg.method  = "POST";
          msg.url     = generateSignedUrl(`${baseUrl}/metadata`, body);
          msg.headers = Object.assign({}, msg.headers, {
            "Content-Type": "application/json"
          });
          node.status({ fill: "green", shape: "dot", text: "RedirectPackageMetadata" });

        } else {
          node.status({ fill: "red", shape: "dot", text: `unknown: ${requestType}` });
          done(new Error(`Unknown requestType: "${requestType}"`));
          return;
        }

        send(msg);
        done();

      } catch (err) {
        node.status({ fill: "red", shape: "dot", text: err.message });
        done(err);
      }
    });

    node.on("close", function () {
      node.status({});
    });
  }

  RED.nodes.registerType("mediashuttlesignature-z", MediaShuttleSignatureZNode, {
    credentials: {
      registrationKey: { type: "password" }
    }
  });
};
