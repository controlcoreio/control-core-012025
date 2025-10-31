# Legacy PAP Admin Server

**⚠️ DEPRECATED: This is a legacy component. Use cc-pap-api and cc-pap-pro-tenant for new implementations.**

A legacy fine-grained policy agent server for ControlCore.io based on the OPAL server. This component has been superseded by the modern cc-pap-api and cc-pap-pro-tenant implementations.

## Overview

This repository contains a Docker image for the legacy ControlCore Policy Admin Server, which is built on top of the [OPAL server](https://github.com/permitio/opal). This component is maintained for backward compatibility only.

## Migration

For new implementations, use:

- **cc-pap-api**: Single-tenant Policy Administration Point API
- **cc-pap-pro-tenant**: Multi-tenant Policy Administration Point API
- **cc-pap**: Modern Policy Administration Point frontend

## Legacy Docker Image

The Docker image is built from the `permitio/opal-server:latest` base image and includes the necessary configuration for the legacy ControlCore Policy Admin Server.

## Access docker from ECR

```shell
# Ensure you already have aws configure and have the acesskeyid and accesskeysecret set in ~/.aws/credentials
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin 061730756658.dkr.ecr.ca-central-1.amazonaws.com
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
