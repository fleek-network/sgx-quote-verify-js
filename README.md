# SGX Remote Attestation Library

A NodeJS package for performing remote attestation of SGX (Software Guard Extensions) enclaves. This library simplifies the process of verifying enclave quotes and ensuring the authenticity and integrity of SGX enclaves.

## Installation

```bash
npm install @fleek-platform/sgx-quote-verify
```

## Overview

This library provides tools for verifying SGX quotes through remote attestation. It handles the complete attestation flow including certificate chain validation, revocation checks, and quote verification.

## Dependencies

- `@fleek-platform/sgx-quote-verify-wasm`: WebAssembly module that performs the core quote verification operations
- `node:https`: For making HTTPS requests to the attestation service

## Usage

The library exposes a single public function for performing remote attestation:

```javascript
const sgxVerify = require('@fleek-platform/sgx-quote-verify');

try {
    const result = await sgxVerify.verify(
        attestationServiceUrl,  // URL of the attestation service
        quote,                 // SGX quote (binary)
        caIdentifier,          // "processor" or "platform"
        expectedMrenclave      // Expected measurement value
    );
    console.log("Attestation successful:", result);
} catch (error) {
    console.error("Attestation failed:", error);
}
```

## API Reference

### verify(attestationServiceUrl, quote, caIdentifier, expectedMrenclave)

Performs remote attestation of an SGX quote by validating it against an attestation service.

#### Parameters

- `attestationServiceUrl` (string): The URL of the attestation service
- `quote` (Buffer): The SGX quote in binary format
- `caIdentifier` (string): The CA identifier, must be either "processor" or "platform"
- `expectedMrenclave` (string): The expected enclave measurement value to verify against

#### Returns

Returns a Promise that resolves with the attestation result or rejects with an error if verification fails.

## Attestation Flow

The verification process includes the following steps:

1. Extract necessary identifiers from the quote
2. Retrieve required certificates and verification data:
   - Root CA Certificate Revocation List
   - Platform certificates and their chains
   - Current security status information
   - Enclave identity information
3. Perform comprehensive verification:
   - Validate certificate chains
   - Check certificate revocations
   - Verify quote signatures
   - Match enclave measurements
   - Validate security status
   - Verify timestamp validity

## Error Handling

The library will throw errors in the following cases:
- Invalid CA identifier specification
- Failed communication with attestation service
- Missing required verification data
- Invalid certificates or revocation lists
- Quote verification failures
- Enclave measurement mismatches
- Invalid security status

## Security Considerations

When using this library for remote attestation, consider the following:

- Use a trusted attestation service
- Verify that the enclave measurements match your expected values
- Maintain up-to-date security information
- Ensure secure communication with the attestation service
- Implement proper error handling for all verification steps
- Consider implementing additional application-specific verification checks

## Example Implementation

```javascript
const sgxVerify = require('@fleek-platform/sgx-quote-verify');

async function verifyEnclaveQuote(quote, expectedMeasurement) {
    try {
        const attestationService = 'your-attestation-service.com';
        const result = await sgxVerify.verify(
            attestationService,
            quote,
            'processor',
            expectedMeasurement
        );
        
        // Additional application-specific verification
        if (result) {
            // Process successful attestation
            return true;
        }
    } catch (error) {
        console.error('Attestation failed:', error.message);
        throw error;
    }
}
```