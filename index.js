const tls = require("node:tls");
const https = require("node:https");
const x509 = require("@peculiar/x509");

const sqvw = require("sgx-quote-verify-wasm");

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          resolve({ data });
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

function getWithHeader(url, headerName) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          const headerValue = response.headers[headerName];
          if (headerValue) {
            resolve({ data, headerValue });
          } else {
            reject(new Error(`Header "${headerName}" not found`));
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

function getRootCaCrl(pccs_url) {
  return get(`https://${pccs_url}/sgx/certification/v3/rootcacrl`);
}

function getPckCrl(pccs_url, ca_ident) {
  return getWithHeader(
    `https://${pccs_url}/sgx/certification/v4/pckcrl?ca=${ca_ident}`,
    "sgx-pck-crl-issuer-chain",
  );
}

function getTcb(pccs_url, fmspc) {
  return getWithHeader(
    `https://${pccs_url}/sgx/certification/v4/tcb?fmspc=${fmspc}`,
    "tcb-info-issuer-chain",
  );
}

function getQeIdentity(pccs_url) {
  return getWithHeader(
    `https://${pccs_url}/sgx/certification/v4/qe/identity`,
    "sgx-enclave-identity-issuer-chain",
  );
}

// This method takes in the pccs url, the SGX quote, the CA identifier ("processor" or "platform"), and the expected MREnclave,
// and performs a remote attestation.
function verify(pccsUrl, quote, caIdentifier, expectedMrenclave) {
  return new Promise((resolve, reject) => {
    if (caIdentifier != "processor" && caIdentifier != "platform") {
      reject(new Error(`Invalid CA identifier: ${caIdentifier}`));
    }
    const fmspc = sqvw.get_fmspc_from_quote(quote);
    Promise.all([
      getRootCaCrl(pccsUrl),
      getPckCrl(pccsUrl, caIdentifier),
      getTcb(pccsUrl, fmspc),
      getQeIdentity(pccsUrl),
    ])
      .then((values) => {
        const rootCaCrl = values[0]["data"];
        const pckCrl = values[1]["data"];
        const pckChain = values[1]["headerValue"];
        const tcbInfo = values[2]["data"];
        const tcbChain = values[2]["headerValue"];
        const qeIdent = values[3]["data"];
        const qeChain = values[3]["headerValue"];

        const now = Date.now();

        let res = sqvw.verify(
          quote,
          expectedMrenclave,
          rootCaCrl,
          pckChain,
          pckCrl,
          tcbChain,
          tcbInfo,
          qeChain,
          qeIdent,
          now.toString(),
        );
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

exports.verify = verify;
